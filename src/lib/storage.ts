import { 
  User, 
  Role,
  Event, 
  Category, 
  Registration, 
  Bookmark, 
  InAppNotification, 
  EmailOutboxJob, 
  OrganiserApplication, 
  AuditLog, 
  EventFeedback, 
  NotificationPreferences 
} from './types';
import { CATEGORY_DEFINITIONS } from './nsuk-data';
import { api, getStoredToken } from './api';

// Memory cache for immediate UI rendering and reactivity
class EventPulseStorage {
  private users: User[] = [];
  private events: Event[] = [];
  private categories: Category[] = CATEGORY_DEFINITIONS.map((c, i) => ({
    id: `cat-${i + 1}`,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    color: c.color,
  }));
  private registrations: Registration[] = [];
  private bookmarks: Bookmark[] = [];
  private notifications: InAppNotification[] = [];
  private outboxJobs: EmailOutboxJob[] = [];
  private applications: OrganiserApplication[] = [];
  private logs: AuditLog[] = [];
  private feedbacks: EventFeedback[] = [];
  private preferences: Record<string, NotificationPreferences> = {};
  private currentUser: User | null = null;
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Purge any legacy browser storage keys containing plaintext credentials or fake admin claims
    if (typeof window !== 'undefined') {
      const legacyKeys = [
        'eventpulse_users_prod',
        'eventpulse_current_user_prod',
        'eventpulse_events_prod',
        'eventpulse_registrations_prod',
        'eventpulse_bookmarks_prod',
        'eventpulse_notifications_prod',
        'eventpulse_outbox_prod',
        'eventpulse_applications_prod',
        'eventpulse_logs_prod',
        'eventpulse_feedbacks_prod',
        'eventpulse_preferences_prod',
        'eventpulse_email_provider_config_v2'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    }

    await this.syncFromBackend();
  }

