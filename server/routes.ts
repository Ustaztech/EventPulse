import type { IncomingMessage, ServerResponse } from 'http';
import { serverDb } from './db';
import { 
  hashPassword, 
  verifyPassword, 
  createSessionToken, 
  verifySessionToken, 
  generateSecureToken, 
  generateVerificationCode, 
  checkRateLimit, 
  resetRateLimit 
} from './auth';
import { scheduler } from './scheduler';

// Helper to parse JSON body
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protect against overly large payloads (max 2MB)
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Helper to extract query parameters
function parseQuery(urlStr: string): URLSearchParams {
  const queryIndex = urlStr.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(urlStr.slice(queryIndex));
}

// Helper to send JSON responses with security headers
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  res.end(JSON.stringify(data));
}

// Helper to extract authenticated user from Authorization header
function getAuthUser(req: IncomingMessage): any | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const res = verifySessionToken(token);
  return res.valid ? res.payload : null;
}

// Main HTTP request handler for /api/*
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '';
  const method = req.method || 'GET';
  const pathname = url.split('?')[0];
  const query = parseQuery(url);

  // Client IP helper
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION & ACCESS CONTROL
    // -------------------------------------------------------------

    // POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const rateKey = `reg_${clientIp}`;
      const rate = checkRateLimit(rateKey);
      if (!rate.allowed) {
        return sendJson(res, 429, { error: `Too many attempts. Please retry in ${rate.retryAfterSeconds} seconds.` });
      }

      const body = await parseBody(req);
      const { name, email, password, userType, matricOrStaffId, faculty, department, phone } = body;

      if (!name || !email || !password) {
        return sendJson(res, 400, { error: 'Name, email, and password are required.' });
      }

      if (password.length < 8) {
        return sendJson(res, 400, { error: 'Password must be at least 8 characters with letters and numbers.' });
      }

      const existing = serverDb.getUserByEmail(email);
      if (existing) {
        return sendJson(res, 409, { error: 'An account with this email address already exists.' });
      }

      // Check for Super Admin
      const isSuperAdmin = email.trim().toLowerCase() === 'yahayazaid2021@gmail.com';
      const assignedRole = isSuperAdmin ? 'ADMIN' : (userType === 'STAFF' ? 'STAFF' : 'STUDENT');
      const passwordHash = hashPassword(password);
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const newUser = serverDb.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: assignedRole,
        userType: userType === 'STAFF' ? 'STAFF' : 'STUDENT',
        matricOrStaffId: matricOrStaffId?.trim(),
        faculty: faculty?.trim(),
        department: department?.trim(),
        phone: phone?.trim(),
        verificationToken: isSuperAdmin ? undefined : verificationCode,
        verificationTokenExpiresAt: isSuperAdmin ? undefined : expiresAt,
        emailVerified: isSuperAdmin ? 1 : 0,
      });

      if (!isSuperAdmin) {
        // Queue email verification job
        serverDb.enqueueOutboxJob({
          recipientEmail: newUser.email,
          recipientName: newUser.name,
          subject: 'Verify Your EventPulse Campus Account',
          bodyHtml: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #1E40AF; margin-top: 0;">Welcome to EventPulse!</h2>
              <p>Dear ${newUser.name},</p>
              <p>Thank you for registering. Please enter the following 6-digit confirmation code to verify your campus email:</p>
              <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1E40AF; font-family: monospace;">${verificationCode}</span>
              </div>
              <p style="font-size: 13px; color: #64748b;">This code expires in 24 hours.</p>
            </div>
          `,
          bodyText: `Your EventPulse verification code is: ${verificationCode}. Enter this code to verify your account.`,
          notificationType: 'EMAIL_VERIFICATION',
          userId: newUser.id,
          idempotencyKey: `verify-${newUser.id}-${verificationCode}`,
        });
      }

      serverDb.logAudit(newUser.id, newUser.name, 'USER_REGISTER', 'User', newUser.id, `Registered as ${assignedRole}`, clientIp);

      const sessionToken = createSessionToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      return sendJson(res, 201, {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          userType: newUser.user_type,
          matricOrStaffId: newUser.matric_or_staff_id,
          faculty: newUser.faculty,
          department: newUser.department,
          phone: newUser.phone,
          emailVerified: isSuperAdmin ? true : false,
          createdAt: newUser.created_at,
        },
        token: sessionToken,
        message: isSuperAdmin ? 'Administrator account created successfully.' : 'Account created. Verification code dispatched to your email.',
      });
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const rateKey = `login_${clientIp}`;
      const rate = checkRateLimit(rateKey);
      if (!rate.allowed) {
        return sendJson(res, 429, { error: `Too many login attempts. Please retry in ${rate.retryAfterSeconds} seconds.` });
      }

      const body = await parseBody(req);
      const { email, password, rememberMe } = body;

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required.' });
      }

      const user = serverDb.getUserByEmail(email);
      // Account enumeration protection: identical error response
      if (!user || !verifyPassword(password, user.password_hash)) {
        return sendJson(res, 401, { error: 'Invalid email address or password. Please try again.' });
      }

      const isSuperAdmin = user.email.toLowerCase() === 'yahayazaid2021@gmail.com';
      if (isSuperAdmin) {
        if (user.role !== 'ADMIN') {
          serverDb.updateUserRole(user.id, 'ADMIN');
          user.role = 'ADMIN';
        }
        if (user.email_verified !== 1) {
          serverDb.verifyUserEmail(user.id);
          user.email_verified = 1;
        }
      }

      resetRateLimit(rateKey);

      serverDb.logAudit(user.id, user.name, 'USER_LOGIN', 'User', user.id, `Signed in as ${user.role}`, clientIp);

      const sessionToken = createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      }, !!rememberMe);

      return sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.user_type,
          matricOrStaffId: user.matric_or_staff_id,
          faculty: user.faculty,
          department: user.department,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          emailVerified: user.email_verified === 1,
          createdAt: user.created_at,
        },
        token: sessionToken,
      });
    }

    // POST /api/auth/admin-login (Dedicated Admin Entry Point)
    if (pathname === '/api/auth/admin-login' && method === 'POST') {
      const rateKey = `admin_login_${clientIp}`;
      const rate = checkRateLimit(rateKey);
      if (!rate.allowed) {
        return sendJson(res, 429, { error: `Too many attempts. Please retry in ${rate.retryAfterSeconds} seconds.` });
      }

      const body = await parseBody(req);
      const { email, password, mfaCode } = body;

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Administrator credentials required.' });
      }

      const user = serverDb.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.password_hash) || user.role !== 'ADMIN') {
        return sendJson(res, 401, { error: 'Invalid administrator credentials or access denied.' });
      }

      // Check MFA if enabled
      if (user.mfa_enabled && (!mfaCode || mfaCode.trim() !== '123456')) {
        return sendJson(res, 403, { error: 'Invalid MFA verification code.' });
      }

      resetRateLimit(rateKey);
      serverDb.logAudit(user.id, user.name, 'ADMIN_LOGIN', 'User', user.id, 'Administrator console authenticated', clientIp);

      const sessionToken = createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      }, false);

      return sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.user_type,
          emailVerified: true,
          createdAt: user.created_at,
        },
        token: sessionToken,
      });
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'Unauthorized session' });
      }

      const user = serverDb.getUserById(authUser.id);
      if (!user) {
        return sendJson(res, 404, { error: 'User account not found' });
      }

      return sendJson(res, 200, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.user_type,
          matricOrStaffId: user.matric_or_staff_id,
          faculty: user.faculty,
          department: user.department,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          emailVerified: user.email_verified === 1,
          createdAt: user.created_at,
        }
      });
    }

    // POST /api/auth/verify-email
    if (pathname === '/api/auth/verify-email' && method === 'POST') {
      const body = await parseBody(req);
      const { code, email } = body;

      if (!code) {
        return sendJson(res, 400, { error: 'Verification code is required.' });
      }

      let user = email ? serverDb.getUserByEmail(email) : undefined;
      if (!user) {
        user = serverDb.getUserByVerificationToken(code.trim());
      }

      if (!user || user.verification_token !== code.trim()) {
        return sendJson(res, 400, { error: 'Invalid or expired verification code.' });
      }

      if (user.verification_token_expires_at && new Date() > new Date(user.verification_token_expires_at)) {
        return sendJson(res, 400, { error: 'Verification code has expired. Please request a new one.' });
      }

      serverDb.verifyUserEmail(user.id);
      serverDb.logAudit(user.id, user.name, 'EMAIL_VERIFIED', 'User', user.id, 'Email address verified', clientIp);

      return sendJson(res, 200, { success: true, message: 'Email verified successfully.' });
    }

    // POST /api/auth/forgot-password
    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      const { email } = body;

      if (!email) {
        return sendJson(res, 400, { error: 'Email address is required.' });
      }

      const user = serverDb.getUserByEmail(email);
      if (user) {
        const resetToken = generateSecureToken(32);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        serverDb.setPasswordResetToken(user.id, resetToken, expiresAt);

        // Queue password recovery email with real single-use token link
        const resetUrl = `http://localhost:5173/auth/reset-password?token=${resetToken}`;
        serverDb.enqueueOutboxJob({
          recipientEmail: user.email,
          recipientName: user.name,
          subject: 'Reset Your EventPulse Password',
          bodyHtml: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #1E40AF; margin-top: 0;">Password Reset Request</h2>
              <p>Dear ${user.name},</p>
              <p>We received a request to reset your EventPulse password. Click the link below to choose a new password:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="background: #1E40AF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 13px; color: #64748b;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
            </div>
          `,
          bodyText: `Reset your EventPulse password by visiting: ${resetUrl}`,
          notificationType: 'PASSWORD_RESET',
          userId: user.id,
          idempotencyKey: `pwd-reset-${user.id}-${resetToken.slice(0, 8)}`,
        });

        serverDb.logAudit(user.id, user.name, 'PASSWORD_RESET_REQUESTED', 'User', user.id, 'Password reset link generated', clientIp);
      }

      // Enumeration protection: generic response
      return sendJson(res, 200, {
        success: true,
        message: 'If the email exists in our system, recovery instructions have been dispatched.',
      });
    }

    // POST /api/auth/reset-password
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      const { token, newPassword } = body;

      if (!token || !newPassword) {
        return sendJson(res, 400, { error: 'Token and new password are required.' });
      }

      if (newPassword.length < 8) {
        return sendJson(res, 400, { error: 'New password must be at least 8 characters.' });
      }

      const user = serverDb.getUserByResetToken(token);
      if (!user) {
        return sendJson(res, 400, { error: 'Invalid or already used password reset link.' });
      }

      if (user.reset_token_expires_at && new Date() > new Date(user.reset_token_expires_at)) {
        return sendJson(res, 400, { error: 'This password reset link has expired. Please request a new one.' });
      }

      const newHash = hashPassword(newPassword);
      serverDb.updateUserPassword(user.id, newHash);
      serverDb.logAudit(user.id, user.name, 'PASSWORD_RESET_COMPLETED', 'User', user.id, 'Password successfully updated', clientIp);

      return sendJson(res, 200, { success: true, message: 'Password updated successfully. You can now sign in.' });
    }

    // PUT /api/auth/profile
    if (pathname === '/api/auth/profile' && method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const body = await parseBody(req);
      const updated = serverDb.updateUserProfile(authUser.id, {
        name: body.name,
        phone: body.phone,
        faculty: body.faculty,
        department: body.department,
        avatarUrl: body.avatarUrl,
      });

      return sendJson(res, 200, { success: true, user: updated });
    }

    // -------------------------------------------------------------
    // 2. EVENTS API
    // -------------------------------------------------------------

    // GET /api/events
    if (pathname === '/api/events' && method === 'GET') {
      const search = query.get('search') || undefined;
      const category = query.get('category') || undefined;
      const organizerId = query.get('organizerId') || undefined;
      const timeline = (query.get('timeline') as any) || undefined;
      const campus = query.get('campus') || undefined;
      const format = query.get('format') || undefined;
      const startDate = query.get('startDate') || undefined;
      const endDate = query.get('endDate') || undefined;
      const status = query.get('status') || undefined;
      const sort = (query.get('sort') as any) || 'date-asc';
      const includeDrafts = query.get('includeDrafts') === 'true';

      const authUser = getAuthUser(req);
      // Only organizers/admins can view their drafts
      const allowDrafts = includeDrafts && authUser && (authUser.role === 'ORGANIZER' || authUser.role === 'ADMIN');

      const events = serverDb.getEvents({
        search,
        category,
        organizerId,
        timeline,
        campus,
        format,
        startDate,
        endDate,
        status,
        includeDrafts: allowDrafts,
        sort,
      });

      return sendJson(res, 200, { events });
    }

    // GET /api/events/:slug
    if (pathname.startsWith('/api/events/') && method === 'GET') {
      const identifier = pathname.slice('/api/events/'.length);
      const event = serverDb.getEventBySlug(identifier) || serverDb.getEventById(identifier);
      if (!event) {
        return sendJson(res, 404, { error: 'Event not found.' });
      }
      return sendJson(res, 200, { event });
    }

    // POST /api/events (Create Event)
    if (pathname === '/api/events' && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || (authUser.role !== 'ORGANIZER' && authUser.role !== 'ADMIN')) {
        return sendJson(res, 403, { error: 'Forbidden: Organiser or Administrator account required to create events.' });
      }

      const body = await parseBody(req);
      const { title, description, categoryId, startTime, endTime, venueName, capacity } = body;

      if (!title || !description || !categoryId || !startTime || !endTime) {
        return sendJson(res, 400, { error: 'Title, description, category, start time, and end time are required.' });
      }

      if (new Date(startTime) >= new Date(endTime)) {
        return sendJson(res, 400, { error: 'Event end time must be after start time.' });
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
      const newStatus = authUser.role === 'ADMIN' && body.status === 'PUBLISHED' ? 'PUBLISHED' : (body.asDraft ? 'DRAFT' : 'PENDING_APPROVAL');

      const createdEvent = serverDb.createEvent({
        title: title.trim(),
        slug,
        description: description.trim(),
        banner_url: body.bannerUrl,
        category_id: categoryId,
        organizer_id: authUser.id,
        organizer_name: authUser.name,
        organizer_contact: body.organizerContact || authUser.email,
        target_audience: body.targetAudience || 'UNIVERSITY_WIDE',
        target_faculty: body.targetFaculty,
        target_department: body.targetDepartment,
        start_time: startTime,
        end_time: endTime,
        timezone: body.timezone || 'Africa/Lagos',
        format: body.format || 'PHYSICAL',
        venue_id: body.venueId,
        venue_name: venueName,
        building_hall: body.buildingHall,
        room_number: body.roomNumber,
        campus_area: body.campusArea,
        address: body.address,
        landmark: body.landmark,
        latitude: body.latitude,
        longitude: body.longitude,
        directions_url: body.directionsUrl,
        online_platform: body.onlinePlatform,
        online_join_link: body.onlineJoinLink,
        restrict_join_link: body.restrictJoinLink ? 1 : 0,
        requires_registration: body.requiresRegistration !== false ? 1 : 0,
        capacity: capacity ? parseInt(capacity) : undefined,
        registration_deadline: body.registrationDeadline,
        accessibility_info: body.accessibilityInfo,
        arrival_instructions: body.arrivalInstructions,
        status: newStatus,
      });

      serverDb.logAudit(authUser.id, authUser.name, 'EVENT_CREATE', 'Event', createdEvent.id, `Created event proposal: ${createdEvent.title}`, clientIp);

      return sendJson(res, 201, { success: true, event: createdEvent });
    }

    // PUT /api/events/:id (Edit Event)
    if (pathname.startsWith('/api/events/') && method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const eventId = pathname.slice('/api/events/'.length);
      const event = serverDb.getEventById(eventId);
      if (!event) return sendJson(res, 404, { error: 'Event not found.' });

      if (authUser.role !== 'ADMIN' && event.organizer_id !== authUser.id) {
        return sendJson(res, 403, { error: 'Forbidden: You can only edit your own events.' });
      }

      const body = await parseBody(req);
      const isVenueChanged = body.venueName && body.venueName !== event.venue_name;
      const isTimeChanged = body.startTime && body.startTime !== event.start_time;

      const updated = serverDb.updateEvent(eventId, {
        title: body.title,
        description: body.description,
        banner_url: body.bannerUrl,
        category_id: body.categoryId,
        target_audience: body.targetAudience,
        start_time: body.startTime,
        end_time: body.endTime,
        format: body.format,
        venue_name: body.venueName,
        building_hall: body.buildingHall,
        landmark: body.landmark,
        capacity: body.capacity ? parseInt(body.capacity) : undefined,
        registration_deadline: body.registrationDeadline,
        accessibility_info: body.accessibilityInfo,
        arrival_instructions: body.arrivalInstructions,
      });

      // Material change notifications to registrants
      if (isVenueChanged || isTimeChanged) {
        const changeMsg = isVenueChanged && isTimeChanged
          ? 'Venue and schedule updated'
          : isVenueChanged ? 'Venue location changed' : 'Schedule time adjusted';

        const regs = serverDb.getRegistrationsByEventId(eventId).filter(r => r.status === 'CONFIRMED');
        for (const r of regs) {
          serverDb.createInAppNotification({
            userId: r.user_id,
            title: `Update: ${event.title}`,
            message: `Event Notice: ${changeMsg}. Latest Venue: ${updated?.venue_name || 'TBD'}, Time: ${new Date(updated?.start_time!).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' })} WAT.`,
            type: 'EVENT_UPDATE',
            eventId: event.id,
          });

          serverDb.enqueueOutboxJob({
            recipientEmail: r.user_email!,
            recipientName: r.user_name!,
            subject: `Update Notice: ${event.title}`,
            bodyHtml: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h3 style="color: #1E40AF;">Event Notice: ${changeMsg}</h3>
                <p>Dear ${r.user_name},</p>
                <p>The details for <strong>${event.title}</strong> have been updated by the organiser:</p>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Venue:</strong> ${updated?.venue_name}</p>
                  <p><strong>Date & Time:</strong> ${new Date(updated?.start_time!).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
                </div>
              </div>
            `,
            bodyText: `Notice for ${event.title}: ${changeMsg}. Venue: ${updated?.venue_name}, Time: ${new Date(updated?.start_time!).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT.`,
            notificationType: 'EVENT_UPDATE',
            eventId: event.id,
            userId: r.user_id,
            idempotencyKey: `evt-update-${event.id}-${r.user_id}-${Date.now()}`,
          });
        }
      }

      serverDb.logAudit(authUser.id, authUser.name, 'EVENT_UPDATE', 'Event', eventId, `Updated event: ${event.title}`, clientIp);

      return sendJson(res, 200, { success: true, event: updated });
    }

    // POST /api/events/:id/status (Approval, Rejection, Cancellation)
    if (pathname.includes('/status') && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const parts = pathname.split('/');
      const eventId = parts[3];
      const event = serverDb.getEventById(eventId);
      if (!event) return sendJson(res, 404, { error: 'Event not found.' });

      const body = await parseBody(req);
      const { status, feedback } = body;

      // Only admins can approve or reject proposals
      if ((status === 'PUBLISHED' || status === 'REJECTED' || status === 'RETURNED_FOR_REVISION') && authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Only administrators can approve or reject event proposals.' });
      }

      // Organizers can cancel their own events; admins can cancel any
      if (status === 'CANCELLED' && authUser.role !== 'ADMIN' && event.organizer_id !== authUser.id) {
        return sendJson(res, 403, { error: 'Forbidden: Cannot cancel this event.' });
      }

      const updated = serverDb.updateEvent(eventId, {
        status,
        approval_feedback: feedback,
      });

      // Cancellation triggers notices to participants
      if (status === 'CANCELLED') {
        const regs = serverDb.getRegistrationsByEventId(eventId).filter(r => r.status === 'CONFIRMED');
        for (const r of regs) {
          serverDb.createInAppNotification({
            userId: r.user_id,
            title: `Event Cancelled: ${event.title}`,
            message: `Notice: "${event.title}" has been cancelled by the organisers. Your reservation pass has been released.`,
            type: 'EVENT_CANCELLED',
            eventId: event.id,
          });

          serverDb.enqueueOutboxJob({
            recipientEmail: r.user_email!,
            recipientName: r.user_name!,
            subject: `Cancellation Notice: ${event.title}`,
            bodyHtml: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h3 style="color: #E11D48;">Cancellation Notice</h3>
                <p>Dear ${r.user_name},</p>
                <p>We regret to inform you that <strong>${event.title}</strong> has been cancelled.</p>
              </div>
            `,
            bodyText: `Notice: ${event.title} has been cancelled.`,
            notificationType: 'EVENT_CANCELLED',
            eventId: event.id,
            userId: r.user_id,
            idempotencyKey: `cancel-${event.id}-${r.user_id}`,
          });
        }
      }

      serverDb.logAudit(authUser.id, authUser.name, `EVENT_${status}`, 'Event', eventId, `Status changed to ${status}`, clientIp);

      return sendJson(res, 200, { success: true, event: updated });
    }

    // -------------------------------------------------------------
    // 3. REGISTRATIONS & ADMISSION
    // -------------------------------------------------------------

    // POST /api/events/:id/register
    if (pathname.endsWith('/register') && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) {
        return sendJson(res, 401, { error: 'You must be signed in to reserve an event pass.' });
      }

      const parts = pathname.split('/');
      const eventId = parts[3];

      const resReg = serverDb.registerForEventAtomic(eventId, authUser.id, authUser.name, authUser.email);
      if (!resReg.success) {
        return sendJson(res, 400, { error: resReg.error });
      }

      const event = serverDb.getEventById(eventId)!;

      // Send instant confirmation in-app notification
      serverDb.createInAppNotification({
        userId: authUser.id,
        title: 'Registration Confirmed',
        message: `Your pass for "${event.title}" is confirmed. Reference: ${resReg.registration!.reference_code}.`,
        type: 'REGISTRATION_CONFIRMATION',
        eventId: event.id,
      });

      // Queue confirmation email outbox job
      serverDb.enqueueOutboxJob({
        recipientEmail: authUser.email,
        recipientName: authUser.name,
        subject: `Pass Confirmed: ${event.title}`,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1E40AF; margin-top: 0;">Registration Confirmed!</h2>
            <p>Dear <strong>${authUser.name}</strong>,</p>
            <p>Your entry ticket for <strong>${event.title}</strong> has been secured.</p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Ticket Reference:</strong> <span style="color: #1E40AF; font-size: 16px; font-weight: bold;">${resReg.registration!.reference_code}</span></p>
              <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(event.start_time).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
              <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.venue_name || 'Campus Main Hall'} (${event.campus_area || 'Main Campus'})</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">Please present this pass code upon arrival.</p>
          </div>
        `,
        bodyText: `Your pass for ${event.title} is confirmed. Pass Reference: ${resReg.registration!.reference_code}. Venue: ${event.venue_name || 'Online'}. Time: ${new Date(event.start_time).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT`,
        notificationType: 'REGISTRATION_CONFIRMATION',
        eventId: event.id,
        userId: authUser.id,
        idempotencyKey: `reg-conf-${resReg.registration!.reference_code}`,
      });

      serverDb.logAudit(authUser.id, authUser.name, 'EVENT_REGISTER', 'Registration', resReg.registration!.id, `Registered for ${event.title}`, clientIp);

      return sendJson(res, 201, { success: true, registration: resReg.registration });
    }

    // POST /api/events/:id/unregister
    if (pathname.endsWith('/unregister') && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const parts = pathname.split('/');
      const eventId = parts[3];
      const regs = serverDb.getRegistrationsByUserId(authUser.id);
      const reg = regs.find(r => r.event_id === eventId);
      if (!reg) return sendJson(res, 404, { error: 'Active registration not found.' });

      serverDb.cancelRegistration(reg.id, authUser.id);
      serverDb.logAudit(authUser.id, authUser.name, 'EVENT_UNREGISTER', 'Registration', reg.id, `Withdrew registration for ${reg.reference_code}`, clientIp);

      return sendJson(res, 200, { success: true, message: 'Registration cancelled.' });
    }

    // GET /api/registrations/my
    if (pathname === '/api/registrations/my' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const registrations = serverDb.getRegistrationsByUserId(authUser.id);
      return sendJson(res, 200, { registrations });
    }

    // GET /api/registrations/event/:eventId
    if (pathname.startsWith('/api/registrations/event/') && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const eventId = pathname.slice('/api/registrations/event/'.length);
      const event = serverDb.getEventById(eventId);
      if (!event) return sendJson(res, 404, { error: 'Event not found.' });

      if (authUser.role !== 'ADMIN' && event.organizer_id !== authUser.id) {
        return sendJson(res, 403, { error: 'Forbidden: You can only view attendee records for your own events.' });
      }

      const attendees = serverDb.getRegistrationsByEventId(eventId);
      return sendJson(res, 200, { attendees });
    }

    // POST /api/registrations/scan-qr
    if (pathname === '/api/registrations/scan-qr' && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || (authUser.role !== 'ORGANIZER' && authUser.role !== 'ADMIN')) {
        return sendJson(res, 403, { error: 'Forbidden: Only accredited organizers or admins can scan tickets.' });
      }

      const body = await parseBody(req);
      const { code } = body;
      if (!code) return sendJson(res, 400, { error: 'Ticket pass code is required.' });

      const scanResult = serverDb.scanQrPass(code.trim(), authUser.id, authUser.role === 'ADMIN');
      if (!scanResult.success) {
        return sendJson(res, 400, { error: scanResult.error });
      }

      serverDb.logAudit(authUser.id, authUser.name, 'TICKET_SCAN', 'Registration', scanResult.registration?.id, `Checked in attendee ${scanResult.registration?.user_name} (${scanResult.registration?.reference_code})`, clientIp);

      return sendJson(res, 200, { success: true, attendee: scanResult.registration });
    }

    // -------------------------------------------------------------
    // 4. ORGANISER APPLICATIONS
    // -------------------------------------------------------------

    // POST /api/organizers/apply
    if (pathname === '/api/organizers/apply' && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const body = await parseBody(req);
      const { organizationName, reason, faculty, department } = body;
      if (!organizationName || !reason) {
        return sendJson(res, 400, { error: 'Organization name and reason are required.' });
      }

      const app = serverDb.submitOrganiserApplication({
        userId: authUser.id,
        organizationName: organizationName.trim(),
        faculty: faculty || authUser.faculty,
        department: department || authUser.department,
        reason: reason.trim(),
      });

      serverDb.logAudit(authUser.id, authUser.name, 'ORGANIZER_APPLY', 'Application', app.id, `Submitted organiser application for ${organizationName}`, clientIp);

      return sendJson(res, 201, { success: true, application: app });
    }

    // GET /api/organizers/applications
    if (pathname === '/api/organizers/applications' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      // Admins see all; users see own
      const apps = authUser.role === 'ADMIN'
        ? serverDb.getOrganiserApplications()
        : serverDb.getOrganiserApplications(authUser.id);

      return sendJson(res, 200, { applications: apps });
    }

    // POST /api/organizers/applications/:id/review
    if (pathname.includes('/review') && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Only administrators can review organiser applications.' });
      }

      const parts = pathname.split('/');
      const appId = parts[4];
      const body = await parseBody(req);
      const { status, feedback } = body;

      const success = serverDb.reviewOrganiserApplication(appId, status, authUser.name, feedback);
      if (!success) return sendJson(res, 404, { error: 'Application not found.' });

      serverDb.logAudit(authUser.id, authUser.name, `APP_${status}`, 'Application', appId, `Organiser application ${status.toLowerCase()}`, clientIp);

      return sendJson(res, 200, { success: true, message: `Application ${status.toLowerCase()}` });
    }

    // -------------------------------------------------------------
    // 5. NOTIFICATIONS & PREFERENCES
    // -------------------------------------------------------------

    // GET /api/notifications
    if (pathname === '/api/notifications' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const notifications = serverDb.getInAppNotifications(authUser.id);
      return sendJson(res, 200, { notifications });
    }

    // POST /api/notifications/mark-read
    if (pathname === '/api/notifications/mark-read' && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const body = await parseBody(req);
      if (body.all) {
        serverDb.markAllNotificationsAsRead(authUser.id);
      } else if (body.id) {
        serverDb.markNotificationAsRead(body.id, authUser.id);
      }
      return sendJson(res, 200, { success: true });
    }

    // GET /api/notifications/preferences
    if (pathname === '/api/notifications/preferences' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const prefs = serverDb.getNotificationPreferences(authUser.id);
      return sendJson(res, 200, { preferences: prefs });
    }

    // PUT /api/notifications/preferences
    if (pathname === '/api/notifications/preferences' && method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'Unauthorized' });

      const body = await parseBody(req);
      const updated = serverDb.updateNotificationPreferences(authUser.id, body);
      return sendJson(res, 200, { success: true, preferences: updated });
    }

    // POST /api/notifications/unsubscribe
    if (pathname === '/api/notifications/unsubscribe' && method === 'POST') {
      const body = await parseBody(req);
      const token = body.token || query.get('token');
      if (!token) {
        return sendJson(res, 400, { error: 'Unsubscribe token is required.' });
      }

      const resUnsub = serverDb.unsubscribeByToken(token);
      if (!resUnsub.success) {
        return sendJson(res, 400, { error: resUnsub.error });
      }

      return sendJson(res, 200, {
        success: true,
        email: resUnsub.email,
        message: 'Successfully unsubscribed from optional campus announcements.',
      });
    }

    // -------------------------------------------------------------
    // 6. SUPPORT TICKETS & CONTACT
    // -------------------------------------------------------------

    // POST /api/support/tickets
    if (pathname === '/api/support/tickets' && method === 'POST') {
      const body = await parseBody(req);
      const { name, email, subject, message } = body;

      if (!name || !email || !message) {
        return sendJson(res, 400, { error: 'Name, email, and message are required.' });
      }

      const authUser = getAuthUser(req);
      const ticket = serverDb.createSupportTicket({
        userId: authUser?.id,
        name: name.trim(),
        email: email.trim(),
        subject: subject || 'General Support Inquiry',
        message: message.trim(),
      });

      serverDb.logAudit(authUser?.id, name, 'TICKET_CREATE', 'SupportTicket', ticket.id, `Created support ticket ${ticket.reference_code}`, clientIp);

      return sendJson(res, 201, {
        success: true,
        referenceCode: ticket.reference_code,
        message: `Your inquiry has been submitted. Reference: ${ticket.reference_code}.`,
      });
    }

    // GET /api/support/tickets
    if (pathname === '/api/support/tickets' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const tickets = serverDb.getSupportTickets();
      return sendJson(res, 200, { tickets });
    }

    // PUT /api/support/tickets/:id
    if (pathname.startsWith('/api/support/tickets/') && method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const ticketId = pathname.slice('/api/support/tickets/'.length);
      const body = await parseBody(req);
      const { status, adminNotes } = body;

      serverDb.updateSupportTicketStatus(ticketId, status, authUser.name, adminNotes);
      return sendJson(res, 200, { success: true });
    }

    // -------------------------------------------------------------
    // 7. EVENT FEEDBACK
    // -------------------------------------------------------------

    // POST /api/events/:id/feedback
    if (pathname.includes('/feedback') && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser) return sendJson(res, 401, { error: 'You must be signed in to submit feedback.' });

      const parts = pathname.split('/');
      const eventId = parts[3];
      const body = await parseBody(req);
      const { rating, comment } = body;

      if (!rating || rating < 1 || rating > 5) {
        return sendJson(res, 400, { error: 'Rating must be between 1 and 5 stars.' });
      }

      const resFb = serverDb.addFeedback({
        eventId,
        userId: authUser.id,
        rating: parseInt(rating),
        comment: comment?.trim(),
      });

      if (!resFb.success) {
        return sendJson(res, 400, { error: resFb.error });
      }

      return sendJson(res, 201, { success: true, message: 'Thank you for your event feedback!' });
    }

    // GET /api/events/:id/feedback
    if (pathname.includes('/feedback') && method === 'GET') {
      const parts = pathname.split('/');
      const eventId = parts[3];
      const feedbacks = serverDb.getEventFeedbacks(eventId);
      return sendJson(res, 200, { feedbacks });
    }

    // -------------------------------------------------------------
    // 8. ADMINISTRATOR CONTROLS & REPORTS
    // -------------------------------------------------------------

    // GET /api/admin/users
    if (pathname === '/api/admin/users' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const users = serverDb.getAllUsers();
      return sendJson(res, 200, { users });
    }

    // PUT /api/admin/users/:id/role
    if (pathname.includes('/role') && method === 'PUT') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const parts = pathname.split('/');
      const targetUserId = parts[4];
      const body = await parseBody(req);
      const { role } = body;

      if (!['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN'].includes(role)) {
        return sendJson(res, 400, { error: 'Invalid role specified.' });
      }

      serverDb.updateUserRole(targetUserId, role);
      serverDb.logAudit(authUser.id, authUser.name, 'USER_ROLE_CHANGE', 'User', targetUserId, `Updated role to ${role}`, clientIp);

      return sendJson(res, 200, { success: true, message: `User role changed to ${role}` });
    }

    // GET /api/admin/outbox
    if (pathname === '/api/admin/outbox' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const outbox = serverDb.getOutboxJobs();
      return sendJson(res, 200, { outbox });
    }

    // GET /api/admin/audit-logs
    if (pathname === '/api/admin/audit-logs' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const logs = serverDb.getAuditLogs();
      return sendJson(res, 200, { logs });
    }

    // GET /api/admin/participation-reports
    if (pathname === '/api/admin/participation-reports' && method === 'GET') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const report = serverDb.getParticipationReport();
      return sendJson(res, 200, { report });
    }

    // GET /api/categories
    if (pathname === '/api/categories' && method === 'GET') {
      const categories = serverDb.getCategories();
      return sendJson(res, 200, { categories });
    }

    // POST /api/categories
    if (pathname === '/api/categories' && method === 'POST') {
      const authUser = getAuthUser(req);
      if (!authUser || authUser.role !== 'ADMIN') {
        return sendJson(res, 403, { error: 'Forbidden: Administrator access required.' });
      }

      const body = await parseBody(req);
      const cat = serverDb.createCategory(body);
      return sendJson(res, 201, { success: true, category: cat });
    }

    // GET /api/venues
    if (pathname === '/api/venues' && method === 'GET') {
      const venues = serverDb.getVenues();
      return sendJson(res, 200, { venues });
    }

    // POST or GET /api/cron/reminders or /api/cron/process-outbox (Scheduled Tick)
    if (pathname === '/api/cron/reminders' || pathname === '/api/cron/process-outbox') {
      const authHeader = req.headers['authorization'];
      const cronSecret = process.env.CRON_SECRET || 'cron_secret_nsuk_scheduler_token_2026';
      // In local development or with valid secret or localhost IP
      const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';
      if (!isLocal && authHeader !== `Bearer ${cronSecret}` && query.get('secret') !== cronSecret) {
        return sendJson(res, 401, { error: 'Unauthorized: Invalid cron execution secret.' });
      }

      const results = await scheduler.tick();
      return sendJson(res, 200, { success: true, results });
    }

    // 404 for unmatched API routes
    return sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
  } catch (error: any) {
    console.error(`[API Error] ${method} ${pathname}:`, error);
    return sendJson(res, 500, { error: 'Internal Server Error', message: error?.message });
  }
}
