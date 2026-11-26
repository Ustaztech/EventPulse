import type { IncomingMessage, ServerResponse } from 'http'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateSecureToken } from './auth.js'
import { sendTransactionalEmail } from './mailer.js'

type AuthUser = { id: string; email: string; name: string; role: string }
type Dependencies = {
  client: SupabaseClient | null
  req: IncomingMessage
  res: ServerResponse
  pathname: string
  method: string
  query: URLSearchParams
  clientIp: string
  getAuthUser: (req: IncomingMessage) => Promise<AuthUser | null>
  parseBody: (req: IncomingMessage) => Promise<any>
  sendJson: (res: ServerResponse, statusCode: number, data: any) => void
}

const EVENT_SELECT = '*, category:categories(id,name,slug,color)'
const ACTIVE_REGISTRATION_STATUSES = ['CONFIRMED', 'ATTENDED']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isAdmin(role: string) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function eventResponse(row: any) {
  if (!row) return row
  const category = Array.isArray(row.category) ? row.category[0] : row.category
  const { category: _category, ...event } = row
  return {
    ...event,
    category_name: category?.name ?? row.category_name,
    category_slug: category?.slug ?? row.category_slug,
    category_color: category?.color ?? row.category_color,
  }
}

function registrationResponse(row: any, name = '', email = '') {
  if (!row) return row
  const event = Array.isArray(row.event) ? row.event[0] : row.event
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
  const { profile: _profile, ...registration } = row
  return {
    ...registration,
    user_name: profile?.display_name || name || 'Attendee',
    user_email: email,
    event: event ? eventResponse(event) : undefined,
  }
}