  public async syncFromBackend(): Promise<void> {
    try {
      // 1. Fetch current authenticated user if token exists
      const token = getStoredToken();
      if (token) {
        try {
          const meRes = await api.getMe();
          if (meRes.user) {
            this.currentUser = {
              id: meRes.user.id,
              name: meRes.user.name,
              email: meRes.user.email,
              role: meRes.user.role,
              userType: meRes.user.userType || 'STUDENT',
              matricOrStaffId: meRes.user.matricOrStaffId,
              faculty: meRes.user.faculty,
              department: meRes.user.department,
              phone: meRes.user.phone,
              avatarUrl: meRes.user.avatarUrl,
              emailVerified: meRes.user.emailVerified,
              createdAt: meRes.user.createdAt,
            };
          }
        } catch {
          this.currentUser = null;
          api.logout();
        }
      }

      // 2. Fetch published and available events from shared database
      const eventsRes = await api.getEvents({ includeDrafts: true });
      if (eventsRes?.events) {
        this.events = eventsRes.events.map(this.mapEventRow);
      }

      // 3. Fetch categories
      const catRes = await api.getCategories();
      if (catRes?.categories?.length) {
        this.categories = catRes.categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          color: c.color,
        }));
      }

      // 4. If signed in, fetch user registrations, notifications, and preferences
      if (this.currentUser) {
        const regsRes = await api.getMyRegistrations().catch(() => ({ registrations: [] }));
        if (regsRes?.registrations) {
          this.registrations = regsRes.registrations.map(this.mapRegRow);
        }

        const notifsRes = await api.getNotifications().catch(() => ({ notifications: [] }));
        if (notifsRes?.notifications) {
          this.notifications = notifsRes.notifications.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type as any,
            eventId: n.event_id,
            isRead: n.is_read === 1,
            createdAt: n.created_at,
          }));
        }

        const prefsRes = await api.getNotificationPreferences().catch(() => ({ preferences: null }));
        if (prefsRes?.preferences) {
          this.preferences[this.currentUser.id] = {
            userId: prefsRes.preferences.user_id,
            emailAnnouncements: prefsRes.preferences.email_announcements === 1,
            reminder24h: prefsRes.preferences.reminder_24h === 1,
            reminder1h: prefsRes.preferences.reminder_1h === 1,
            eventStartingNow: prefsRes.preferences.event_starting_now === 1,
            eventChanges: prefsRes.preferences.event_changes === 1,
            unsubscribeToken: prefsRes.preferences.unsubscribe_token,
          };
        }

        // If admin, fetch admin records
        if (this.currentUser.role === 'ADMIN') {
          const [appsRes, outboxRes, logsRes, usersRes] = await Promise.all([
            api.getOrganizerApplications().catch(() => ({ applications: [] })),
            api.getAdminOutbox().catch(() => ({ outbox: [] })),
            api.getAuditLogs().catch(() => ({ logs: [] })),
            api.getAdminUsers().catch(() => ({ users: [] })),
          ]);

          if (appsRes?.applications) {
            this.applications = appsRes.applications.map(a => ({
              id: a.id,
              userId: a.user_id,
              userName: a.user_name || 'User',
              userEmail: a.user_email || '',
              organizationName: a.organization_name,
              department: a.department,
              faculty: a.faculty,
              reason: a.reason,
              status: a.status,
              adminFeedback: a.admin_feedback,
              reviewedBy: a.reviewed_by,
              createdAt: a.created_at,
              updatedAt: a.updated_at,
            }));
          }

          if (outboxRes?.outbox) {
            this.outboxJobs = outboxRes.outbox.map(o => ({
              id: o.id,
              recipientEmail: o.recipient_email,
              recipientName: o.recipient_name,
              subject: o.subject,
              bodyHtml: o.body_html,
              bodyText: o.body_text,
              notificationType: o.notification_type as any,
              eventId: o.event_id,
              userId: o.user_id,
              scheduledFor: o.scheduled_for,
              status: o.status,
              attemptCount: o.attempt_count,
              maxAttempts: o.max_attempts,
              lastAttemptAt: o.last_attempt_at,
              errorMessage: o.error_message,
              idempotencyKey: o.idempotency_key,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
            }));
          }

          if (logsRes?.logs) {
            this.logs = logsRes.logs.map(l => ({
              id: l.id,
              userId: l.user_id,
              userName: l.user_name,
              action: l.action,
              entityType: l.entity_type,
              entityId: l.entity_id,
              details: l.details,
              ipAddress: l.ip_address,
              createdAt: l.created_at,
            }));
          }

          if (usersRes?.users) {
            this.users = usersRes.users.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              userType: u.user_type,
              matricOrStaffId: u.matric_or_staff_id,
              faculty: u.faculty,
              department: u.department,
              phone: u.phone,
              avatarUrl: u.avatar_url,
              emailVerified: u.email_verified === 1,
              createdAt: u.created_at,
            }));
          }
        }
      }
    } catch (e) {
      console.error('[EventPulse DB] Backend synchronization notice:', e);
    }
  }

  private mapEventRow(e: any): Event {
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      bannerUrl: e.banner_url,
      categoryId: e.category_id,
      categoryName: e.category_name,
      categorySlug: e.category_slug,
      categoryColor: e.category_color,
      organizerId: e.organizer_id,
      organizerName: e.organizer_name,
      organizerContact: e.organizer_contact,
      targetAudience: e.target_audience,
      targetFaculty: e.target_faculty,
      targetDepartment: e.target_department,
      startTime: e.start_time,
      endTime: e.end_time,
      timezone: e.timezone || 'Africa/Lagos',
      format: e.format,
      venueName: e.venue_name,
      buildingHall: e.building_hall,
      roomNumber: e.room_number,
      campusArea: e.campus_area,
      address: e.address,
      landmark: e.landmark,
      latitude: e.latitude,
      longitude: e.longitude,
      directionsUrl: e.directions_url,
      onlinePlatform: e.online_platform,
      onlineJoinLink: e.online_join_link,
      restrictJoinLink: e.restrict_join_link === 1,
      requiresRegistration: e.requires_registration === 1,
      capacity: e.capacity,
      registeredCount: e.registered_count || 0,
      registrationDeadline: e.registration_deadline,
      accessibilityInfo: e.accessibility_info,
      arrivalInstructions: e.arrival_instructions,
      status: e.status,
      approvalFeedback: e.approval_feedback,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    };
  }

  private mapRegRow(r: any): Registration {
    return {
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      userName: r.user_name || 'Attendee',
      userEmail: r.user_email || '',
      referenceCode: r.reference_code,
      qrToken: r.qr_token,
      status: r.status,
      registeredAt: r.registered_at,
      attendedAt: r.attended_at,
      event: r.event ? this.mapEventRow(r.event) : undefined,
    };
  }

  // --- Auth & Users ---
  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (!user) {
      api.logout();
    }
  }

  public async login(email: string, password: string, rememberMe?: boolean): Promise<{ user?: User; error?: string }> {
    try {
      const res = await api.login(email, password, rememberMe);
      if (res.user) {
        this.currentUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          userType: res.user.userType || 'STUDENT',
          matricOrStaffId: res.user.matricOrStaffId,
          faculty: res.user.faculty,
          department: res.user.department,
          phone: res.user.phone,
          avatarUrl: res.user.avatarUrl,
          emailVerified: res.user.emailVerified,
          createdAt: res.user.createdAt,
        };
        await this.syncFromBackend();
        return { user: this.currentUser };
      }
      return { error: 'Authentication failed' };
    } catch (err: any) {
      return { error: err?.message || 'Login failed' };
    }
  }

  public async adminLogin(email: string, password: string, mfaCode?: string): Promise<{ user?: User; error?: string }> {
    try {
      const res = await api.adminLogin(email, password, mfaCode);
      if (res.user) {
        this.currentUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          userType: res.user.userType || 'STAFF',
          emailVerified: true,
          createdAt: res.user.createdAt,
        };
        await this.syncFromBackend();
        return { user: this.currentUser };
      }
      return { error: 'Administrator access denied' };
    } catch (err: any) {
      return { error: err?.message || 'Administrator sign-in failed' };
    }
  }

  public async registerUser(userData: {
    name: string;
    email: string;
    password: string;
    userType: 'STUDENT' | 'STAFF';
    matricOrStaffId?: string;
    department?: string;
    faculty?: string;
    phone?: string;
  }): Promise<{ user?: User; error?: string }> {
    try {
      const res = await api.register(userData);
      if (res.user) {
        this.currentUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          userType: res.user.userType,
          matricOrStaffId: res.user.matricOrStaffId,
          faculty: res.user.faculty,
          department: res.user.department,
          phone: res.user.phone,
          emailVerified: false,
          createdAt: res.user.createdAt,
        };
        await this.syncFromBackend();
        return { user: this.currentUser };
      }
      return { error: 'Registration failed' };
    } catch (err: any) {
      return { error: err?.message || 'Registration failed' };
    }
  }

  public async updateUserRole(userId: string, newRole: Role, adminName: string): Promise<boolean> {
    try {
      await api.updateUserRole(userId, newRole);
      const target = this.users.find(u => u.id === userId);
      if (target) target.role = newRole;
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser.role = newRole;
      }
      await this.syncFromBackend();
      return true;
    } catch {
      return false;
    }
  }

  // --- Events ---
  public getEvents(): Event[] {
    return this.events;
  }

  public getEventBySlug(slug: string): Event | undefined {
    return this.events.find(e => e.slug === slug);
  }

  public getEventById(id: string): Event | undefined {
    return this.events.find(e => e.id === id);
  }

  public async saveEvent(eventData: any): Promise<Event> {
    const res = await api.createEvent(eventData);
    const newEvent = this.mapEventRow(res.event);
    this.events.unshift(newEvent);
    return newEvent;
  }

  public async updateEvent(id: string, updates: Partial<Event>, authorName: string): Promise<Event | null> {
    try {
      const res = await api.updateEvent(id, updates);
      const updated = this.mapEventRow(res.event);
      const idx = this.events.findIndex(e => e.id === id);
      if (idx !== -1) this.events[idx] = updated;
      return updated;
    } catch {
      return null;
    }
  }

  public async updateEventStatus(id: string, status: Event['status'], reviewerName: string, feedback?: string): Promise<boolean> {
    try {
      await api.updateEventStatus(id, status, feedback);
      const event = this.events.find(e => e.id === id);
      if (event) {
        event.status = status;
        if (feedback) event.approvalFeedback = feedback;
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- Registrations ---
  public getRegistrations(): Registration[] {
    return this.registrations;
  }

  public getUserRegistrations(userId: string): Registration[] {
    return this.registrations.filter(r => r.userId === userId && r.status !== 'CANCELLED');
  }

  public async registerForEvent(eventId: string, user: User): Promise<{ success: boolean; error?: string; registration?: Registration }> {
    try {
      const res = await api.registerForEvent(eventId);
      const newReg = this.mapRegRow(res.registration);
      this.registrations.unshift(newReg);
      const event = this.events.find(e => e.id === eventId);
      if (event) {
        event.registeredCount = (event.registeredCount || 0) + 1;
      }
      await this.syncFromBackend();
      return { success: true, registration: newReg };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  }

  public async cancelRegistration(registrationId: string, user: User): Promise<boolean> {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) return false;
    try {
      await api.unregisterForEvent(reg.eventId);
      reg.status = 'CANCELLED';
      const event = this.events.find(e => e.id === reg.eventId);
      if (event && event.registeredCount) {
        event.registeredCount = Math.max(0, event.registeredCount - 1);
      }
      return true;
    } catch {
      return false;
    }
  }

  public async checkInAttendee(referenceCode: string, organizerName: string): Promise<{ success: boolean; attendee?: Registration; error?: string }> {
    try {
      const res = await api.scanQr(referenceCode);
      const mapped = this.mapRegRow(res.attendee);
      return { success: true, attendee: mapped };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Check-in failed' };
    }
  }

  // --- Bookmarks ---
  public getBookmarks(userId: string): Bookmark[] {
    return this.bookmarks.filter(b => b.userId === userId);
  }

  public toggleBookmark(eventId: string, userId: string): boolean {
    const exists = this.bookmarks.some(b => b.eventId === eventId && b.userId === userId);
    if (exists) {
      this.bookmarks = this.bookmarks.filter(b => !(b.eventId === eventId && b.userId === userId));
      return false;
    } else {
      this.bookmarks.push({ id: `bm-${Date.now()}`, eventId, userId, createdAt: new Date().toISOString() });
      return true;
    }
  }

  // --- Notifications ---
  public getInAppNotifications(userId: string): InAppNotification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    await api.markNotificationRead(id).catch(() => {});
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    await api.markNotificationRead(undefined, true).catch(() => {});
  }

  public addInAppNotification(data: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>): InAppNotification {
    const newNotif: InAppNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  // --- Outbox Jobs ---
  public getOutboxJobs(): EmailOutboxJob[] {
    return this.outboxJobs;
  }

  public enqueueOutboxJob(data: any): EmailOutboxJob {
    const job: EmailOutboxJob = {
      ...data,
      id: `outbox-${Date.now()}`,
      scheduledFor: data.scheduledFor || new Date().toISOString(),
      status: 'QUEUED',
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.outboxJobs.unshift(job);
    return job;
  }

  public retryOutboxJob(id: string): boolean {
    const job = this.outboxJobs.find(j => j.id === id);
    if (job) {
      job.status = 'QUEUED';
      job.attemptCount = 0;
      job.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public sendWelcomeEmail(user: User): void {
    this.enqueueOutboxJob({
      recipientEmail: user.email,
      recipientName: user.name,
      subject: 'Welcome to EventPulse Campus Hub',
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;"><h2>Welcome, ${user.name}!</h2><p>Your EventPulse campus account is ready.</p></div>`,
      bodyText: `Welcome to EventPulse, ${user.name}!`,
      notificationType: 'WELCOME',
      userId: user.id,
      idempotencyKey: `welcome-${user.id}-${Date.now()}`
    });
  }

  public broadcastNewEventPublished(event: Event): void {
    this.enqueueOutboxJob({
      recipientEmail: this.currentUser?.email || 'attendee@eventpulse.com.ng',
      recipientName: this.currentUser?.name || 'Campus Member',
      subject: `New Event Published: ${event.title}`,
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;"><h2>New Campus Event</h2><h3>${event.title}</h3><p>${event.description}</p></div>`,
      bodyText: `New Event: ${event.title}`,
      notificationType: 'NEW_EVENT_PUBLISHED',
      eventId: event.id,
      idempotencyKey: `new-evt-${event.id}-${Date.now()}`
    });
  }

  public broadcastEventAboutToHappen(eventId: string, reminderType: 'REMINDER_24H' | 'REMINDER_1H'): void {
    const event = this.events.find(e => e.id === eventId);
    this.enqueueOutboxJob({
      recipientEmail: this.currentUser?.email || 'attendee@eventpulse.com.ng',
      recipientName: this.currentUser?.name || 'Campus Attendee',
      subject: `Reminder: ${event?.title || 'Campus Event'} starts ${reminderType === 'REMINDER_1H' ? 'in 1 hour' : 'tomorrow'}`,
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;"><h2>Event Reminder</h2><p>${event?.title} is starting soon at ${event?.venueName || 'Campus Main Hall'}.</p></div>`,
      bodyText: `Reminder: ${event?.title} is starting soon.`,
      notificationType: reminderType,
      eventId,
      idempotencyKey: `reminder-${eventId}-${reminderType}-${Date.now()}`
    });
  }

  public broadcastEventHappeningNow(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    this.enqueueOutboxJob({
      recipientEmail: this.currentUser?.email || 'attendee@eventpulse.com.ng',
      recipientName: this.currentUser?.name || 'Campus Attendee',
      subject: `Happening Now: ${event?.title || 'Campus Event'}`,
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;"><h2>Happening Now!</h2><p>${event?.title} has commenced at ${event?.venueName || 'Main Hall'}. Validation desks are open.</p></div>`,
      bodyText: `Happening Now: ${event?.title} has commenced.`,
      notificationType: 'EVENT_STARTING_NOW',
      eventId,
      idempotencyKey: `live-${eventId}-${Date.now()}`
    });
  }

  // --- Organiser Applications ---
  public getApplications(): OrganiserApplication[] {
    return this.applications;
  }

  public async submitApplication(app: {
    userId: string;
    organizationName: string;
    faculty?: string;
    department?: string;
    reason: string;
  }): Promise<OrganiserApplication> {
    const res = await api.submitOrganizerApplication(app);
    const newApp: OrganiserApplication = {
      id: res.application.id,
      userId: res.application.user_id,
      userName: this.currentUser?.name || 'Applicant',
      userEmail: this.currentUser?.email || '',
      organizationName: res.application.organization_name,
      department: res.application.department,
      faculty: res.application.faculty,
      reason: res.application.reason,
      status: res.application.status,
      createdAt: res.application.created_at,
      updatedAt: res.application.updated_at,
    };
    this.applications.unshift(newApp);
    return newApp;
  }

  public async reviewApplication(appId: string, status: 'APPROVED' | 'REJECTED', adminName: string, feedback?: string): Promise<boolean> {
    try {
      await api.reviewOrganizerApplication(appId, status, feedback);
      const app = this.applications.find(a => a.id === appId);
      if (app) {
        app.status = status;
        app.adminFeedback = feedback;
        app.reviewedBy = adminName;
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- Feedback ---
  public getEventFeedbacks(eventId: string): EventFeedback[] {
    return this.feedbacks.filter(f => f.eventId === eventId);
  }

  public async addFeedback(fb: { eventId: string; userId: string; rating: number; comment?: string }): Promise<boolean> {
    try {
      await api.submitFeedback(fb.eventId, fb.rating, fb.comment);
      this.feedbacks.unshift({
        id: `fb-${Date.now()}`,
        eventId: fb.eventId,
        userId: fb.userId,
        userName: this.currentUser?.name || 'Attendee',
        rating: fb.rating,
        comment: fb.comment,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  }

  // --- Audit Logs & Preferences ---
  public getLogs(): AuditLog[] {
    return this.logs;
  }

  public logAction(userId: string | undefined, userName: string, action: string, entityType: string, entityId: string, details: string) {
    this.logs.unshift({
      id: `log-${Date.now()}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
  }

  public getPreferences(userId: string): NotificationPreferences {
    return this.preferences[userId] || {
      userId,
      emailAnnouncements: true,
      reminder24h: true,
      reminder1h: true,
      eventStartingNow: true,
      eventChanges: true,
      unsubscribeToken: `unsub-${userId}`,
    };
  }

  public async setPreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
    this.preferences[userId] = prefs;
    await api.updateNotificationPreferences(prefs).catch(() => {});
  }

  public getCategories(): Category[] {
    return this.categories;
  }
}

export const db = new EventPulseStorage();
if (typeof window !== 'undefined') {
  (window as any).db = db;
}