function safeSearch(value: string) {
  return value.replace(/[%,*()\\"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

async function getEvent(client: SupabaseClient, identifier: string) {
  const bySlug = await client.from('events').select(EVENT_SELECT).eq('slug', identifier).maybeSingle()
  if (bySlug.data || !UUID_PATTERN.test(identifier)) return { data: bySlug.data, error: bySlug.error }
  return client.from('events').select(EVENT_SELECT).eq('id', identifier).maybeSingle()
}

async function audit(client: SupabaseClient, user: AuthUser, action: string, entityType: string, entityId: string | undefined, details: string, ip: string) {
  const { error } = await client.from('audit_logs').insert({
    user_id: user.id,
    user_name: user.name,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: ip,
  })
  if (error) console.error('[EventPulse] Audit write failed:', error.message)
}

async function notify(client: SupabaseClient, userId: string, title: string, message: string, eventId: string, type: string) {
  const { error } = await client.from('in_app_notifications').insert({ user_id: userId, title, message, event_id: eventId, type })
  if (error) console.error('[EventPulse] Notification write failed:', error.message)
}

async function queueAndSendEmail(client: SupabaseClient, payload: {
  to: string
  name: string
  subject: string
  html: string
  text: string
  eventId: string
  userId: string
  notificationType: string
  idempotencyKey: string
}) {
  const { data: job, error } = await client.from('email_outbox').insert({
    recipient_email: payload.to,
    recipient_name: payload.name,
    subject: payload.subject,
    body_html: payload.html,
    body_text: payload.text,
    event_id: payload.eventId,
    user_id: payload.userId,
    notification_type: payload.notificationType,
    idempotency_key: payload.idempotencyKey,
    status: 'PROCESSING',
    attempt_count: 1,
    last_attempt_at: new Date().toISOString(),
  }).select('id').single()

  if (error) {
    if (error.code !== '23505') console.error('[EventPulse] Email outbox write failed:', error.message)
    return
  }

  const delivery = await sendTransactionalEmail({
    to: payload.to,
    recipientName: payload.name,
    subject: payload.subject,
    bodyHtml: payload.html,
    bodyText: payload.text,
    category: 'ticket',
  })
  await client.from('email_outbox').update({
    status: delivery.success ? 'SENT' : 'FAILED',
    provider: delivery.provider,
    provider_message_id: delivery.providerMessageId,
    error_message: delivery.error ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id)
}

export async function handleEventWorkflowRequest(deps: Dependencies): Promise<boolean> {
  const { client, req, res, pathname, method, query, clientIp, getAuthUser, parseBody, sendJson } = deps
  const categoryList = pathname === '/api/categories' && method === 'GET'
  const categoryCreate = pathname === '/api/categories' && method === 'POST'
  const venueList = pathname === '/api/venues' && method === 'GET'
  const mailSend = pathname === '/api/mail/send' && method === 'POST'
  const eventList = pathname === '/api/events' && method === 'GET'
  const eventDetail = pathname.startsWith('/api/events/') && method === 'GET'
  const createEvent = pathname === '/api/events' && method === 'POST'
  const editEvent = pathname.startsWith('/api/events/') && method === 'PUT'
  const eventStatus = pathname.startsWith('/api/events/') && pathname.endsWith('/status') && method === 'POST'
  const register = pathname.startsWith('/api/events/') && pathname.endsWith('/register') && method === 'POST'
  const unregister = pathname.startsWith('/api/events/') && pathname.endsWith('/unregister') && method === 'POST'
  const myRegistrations = pathname === '/api/registrations/my' && method === 'GET'
  const attendees = pathname.startsWith('/api/registrations/event/') && method === 'GET'
  const scan = pathname === '/api/registrations/scan-qr' && method === 'POST'
  if (!categoryList && !categoryCreate && !venueList && !mailSend && !eventList && !eventDetail && !createEvent && !editEvent && !eventStatus && !register && !unregister && !myRegistrations && !attendees && !scan) return false
  if (!client) {
    sendJson(res, 503, { error: 'Event data service is unavailable.' })
    return true
  }

  try {
    if (categoryList) {
      const { data, error } = await client.from('categories').select('*').eq('is_active', true).order('name', { ascending: true })
      if (error) throw error
      return sendJson(res, 200, { categories: data || [] }), true
    }

    if (categoryCreate) {
      const user = await getAuthUser(req)
      if (!user || !isAdmin(user.role)) return sendJson(res, 403, { error: 'Administrator access required.' }), true
      const body = await parseBody(req)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
      if (!name || !slug) return sendJson(res, 400, { error: 'Category name and slug are required.' }), true
      const { data, error } = await client.from('categories').insert({
        name,
        slug,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || '#2563eb',
        is_active: true,
      }).select('*').single()
      if (error) throw error
      return sendJson(res, 201, { success: true, category: data }), true
    }

    if (venueList) {
      const { data, error } = await client.from('venues').select('*').eq('is_active', true).order('name', { ascending: true })
      if (error) throw error
      return sendJson(res, 200, { venues: data || [] }), true
    }

    if (mailSend) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Please sign in again before sending email.' }), true
      if (!isAdmin(user.role) && user.role !== 'ORGANIZER') return sendJson(res, 403, { error: 'Only administrators and event organizers can send email.' }), true
      const body = await parseBody(req)
      const to = typeof body.to === 'string' ? body.to.trim() : ''
      const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
      const html = typeof body.html === 'string' ? body.html : ''
      const text = typeof body.text === 'string' ? body.text : ''
      const recipientName = typeof body.recipientName === 'string' ? body.recipientName.trim().slice(0, 120) : ''
      const categories = ['welcome', 'new_event', 'approaching', 'happening_now', 'custom', 'ticket', 'security'] as const
      const category = categories.includes(body.category) ? body.category : 'custom'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject || subject.length > 200 || !html || html.length > 200_000) {
        return sendJson(res, 400, { error: 'Enter a valid recipient, a subject under 200 characters, and email content.' }), true
      }
      const { data: job, error } = await client.from('email_outbox').insert({
        recipient_email: to,
        recipient_name: recipientName || to,
        subject,
        body_html: html,
        body_text: text || html.replace(/<[^>]*>?/gm, '').trim(),
        notification_type: 'ANNOUNCEMENT',
        scheduled_for: new Date().toISOString(),
        status: 'PROCESSING',
        attempt_count: 1,
        max_attempts: 3,
        last_attempt_at: new Date().toISOString(),
        user_id: user.id,
        idempotency_key: `mail-send-${user.id}-${Date.now()}-${generateSecureToken(12)}`,
      }).select('id').single()
      if (error) throw error
      const delivery = await sendTransactionalEmail({ to, recipientName, subject, bodyHtml: html, bodyText: text, category })
      await client.from('email_outbox').update({
        status: delivery.success ? delivery.status : 'FAILED',
        provider: delivery.provider,
        provider_message_id: delivery.providerMessageId,
        error_message: delivery.error ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id)
      if (!delivery.success) return sendJson(res, 502, { success: false, jobId: job.id, error: delivery.error || 'The email service could not accept this message.' }), true
      await audit(client, user, 'MAIL_DISPATCH', 'Email', delivery.providerMessageId || job.id, `Sent email to ${to}: ${subject}`, clientIp)
      return sendJson(res, 200, { success: true, messageId: delivery.providerMessageId, provider: delivery.provider, jobId: job.id, status: delivery.status }), true
    }

    if (eventList) {
      const user = await getAuthUser(req)
      const includeDrafts = query.get('includeDrafts') === 'true'
      const canViewDrafts = includeDrafts && !!user && (user.role === 'ORGANIZER' || isAdmin(user.role))
      let request = client.from('events').select(EVENT_SELECT)
      const status = query.get('status')
      if (canViewDrafts && status) request = request.eq('status', status)
      else if (!canViewDrafts) request = request.eq('status', 'PUBLISHED')
      if (canViewDrafts && user?.role === 'ORGANIZER') request = request.eq('organizer_id', user.id)
      const organizerId = query.get('organizerId')
      if (organizerId && organizerId !== 'all') request = request.eq('organizer_id', organizerId)
      const format = query.get('format')
      if (format && format !== 'all') request = request.eq('format', format)
      const startDate = query.get('startDate')
      const endDate = query.get('endDate')
      if (startDate) request = request.gte('start_time', startDate)
      if (endDate) request = request.lte('start_time', endDate)
      const timeline = query.get('timeline')
      const now = new Date().toISOString()
      if (timeline === 'upcoming') request = request.gt('start_time', now).neq('status', 'CANCELLED')
      if (timeline === 'ongoing') request = request.lte('start_time', now).gte('end_time', now).neq('status', 'CANCELLED')
      if (timeline === 'past') request = request.lt('end_time', now).neq('status', 'CANCELLED')
      if (timeline === 'cancelled' && canViewDrafts) request = request.eq('status', 'CANCELLED')
      const search = safeSearch(query.get('search') || '')
      if (search) request = request.or(`title.ilike.%${search}%,description.ilike.%${search}%,venue_name.ilike.%${search}%,organizer_name.ilike.%${search}%`)
      const campus = safeSearch(query.get('campus') || '')
      if (campus && campus !== 'all') request = request.or(`campus_area.ilike.%${campus}%,venue_name.ilike.%${campus}%`)
      const category = query.get('category')
      if (category && category !== 'all') {
        let categoryId = UUID_PATTERN.test(category) ? category : null
        if (!categoryId) {
          const bySlug = await client.from('categories').select('id').eq('slug', category).maybeSingle()
          const byName = bySlug.data ? null : await client.from('categories').select('id').ilike('name', category).maybeSingle()
          categoryId = bySlug.data?.id ?? byName?.data?.id ?? null
        }
        if (!categoryId) return sendJson(res, 200, { events: [] }), true
        request = request.eq('category_id', categoryId)
      }
      const sort = query.get('sort')
      if (sort === 'date-desc') request = request.order('start_time', { ascending: false })
      else if (sort === 'popular') request = request.order('registered_count', { ascending: false }).order('start_time', { ascending: true })
      else if (sort === 'alpha') request = request.order('title', { ascending: true })
      else request = request.order('start_time', { ascending: true })
      const { data, error } = await request.limit(500)
      if (error) throw error
      return sendJson(res, 200, { events: (data || []).map(eventResponse) }), true
    }

    if (eventDetail) {
      const user = await getAuthUser(req)
      const identifier = decodeURIComponent(pathname.slice('/api/events/'.length))
      const { data, error } = await getEvent(client, identifier)
      if (error) throw error
      if (!data || (data.status !== 'PUBLISHED' && (!user || (!isAdmin(user.role) && data.organizer_id !== user.id)))) {
        return sendJson(res, 404, { error: 'Event not found.' }), true
      }
      return sendJson(res, 200, { event: eventResponse(data) }), true
    }

    if (createEvent) {
      const user = await getAuthUser(req)
      if (!user || (user.role !== 'ORGANIZER' && !isAdmin(user.role))) return sendJson(res, 403, { error: 'An approved organizer account is required to create events.' }), true
      const body = await parseBody(req)
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      const description = typeof body.description === 'string' ? body.description.trim() : ''
      if (!title || !description || !body.categoryId || !body.startTime || !body.endTime) return sendJson(res, 400, { error: 'Title, description, category, start time, and end time are required.' }), true
      const start = new Date(body.startTime)
      const end = new Date(body.endTime)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return sendJson(res, 400, { error: 'Event end time must be after start time.' }), true
      const status = isAdmin(user.role) && body.status === 'PUBLISHED' ? 'PUBLISHED' : body.asDraft ? 'DRAFT' : 'PENDING_APPROVAL'
      const suffix = generateSecureToken(4).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)
      const payload = {
        title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${suffix}`,
        description,
        banner_url: body.bannerUrl || null,
        category_id: body.categoryId,
        organizer_id: user.id,
        organizer_name: user.name,
        organizer_contact: body.organizerContact || user.email,
        target_audience: body.targetAudience || 'UNIVERSITY_WIDE',
        target_faculty: body.targetFaculty || null,
        target_department: body.targetDepartment || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone: body.timezone || 'Africa/Lagos',
        format: body.format || 'PHYSICAL',
        venue_id: body.venueId || null,
        venue_name: body.venueName || null,
        building_hall: body.buildingHall || null,
        room_number: body.roomNumber || null,
        campus_area: body.campusArea || null,
        address: body.address || null,
        landmark: body.landmark || null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        directions_url: body.directionsUrl || null,
        online_platform: body.onlinePlatform || null,
        online_join_link: body.onlineJoinLink || null,
        restrict_join_link: body.restrictJoinLink !== false,
        requires_registration: body.requiresRegistration !== false,
        capacity: body.capacity === '' || body.capacity == null ? null : Number(body.capacity),
        registration_deadline: body.registrationDeadline || null,
        accessibility_info: body.accessibilityInfo || null,
        arrival_instructions: body.arrivalInstructions || null,
        status,
      }
      if (payload.capacity !== null && (!Number.isInteger(payload.capacity) || payload.capacity < 1)) return sendJson(res, 400, { error: 'Capacity must be a positive whole number.' }), true
      const { data, error } = await client.from('events').insert(payload).select(EVENT_SELECT).single()
      if (error) throw error
      await audit(client, user, 'EVENT_CREATE', 'Event', data.id, `Created event proposal: ${data.title}`, clientIp)
      return sendJson(res, 201, { success: true, event: eventResponse(data) }), true
    }

    if (editEvent) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' }), true
      const eventId = decodeURIComponent(pathname.slice('/api/events/'.length))
      const { data: existing, error: lookupError } = await client.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle()
      if (lookupError) throw lookupError
      if (!existing) return sendJson(res, 404, { error: 'Event not found.' }), true
      if (!isAdmin(user.role) && existing.organizer_id !== user.id) return sendJson(res, 403, { error: 'You can only edit your own events.' }), true
      const body = await parseBody(req)
      const fields: Record<string, string> = {
        title: 'title', description: 'description', bannerUrl: 'banner_url', categoryId: 'category_id',
        targetAudience: 'target_audience', targetFaculty: 'target_faculty', targetDepartment: 'target_department',
        startTime: 'start_time', endTime: 'end_time', format: 'format', venueId: 'venue_id', venueName: 'venue_name',
        buildingHall: 'building_hall', roomNumber: 'room_number', campusArea: 'campus_area', address: 'address',
        landmark: 'landmark', latitude: 'latitude', longitude: 'longitude', directionsUrl: 'directions_url',
        onlinePlatform: 'online_platform', onlineJoinLink: 'online_join_link', restrictJoinLink: 'restrict_join_link',
        requiresRegistration: 'requires_registration', capacity: 'capacity', registrationDeadline: 'registration_deadline',
        accessibilityInfo: 'accessibility_info', arrivalInstructions: 'arrival_instructions',
      }
      const patch: Record<string, any> = { updated_at: new Date().toISOString() }
      for (const [key, column] of Object.entries(fields)) if (body[key] !== undefined) patch[column] = body[key]
      if (patch.start_time) patch.start_time = new Date(patch.start_time).toISOString()
      if (patch.end_time) patch.end_time = new Date(patch.end_time).toISOString()
      if (patch.capacity !== undefined && patch.capacity !== null) {
        patch.capacity = Number(patch.capacity)
        if (!Number.isInteger(patch.capacity) || patch.capacity < 1) return sendJson(res, 400, { error: 'Capacity must be a positive whole number.' }), true
      }
      const proposedStart = new Date(patch.start_time ?? existing.start_time)
      const proposedEnd = new Date(patch.end_time ?? existing.end_time)
      if (Number.isNaN(proposedStart.getTime()) || Number.isNaN(proposedEnd.getTime()) || proposedStart >= proposedEnd) return sendJson(res, 400, { error: 'Event end time must be after start time.' }), true
      patch.start_time = proposedStart.toISOString()
      patch.end_time = proposedEnd.toISOString()
      const { data, error } = await client.from('events').update(patch).eq('id', eventId).select(EVENT_SELECT).single()
      if (error) throw error
      await audit(client, user, 'EVENT_UPDATE', 'Event', eventId, `Updated event: ${data.title}`, clientIp)
      return sendJson(res, 200, { success: true, event: eventResponse(data) }), true
    }

    if (eventStatus) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' }), true
      const eventId = pathname.split('/')[3]
      const { data: existing, error: lookupError } = await client.from('events').select(EVENT_SELECT).eq('id', eventId).maybeSingle()
      if (lookupError) throw lookupError
      if (!existing) return sendJson(res, 404, { error: 'Event not found.' }), true
      const body = await parseBody(req)
      const allowed = ['PUBLISHED', 'REJECTED', 'RETURNED_FOR_REVISION', 'CANCELLED', 'COMPLETED', 'ARCHIVED', 'DRAFT', 'PENDING_APPROVAL']
      if (!allowed.includes(body.status)) return sendJson(res, 400, { error: 'Invalid event status.' }), true
      const adminAction = ['PUBLISHED', 'REJECTED', 'RETURNED_FOR_REVISION', 'ARCHIVED'].includes(body.status)
      if (adminAction && !isAdmin(user.role)) return sendJson(res, 403, { error: 'Only administrators can perform this status change.' }), true
      if (!adminAction && !isAdmin(user.role) && existing.organizer_id !== user.id) return sendJson(res, 403, { error: 'You cannot change this event.' }), true
      if (!adminAction && !isAdmin(user.role) && body.status !== 'CANCELLED') return sendJson(res, 403, { error: 'Organizers may only cancel their own events.' }), true
      const { data, error } = await client.from('events').update({ status: body.status, approval_feedback: body.feedback || null, updated_at: new Date().toISOString() }).eq('id', eventId).select(EVENT_SELECT).single()
      if (error) throw error
      await audit(client, user, `EVENT_${body.status}`, 'Event', eventId, `Status changed to ${body.status}`, clientIp)
      if (body.status === 'CANCELLED') {
        const { data: registrations } = await client.from('registrations').select('user_id').eq('event_id', eventId).eq('status', 'CONFIRMED')
        for (const registration of registrations || []) await notify(client, registration.user_id, `Event cancelled: ${existing.title}`, `"${existing.title}" has been cancelled.`, eventId, 'EVENT_CANCELLED')
      }
      return sendJson(res, 200, { success: true, event: eventResponse(data) }), true
    }

    if (register) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'You must be signed in to register.' }), true
      const eventId = pathname.split('/')[3]
      const { data: event, error: eventError } = await client.from('events').select(EVENT_SELECT).eq('id', eventId).eq('status', 'PUBLISHED').maybeSingle()
      if (eventError) throw eventError
      if (!event) return sendJson(res, 404, { error: 'Published event not found.' }), true
      if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return sendJson(res, 400, { error: 'Registration has closed for this event.' }), true
      const { data: existing, error: existingError } = await client.from('registrations').select('*').eq('event_id', eventId).eq('user_id', user.id).maybeSingle()
      if (existingError) throw existingError
      if (existing && existing.status !== 'CANCELLED') return sendJson(res, 200, { success: true, registration: registrationResponse(existing, user.name, user.email) }), true
      let registration: any
      if (existing) {
        const { data, error } = await client.from('registrations').update({ status: 'CONFIRMED', cancellation_reason: null, registered_at: new Date().toISOString() }).eq('id', existing.id).select('*').single()
        if (error) throw error
        registration = data
      } else {
        const referenceCode = `EP-${Date.now().toString(36).toUpperCase()}-${generateSecureToken(5).toUpperCase()}`
        const { data, error } = await client.from('registrations').insert({
          event_id: eventId,
          user_id: user.id,
          reference_code: referenceCode,
          qr_token: generateSecureToken(32),
          status: 'CONFIRMED',
        }).select('*').single()
        if (error?.code === '23505') {
          const { data: duplicate } = await client.from('registrations').select('*').eq('event_id', eventId).eq('user_id', user.id).maybeSingle()
          if (duplicate) return sendJson(res, 200, { success: true, registration: registrationResponse(duplicate, user.name, user.email) }), true
        }
        if (error) throw error
        registration = data
      }
      await notify(client, user.id, 'Registration confirmed', `Your registration for "${event.title}" is confirmed. Reference: ${registration.reference_code}.`, eventId, 'REGISTRATION_CONFIRMATION')
      await queueAndSendEmail(client, {
        to: user.email,
        name: user.name,
        subject: `Registration confirmed: ${event.title}`,
        html: `<h2>Registration confirmed</h2><p>Hello ${escapeHtml(user.name)},</p><p>Your registration for <strong>${escapeHtml(event.title)}</strong> is confirmed.</p><p>Reference: <strong>${escapeHtml(registration.reference_code)}</strong></p>`,
        text: `Your registration for ${event.title} is confirmed. Reference: ${registration.reference_code}.`,
        eventId,
        userId: user.id,
        notificationType: 'REGISTRATION_CONFIRMATION',
        idempotencyKey: `registration-confirmation-${registration.id}`,
      })
      await audit(client, user, 'EVENT_REGISTER', 'Registration', registration.id, `Registered for ${event.title}`, clientIp)
      return sendJson(res, 201, { success: true, registration: registrationResponse(registration, user.name, user.email) }), true
    }

    if (unregister) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' }), true
      const eventId = pathname.split('/')[3]
      const { data, error } = await client.from('registrations').update({ status: 'CANCELLED', cancellation_reason: 'Cancelled by attendee' }).eq('event_id', eventId).eq('user_id', user.id).eq('status', 'CONFIRMED').select('*').maybeSingle()
      if (error) throw error
      if (!data) return sendJson(res, 404, { error: 'Active registration not found.' }), true
      await audit(client, user, 'EVENT_UNREGISTER', 'Registration', data.id, `Cancelled registration ${data.reference_code}`, clientIp)
      return sendJson(res, 200, { success: true, message: 'Registration cancelled.' }), true
    }

    if (myRegistrations) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' }), true
      const { data, error } = await client.from('registrations').select(`*, event:events(${EVENT_SELECT})`).eq('user_id', user.id).order('registered_at', { ascending: false })
      if (error) throw error
      return sendJson(res, 200, { registrations: (data || []).map((row: any) => registrationResponse(row, user.name, user.email)) }), true
    }

    if (attendees) {
      const user = await getAuthUser(req)
      if (!user) return sendJson(res, 401, { error: 'Unauthorized' }), true
      const eventId = pathname.slice('/api/registrations/event/'.length)
      const { data: event, error: eventError } = await client.from('events').select('id,organizer_id').eq('id', eventId).maybeSingle()
      if (eventError) throw eventError
      if (!event) return sendJson(res, 404, { error: 'Event not found.' }), true
      if (!isAdmin(user.role) && event.organizer_id !== user.id) return sendJson(res, 403, { error: 'You can only view attendee records for your own events.' }), true
      const { data, error } = await client.from('registrations').select('*, profile:profiles(display_name)').eq('event_id', eventId).order('registered_at', { ascending: false }).limit(500)
      if (error) throw error
      return sendJson(res, 200, { attendees: (data || []).map((row: any) => registrationResponse(row)) }), true
    }

    if (scan) {
      const user = await getAuthUser(req)
      if (!user || (user.role !== 'ORGANIZER' && !isAdmin(user.role))) return sendJson(res, 403, { error: 'Only approved organizers or administrators can check in attendees.' }), true
      const body = await parseBody(req)
      const code = typeof body.code === 'string' ? body.code.trim() : ''
      if (!/^[A-Za-z0-9-]{8,128}$/.test(code)) return sendJson(res, 400, { error: 'Enter a valid ticket code.' }), true
      const { data: registration, error } = await client.from('registrations').select('*, event:events(id,organizer_id,title), profile:profiles(display_name)').or(`qr_token.eq.${code},reference_code.eq.${code}`).maybeSingle()
      if (error) throw error
      if (!registration) return sendJson(res, 404, { error: 'Registration not found.' }), true
      if (!isAdmin(user.role) && registration.event?.organizer_id !== user.id) return sendJson(res, 403, { error: 'You can only check in attendees for your own events.' }), true
      if (registration.status === 'CANCELLED') return sendJson(res, 400, { error: 'This registration has been cancelled.' }), true
      if (registration.status === 'ATTENDED') return sendJson(res, 200, { success: true, attendee: registrationResponse(registration), alreadyCheckedIn: true }), true
      const { data: updated, error: updateError } = await client.from('registrations').update({ status: 'ATTENDED', attended_at: new Date().toISOString() }).eq('id', registration.id).select('*, event:events(id,organizer_id,title), profile:profiles(display_name)').single()
      if (updateError) throw updateError
      await audit(client, user, 'TICKET_SCAN', 'Registration', registration.id, `Checked in attendee ${registration.reference_code}`, clientIp)
      return sendJson(res, 200, { success: true, attendee: registrationResponse(updated) }), true
    }
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Supabase request failed.'
    if (message.includes('event_capacity_reached') || error?.code === '23514') return sendJson(res, 409, { error: 'This event has reached capacity.' }), true
    if (error?.code === '23505') return sendJson(res, 409, { error: 'This record already exists.' }), true
    console.error('[EventPulse] Supabase workflow request failed:', message)
    return sendJson(res, 500, { error: 'Unable to complete this request right now.' }), true
  }
  return false
}
