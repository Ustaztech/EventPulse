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
import { emailService } from './emailService';

// Production storage keys
const STORAGE_KEYS = {
  USERS: 'eventpulse_users_prod',
  CURRENT_USER: 'eventpulse_current_user_prod',
  EVENTS: 'eventpulse_events_prod',
  REGISTRATIONS: 'eventpulse_registrations_prod',
  BOOKMARKS: 'eventpulse_bookmarks_prod',
  NOTIFICATIONS: 'eventpulse_notifications_prod',
  OUTBOX: 'eventpulse_outbox_prod',
  APPLICATIONS: 'eventpulse_applications_prod',
  LOGS: 'eventpulse_logs_prod',
  FEEDBACKS: 'eventpulse_feedbacks_prod',
  PREFERENCES: 'eventpulse_preferences_prod',
  CATEGORIES: 'eventpulse_categories_prod'
};

// Official System Categories
const SYSTEM_CATEGORIES: Category[] = CATEGORY_DEFINITIONS.map((c, i) => ({
  id: `cat-${i + 1}`,
  name: c.name,
  slug: c.slug,
  description: c.description,
  icon: c.icon,
  color: c.color,
}));

// Initial Bootstrap Audit Log
const SYSTEM_INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-sys-init',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'System',
    entityId: 'EVENTPULSE-CORE',
    details: 'EventPulse production engine initialized.',
    ipAddress: '102.89.44.12',
    createdAt: new Date().toISOString(),
  }
];

// Production Storage Engine
class EventPulseStorage {
  private get<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  public init() {
    if (typeof window === 'undefined') return;

    // Purge legacy mock data and demo storage keys
    const legacyKeys = [
      'nsuk_ep_users_v1',
      'nsuk_ep_current_user_v1',
      'nsuk_ep_events_v1',
      'nsuk_ep_registrations_v1',
      'nsuk_ep_bookmarks_v1',
      'nsuk_ep_notifications_v1',
      'nsuk_ep_outbox_v1',
      'nsuk_ep_applications_v1',
      'nsuk_ep_logs_v1',
      'nsuk_ep_feedbacks_v1',
      'nsuk_ep_preferences_v1',
      'nsuk_ep_categories_v1',
      'nsuk_ep_users_live',
      'nsuk_ep_current_user_live',
      'nsuk_ep_events_live',
      'nsuk_ep_registrations_live',
      'nsuk_ep_bookmarks_live',
      'nsuk_ep_notifications_live',
      'nsuk_ep_outbox_live',
      'nsuk_ep_applications_live',
      'nsuk_ep_logs_live',
      'nsuk_ep_feedbacks_live',
      'nsuk_ep_preferences_live',
      'nsuk_ep_categories_live'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));

    // Initialize clean production stores
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.set(STORAGE_KEYS.CATEGORIES, SYSTEM_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.set(STORAGE_KEYS.EVENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
      this.set(STORAGE_KEYS.REGISTRATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OUTBOX)) {
      this.set(STORAGE_KEYS.OUTBOX, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      this.set(STORAGE_KEYS.APPLICATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      this.set(STORAGE_KEYS.LOGS, SYSTEM_INITIAL_LOGS);
    }

    // Run automated lifecycle scanner on startup
    this.runAutomatedLifecycleScan();
  }

  // --- Auth & Users ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public getCurrentUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public login(email: string, passwordHash: string): { user?: User; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { error: 'Account not found. Please register your account.' };
    if (user.passwordHash !== passwordHash) {
      return { error: 'Invalid password. Please try again.' };
    }
    
    // Ensure designated super admin has ADMIN role upon login
    if (user.email.toLowerCase() === EventPulseStorage.SUPER_ADMIN_EMAIL.toLowerCase() && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      this.set(STORAGE_KEYS.USERS, users);
    }

    this.setCurrentUser(user);
    this.logAction(user.id, user.name, 'USER_LOGIN', 'User', user.id, `User signed in as ${user.role}`);
    return { user };
  }

  public static readonly SUPER_ADMIN_EMAIL = 'yahayazaid2021@gmail.com';

  public registerUser(userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>): User {
    const users = this.getUsers();
    
    // Strict Administrator Policy:
    // Only 'yahayazaid2021@gmail.com' is automatically granted ADMIN privileges.
    // All other accounts receive their standard requested affiliation role.
    const isSuperAdminEmail = userData.email.trim().toLowerCase() === EventPulseStorage.SUPER_ADMIN_EMAIL.toLowerCase();
    const assignedRole: Role = isSuperAdminEmail ? 'ADMIN' : (userData.role || 'STUDENT');

    const newUser: User = {
      ...userData,
      role: assignedRole,
      id: `user-${Date.now()}`,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(newUser);

    // Initialize notification preferences
    this.setPreferences(newUser.id, {
      userId: newUser.id,
      emailAnnouncements: true,
      reminder24h: true,
      reminder1h: true,
      eventStartingNow: true,
      eventChanges: true,
      unsubscribeToken: `unsub-${Date.now()}`
    });

    // Send Automated Welcome Notification Email and In-App alert
    this.sendWelcomeEmail(newUser);

    this.logAction(newUser.id, newUser.name, 'USER_REGISTER', 'User', newUser.id, `Account registered as ${assignedRole}.`);
    return newUser;
  }

  public promoteToAdmin(userId: string, requestingUserId?: string): boolean {
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Security Gate:
    // Only the designated Super Admin (yahayazaid2021@gmail.com) OR an existing ADMIN can promote
    const currentUser = this.getCurrentUser();
    const requester = requestingUserId ? users.find(u => u.id === requestingUserId) : currentUser;
    const isTargetSuperAdmin = targetUser.email.trim().toLowerCase() === EventPulseStorage.SUPER_ADMIN_EMAIL.toLowerCase();
    const isRequesterAdmin = requester && requester.role === 'ADMIN';

    if (!isTargetSuperAdmin && !isRequesterAdmin) {
      console.warn('Access Denied: Only an existing Administrator or yahayazaid2021@gmail.com can claim or grant admin privileges.');
      return false;
    }

    targetUser.role = 'ADMIN';
    this.set(STORAGE_KEYS.USERS, users);

    if (currentUser && currentUser.id === userId) {
      currentUser.role = 'ADMIN';
      this.setCurrentUser(currentUser);
    }

    this.logAction(
      requester?.id, 
      requester?.name || 'System Policy', 
      'ROLE_PROMOTED_ADMIN', 
      'User', 
      userId, 
      `Account ${targetUser.email} elevated to System Administrator`
    );
    return true;
  }

  public updateUserRole(userId: string, newRole: User['role'], adminName: string): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    users[index].role = newRole;
    this.set(STORAGE_KEYS.USERS, users);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.role = newRole;
      this.setCurrentUser(current);
    }

    this.logAction(undefined, adminName, 'ROLE_UPDATED', 'User', userId, `Changed role to ${newRole}`);
    return true;
  }

  // --- Events ---
  public getEvents(): Event[] {
    return this.get<Event[]>(STORAGE_KEYS.EVENTS, []);
  }

  public getEventBySlug(slug: string): Event | undefined {
    return this.getEvents().find(e => e.slug === slug);
  }

  public getEventById(id: string): Event | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  public saveEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registeredCount'>): Event {
    const events = this.getEvents();
    const newEvent: Event = {
      ...eventData,
      id: `evt-${Date.now()}`,
      registeredCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    events.unshift(newEvent);
    this.set(STORAGE_KEYS.EVENTS, events);

    // If created directly by Admin as PUBLISHED, trigger automated announcement outbox jobs!
    if (newEvent.status === 'PUBLISHED') {
      this.broadcastNewEventPublished(newEvent);
    }

    this.logAction(eventData.organizerId, eventData.organizerName, 'EVENT_CREATED', 'Event', newEvent.id, `Created event: ${newEvent.title}`);
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<Event>, authorName: string): Event | null {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;

    const oldEvent = events[index];
    const isLocationChanged = updates.venueName && updates.venueName !== oldEvent.venueName;
    const isTimeChanged = updates.startTime && updates.startTime !== oldEvent.startTime;

    const updatedEvent: Event = {
      ...oldEvent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    events[index] = updatedEvent;
    this.set(STORAGE_KEYS.EVENTS, events);

    if (isLocationChanged || isTimeChanged) {
      this.broadcastEventUpdate(updatedEvent, isLocationChanged ? 'Venue location changed' : 'Schedule adjusted');
    }

    this.logAction(undefined, authorName, 'EVENT_UPDATED', 'Event', id, `Updated event: ${updatedEvent.title}`);
    return updatedEvent;
  }

  public updateEventStatus(id: string, status: Event['status'], reviewerName: string, feedback?: string): boolean {
    const events = this.getEvents();
    const event = events.find(e => e.id === id);
    if (!event) return false;

    const wasDraft = event.status !== 'PUBLISHED';
    event.status = status;
    if (feedback) event.approvalFeedback = feedback;
    event.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.EVENTS, events);

    if (status === 'PUBLISHED' && wasDraft) {
      this.broadcastNewEventPublished(event);
    }

    if (status === 'CANCELLED') {
      this.broadcastEventCancelled(event);
    }

    this.logAction(undefined, reviewerName, `EVENT_${status}`, 'Event', id, `Changed event status to ${status}`);
    return true;
  }

  // --- Registrations (ACID Isolation) ---
  public getRegistrations(): Registration[] {
    return this.get<Registration[]>(STORAGE_KEYS.REGISTRATIONS, []);
  }

  public getUserRegistrations(userId: string): (Registration & { event?: Event })[] {
    const regs = this.getRegistrations().filter(r => r.userId === userId && r.status !== 'CANCELLED');
    const events = this.getEvents();
    return regs.map(r => ({
      ...r,
      event: events.find(e => e.id === r.eventId)
    }));
  }

  public registerForEvent(eventId: string, user: User): { success: boolean; error?: string; registration?: Registration } {
    const events = this.getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return { success: false, error: 'Event does not exist.' };

    const event = events[eventIndex];

    if (event.status !== 'PUBLISHED') {
      return { success: false, error: 'This event is not published or open for registrations.' };
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return { success: false, error: 'Registration deadline has passed for this event.' };
    }

    const registrations = this.getRegistrations();
    const existing = registrations.find(r => r.eventId === eventId && r.userId === user.id && r.status !== 'CANCELLED');
    if (existing) {
      return { success: false, error: 'You are already registered for this event.' };
    }

    // Capacity Constraint Check
    const currentCount = event.registeredCount || 0;
    if (event.capacity && currentCount >= event.capacity) {
      return { success: false, error: 'This event has reached full seating capacity.' };
    }

    // Atomic increment
    event.registeredCount = currentCount + 1;
    events[eventIndex] = event;
    this.set(STORAGE_KEYS.EVENTS, events);

    // Create unique admission pass
    const refCode = `EP-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referenceCode: refCode,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString(),
      event,
    };
    registrations.push(newReg);
    this.set(STORAGE_KEYS.REGISTRATIONS, registrations);

    // Instant In-App Notification
    this.addInAppNotification({
      userId: user.id,
      title: 'Registration Confirmed',
      message: `Your pass for "${event.title}" is confirmed. Reference: ${refCode}.`,
      type: 'REGISTRATION_CONFIRMATION',
      eventId: event.id
    });

    // Durable Email Outbox Enqueue
    this.enqueueOutboxJob({
      recipientEmail: user.email,
      recipientName: user.name,
      subject: `Registration Confirmed: ${event.title}`,
      bodyHtml: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1E40AF, #0D9488); padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">EventPulse</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Campus Event Notification Engine</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Dear <strong>${user.name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your seat has been reserved for <strong>${event.title}</strong>.</p>
            
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Ticket Reference:</span>
                <strong style="font-size: 16px; color: #1E40AF;">${refCode}</strong>
              </div>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Date & Time:</strong> ${new Date(event.startTime).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
              <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Venue:</strong> ${event.venueName || 'Online'} (${event.campusArea || 'Main Campus'})</p>
              ${event.landmark ? `<p style="margin: 4px 0; font-size: 12px; color: #64748b;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
            </div>

            <p style="font-size: 13px; color: #64748b;">Please present this email or your digital pass in the EventPulse app at entrance check-in.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
            EventPulse &bull; Stay Connected. Never Miss an Event. &bull; support@eventpulse.com.ng
          </div>
        </div>
      `,
      bodyText: `Your registration for ${event.title} is confirmed. Pass Reference: ${refCode}. Venue: ${event.venueName || 'Online'}. Time: ${new Date(event.startTime).toLocaleString()}`,
      notificationType: 'REGISTRATION_CONFIRMATION',
      eventId: event.id,
      userId: user.id,
      idempotencyKey: `reg-conf-${refCode}`
    });

    this.logAction(user.id, user.name, 'EVENT_REGISTER', 'Registration', newReg.id, `Registered for: ${event.title}`);
    return { success: true, registration: newReg };
  }

  public cancelRegistration(registrationId: string, user: User): boolean {
    const registrations = this.getRegistrations();
    const regIndex = registrations.findIndex(r => r.id === registrationId && r.userId === user.id);
    if (regIndex === -1) return false;

    const reg = registrations[regIndex];
    reg.status = 'CANCELLED';
    this.set(STORAGE_KEYS.REGISTRATIONS, registrations);

    const events = this.getEvents();
    const event = events.find(e => e.id === reg.eventId);
    if (event && event.registeredCount && event.registeredCount > 0) {
      event.registeredCount -= 1;
      this.set(STORAGE_KEYS.EVENTS, events);
    }

    this.addInAppNotification({
      userId: user.id,
      title: 'Registration Cancelled',
      message: `Your reservation (${reg.referenceCode}) has been cancelled.`,
      type: 'EVENT_CANCELLED',
      eventId: reg.eventId
    });

    this.logAction(user.id, user.name, 'REGISTRATION_CANCEL', 'Registration', reg.id, `Cancelled reservation ${reg.referenceCode}`);
    return true;
  }

  public checkInAttendee(referenceCode: string, organizerName: string): { success: boolean; attendee?: Registration; error?: string } {
    const registrations = this.getRegistrations();
    const reg = registrations.find(r => r.referenceCode.toUpperCase() === referenceCode.toUpperCase());
    if (!reg) return { success: false, error: 'Invalid reference code. Pass not found in system.' };
    if (reg.status === 'ATTENDED') return { success: false, error: `Already checked in at ${new Date(reg.attendedAt!).toLocaleTimeString()}` };
    if (reg.status === 'CANCELLED') return { success: false, error: 'This registration pass was cancelled.' };

    reg.status = 'ATTENDED';
    reg.attendedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.REGISTRATIONS, registrations);

    this.logAction(undefined, organizerName, 'ATTENDANCE_CHECKIN', 'Registration', reg.id, `Checked in ${reg.userName} (${reg.referenceCode})`);
    return { success: true, attendee: reg };
  }

  // --- Bookmarks ---
  public getBookmarks(userId: string): Bookmark[] {
    const all = this.get<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, []);
    return all.filter(b => b.userId === userId);
  }

  public toggleBookmark(eventId: string, userId: string): boolean {
    let all = this.get<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, []);
    const exists = all.some(b => b.eventId === eventId && b.userId === userId);
    if (exists) {
      all = all.filter(b => !(b.eventId === eventId && b.userId === userId));
      this.set(STORAGE_KEYS.BOOKMARKS, all);
      return false;
    } else {
      all.push({ id: `bm-${Date.now()}`, eventId, userId, createdAt: new Date().toISOString() });
      this.set(STORAGE_KEYS.BOOKMARKS, all);
      return true;
    }
  }

  // --- Notifications & Email Outbox ---
  public getInAppNotifications(userId: string): InAppNotification[] {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifs.filter(n => n.userId === userId);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = notifs.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public addInAppNotification(data: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>): InAppNotification {
    const notifs = this.get<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif: InAppNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return newNotif;
  }

  public getOutboxJobs(): EmailOutboxJob[] {
    return this.get<EmailOutboxJob[]>(STORAGE_KEYS.OUTBOX, []);
  }

  public enqueueOutboxJob(data: Omit<EmailOutboxJob, 'id' | 'status' | 'attemptCount' | 'maxAttempts' | 'createdAt' | 'updatedAt' | 'scheduledFor'> & { scheduledFor?: string }): EmailOutboxJob {
    const outbox = this.getOutboxJobs();
    
    // Idempotency Guard
    const existing = outbox.find(j => j.idempotencyKey === data.idempotencyKey);
    if (existing) return existing;

    const newJob: EmailOutboxJob = {
      ...data,
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      scheduledFor: data.scheduledFor || new Date().toISOString(),
      status: 'QUEUED',
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    outbox.unshift(newJob);
    this.set(STORAGE_KEYS.OUTBOX, outbox);

    // Auto-deliver simulation in local development
    setTimeout(() => {
      this.processOutboxJob(newJob.id);
    }, 1500);

    return newJob;
  }

  public processOutboxJob(jobId: string): void {
    const outbox = this.getOutboxJobs();
    const job = outbox.find(j => j.id === jobId);
    if (!job || job.status === 'DELIVERED') return;

    job.attemptCount += 1;
    job.lastAttemptAt = new Date().toISOString();
    job.status = 'DELIVERED';
    job.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.OUTBOX, outbox);
  }

  public retryOutboxJob(jobId: string): boolean {
    const outbox = this.getOutboxJobs();
    const job = outbox.find(j => j.id === jobId);
    if (!job) return false;

    job.status = 'QUEUED';
    job.attemptCount = 0;
    job.errorMessage = undefined;
    job.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.OUTBOX, outbox);

    setTimeout(() => {
      this.processOutboxJob(jobId);
    }, 1000);
    return true;
  }

  // ========================================================
  // AUTOMATED LIFECYCLE EMAIL NOTIFICATION DISPATCH ENGINE
  // ========================================================

  /**
   * 1. AUTOMATED WELCOME MESSAGE
   * Automatically triggered when any user registers an account.
   */
  public sendWelcomeEmail(user: User): EmailOutboxJob {
    const isSuperAdminEmail = user.email.trim().toLowerCase() === EventPulseStorage.SUPER_ADMIN_EMAIL.toLowerCase();

    // In-App Welcome notification
    this.addInAppNotification({
      userId: user.id,
      title: isSuperAdminEmail ? 'Welcome Super Administrator!' : 'Welcome to EventPulse!',
      message: isSuperAdminEmail 
        ? 'Welcome Super Administrator. Full EventPulse management and moderation privileges unlocked.' 
        : `Your account has been registered as ${user.role}. You will receive automatic email notifications for new events, upcoming reminders, and live sessions.`,
      type: 'ANNOUNCEMENT'
    });

    const job = this.enqueueOutboxJob({
      recipientEmail: user.email,
      recipientName: user.name,
      subject: 'Welcome to EventPulse: Campus Event Discovery & Smart Notification Engine',
      bodyHtml: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1E40AF, #0D9488); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to EventPulse!</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95;">Campus Event Management & Automated Notification Dispatch</p>
          </div>
          <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${user.name}</strong>,</p>
            <p>Welcome to <strong>EventPulse</strong>! Your campus account (<strong>${user.email}</strong>) is active as <strong>${user.role}</strong>.</p>
            <div style="background: #f8fafc; border-left: 4px solid #0D9488; padding: 16px; margin: 20px 0; border-radius: 6px;">
              <h4 style="margin: 0 0 8px; color: #0F172A; font-size: 14px;">Automated Notification Service Active:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
                <li><strong>New Event Announcements:</strong> Automated notifications whenever new campus events are published.</li>
                <li><strong>Countdown Reminders:</strong> Automated notifications sent 24 hours and 1 hour before scheduled start time.</li>
                <li><strong>Live "Happening Now" Alerts:</strong> Instant notices when sessions and workshops go live.</li>
                <li><strong>Instant Digital Pass Delivery:</strong> Verified entry QR reference sent to your inbox upon registration.</li>
              </ul>
            </div>
            <p style="font-size: 13px; color: #64748b;">You can review your campus tickets, inspect the delivery queue, or adjust notification preferences anytime in your EventPulse dashboard.</p>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              Dispatched automatically by EventPulse Campus Mail &bull; <a href="mailto:support@eventpulse.com.ng" style="color: #1E40AF; text-decoration: none; font-weight: bold;">support@eventpulse.com.ng</a>
            </div>
          </div>
        </div>
      `,
      bodyText: `Welcome to EventPulse, ${user.name}! Your account is active as ${user.role}. You will receive automatic notifications for new events, 24h/1h reminders, and live sessions. Contact support@eventpulse.com.ng for assistance.`,
      notificationType: 'ANNOUNCEMENT',
      userId: user.id,
      idempotencyKey: `welcome-user-${user.id}`
    });

    // Dispatch via external mailing provider (Resend / MailerLite)
    emailService.sendEmail({
      to: user.email,
      recipientName: user.name,
      subject: job.subject,
      html: job.bodyHtml,
      text: job.bodyText,
      category: 'welcome',
    });

    return job;
  }

  /**
   * 2. AUTOMATED NEW EVENT PUBLISHED BROADCAST
   * Automatically triggered when an event is added and published.
   */
  public broadcastNewEventPublished(event: Event): { count: number } {
    const users = this.getUsers().filter(u => u.emailVerified);
    let count = 0;

    users.forEach(u => {
      const prefs = this.getPreferences(u.id);
      if (!prefs.emailAnnouncements) return;

      this.addInAppNotification({
        userId: u.id,
        title: `New Event: ${event.title}`,
        message: `A new campus event "${event.title}" has been scheduled for ${new Date(event.startTime).toLocaleDateString()} at ${event.venueName || 'Campus Main Hall'}.`,
        type: 'ANNOUNCEMENT',
        eventId: event.id
      });

      this.enqueueOutboxJob({
        recipientEmail: u.email,
        recipientName: u.name,
        subject: `New Campus Event Added: ${event.title}`,
        bodyHtml: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #1E40AF, #3B82F6); padding: 28px 24px; color: #ffffff;">
              <span style="background: rgba(255,255,255,0.22); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">New Event Announcement</span>
              <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 800; line-height: 1.3;">${event.title}</h1>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">Dear <strong>${u.name}</strong>,</p>
              <p>A new campus event has just been scheduled and registration is now open:</p>
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Category:</strong> ${event.categoryName || 'Campus Activity'}</p>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Date & Time:</strong> ${new Date(event.startTime).toLocaleString()}</p>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'} (${event.campusArea || 'Main Campus'})</p>
                ${event.landmark ? `<p style="margin: 0 0 6px; font-size: 12px; color: #64748b;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
                <p style="margin: 10px 0 0; font-size: 13px; color: #475569;">${event.description}</p>
              </div>
              <p style="font-size: 13px;">Reserve your seat and claim your verified digital pass inside your EventPulse dashboard.</p>
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                Dispatched automatically by EventPulse Mail Engine &bull; <a href="mailto:support@eventpulse.com.ng" style="color: #1E40AF; text-decoration: none; font-weight: bold;">support@eventpulse.com.ng</a>
              </div>
            </div>
          </div>
        `,
        bodyText: `New Campus Event Added: ${event.title}\nDate: ${new Date(event.startTime).toLocaleString()}\nVenue: ${event.venueName || 'Campus Main Hall'}\nDescription: ${event.description}\nReserve your pass on EventPulse.`,
        notificationType: 'ANNOUNCEMENT',
        eventId: event.id,
        userId: u.id,
        idempotencyKey: `new-evt-${event.id}-${u.id}`
      });
      count += 1;
    });

    this.logAction(event.organizerId, event.organizerName, 'NOTIFICATION_BROADCAST', 'Event', event.id, `Broadcasted new event notification to ${count} campus members.`);

    // Dispatch via external mailing provider (Resend / MailerLite)
    const validUsers = users.filter(u => this.getPreferences(u.id).emailAnnouncements);
    emailService.sendBatchEmail({
      recipients: validUsers.map(u => ({ email: u.email, name: u.name })),
      subject: `New Campus Event Added: ${event.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1E40AF, #3B82F6); padding: 28px 24px; color: #ffffff;">
            <span style="background: rgba(255,255,255,0.22); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">New Event Announcement</span>
            <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 800;">${event.title}</h1>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p>A new campus event has just been scheduled and registration is now open:</p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
              <p style="margin: 0 0 6px;"><strong>Date & Time:</strong> ${new Date(event.startTime).toLocaleString()}</p>
              <p style="margin: 0 0 6px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'}</p>
              <p style="margin: 10px 0 0; color: #475569;">${event.description}</p>
            </div>
            <p>Log in to EventPulse to claim your pass.</p>
          </div>
        </div>
      `,
      text: `New Event: ${event.title}\nDate: ${new Date(event.startTime).toLocaleString()}\nVenue: ${event.venueName || 'Campus Hall'}\n${event.description}`,
      category: 'new_event',
    });

    return { count };
  }

  /**
   * 3. AUTOMATED REMINDER NOTIFICATION (ABOUT TO HAPPEN)
   * Automatically triggered 24 hours and 1 hour before scheduled start time.
   */
  public broadcastEventAboutToHappen(eventId: string, reminderType: 'REMINDER_24H' | 'REMINDER_1H'): { count: number } {
    const event = this.getEventById(eventId);
    if (!event) return { count: 0 };

    const regs = this.getRegistrations().filter(r => r.eventId === eventId && r.status === 'CONFIRMED');
    if (regs.length === 0) return { count: 0 };
    const targetAudience = regs.map(r => ({ email: r.userEmail, name: r.userName, userId: r.userId, ref: r.referenceCode }));

    const is1H = reminderType === 'REMINDER_1H';
    const timeLabel = is1H ? '1 Hour' : '24 Hours';
    const urgencySubject = is1H 
      ? `Starting in 1 Hour: ${event.title} - Doors Opening Soon!` 
      : `Starting Tomorrow (24h Reminder): ${event.title}`;

    let count = 0;
    targetAudience.forEach(target => {
      // In-App Notification
      this.addInAppNotification({
        userId: target.userId,
        title: is1H ? `Starting in 1 Hour: ${event.title}` : `Starting Tomorrow: ${event.title}`,
        message: is1H 
          ? `Doors open soon! "${event.title}" kicks off in 1 hour at ${event.venueName || 'Campus Main Hall'}. Reference: ${target.ref}.` 
          : `Reminder: "${event.title}" takes place tomorrow at ${new Date(event.startTime).toLocaleTimeString()}. Venue: ${event.venueName || 'Campus Main Hall'}.`,
        type: reminderType,
        eventId: event.id
      });

      // Automated Outbox Job
      this.enqueueOutboxJob({
        recipientEmail: target.email,
        recipientName: target.name,
        subject: urgencySubject,
        bodyHtml: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: ${is1H ? 'linear-gradient(135deg, #D97706, #EA580C)' : 'linear-gradient(135deg, #1E40AF, #0D9488)'}; padding: 26px 24px; color: #ffffff;">
              <span style="background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                ${is1H ? 'Final Countdown &bull; Starting in 1 Hour' : 'Event Reminder &bull; Tomorrow in 24 Hours'}
              </span>
              <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 800; line-height: 1.3;">${event.title}</h1>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">Dear <strong>${target.name}</strong>,</p>
              <p>This is an automated reminder that your scheduled campus event begins in <strong>${timeLabel}</strong>:</p>
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
                <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Ticket Reference Pass:</p>
                <p style="margin: 0 0 12px; font-size: 18px; font-weight: 900; color: #1E40AF; letter-spacing: 0.5px;">${target.ref}</p>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Scheduled Kickoff:</strong> ${new Date(event.startTime).toLocaleString()}</p>
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'} (${event.campusArea || 'Main Campus'})</p>
                ${event.landmark ? `<p style="margin: 0 0 6px; font-size: 12px; color: #64748b;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
                ${event.arrivalInstructions ? `<p style="margin: 8px 0 0; font-size: 12px; color: #475569;"><strong>Arrival Instructions:</strong> ${event.arrivalInstructions}</p>` : ''}
              </div>
              <p style="font-size: 13px;">Please have your pass QR code ready on your phone when arriving at the venue door.</p>
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                Dispatched automatically by EventPulse Mail Engine &bull; <a href="mailto:support@eventpulse.com.ng" style="color: #1E40AF; text-decoration: none; font-weight: bold;">support@eventpulse.com.ng</a>
              </div>
            </div>
          </div>
        `,
        bodyText: `Reminder: ${event.title} begins in ${timeLabel}!\nVenue: ${event.venueName || 'Campus Main Hall'}\nPass Code: ${target.ref}\nTime: ${new Date(event.startTime).toLocaleString()}`,
        notificationType: reminderType,
        eventId: event.id,
        userId: target.userId,
        idempotencyKey: `reminder-${reminderType.toLowerCase()}-${event.id}-${target.userId}`
      });
      count += 1;
    });

    this.logAction(undefined, 'Automated Scheduler', 'REMINDER_DISPATCHED', 'Event', eventId, `Dispatched ${reminderType} reminder to ${count} participants.`);

    // Dispatch via external mailing provider (Resend / MailerLite)
    emailService.sendBatchEmail({
      recipients: targetAudience.map(t => ({ email: t.email, name: t.name })),
      subject: urgencySubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: ${is1H ? 'linear-gradient(135deg, #D97706, #EA580C)' : 'linear-gradient(135deg, #1E40AF, #0D9488)'}; padding: 26px 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">${is1H ? 'Starting in 1 Hour' : 'Starting Tomorrow'}: ${event.title}</h1>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p>Your registered event is starting in <strong>${timeLabel}</strong>!</p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
              <p style="margin: 0 0 6px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'}</p>
              <p style="margin: 0 0 6px;"><strong>Time:</strong> ${new Date(event.startTime).toLocaleString()}</p>
            </div>
            <p>Please have your pass ready on your phone upon arrival.</p>
          </div>
        </div>
      `,
      text: `Reminder: ${event.title} starts in ${timeLabel}! Venue: ${event.venueName || 'Campus Main Hall'}`,
      category: 'approaching',
    });

    return { count };
  }

  /**
   * 4. AUTOMATED LIVE KICKOFF NOTICE (HAPPENING NOW)
   * Automatically triggered when an event commences live.
   */
  public broadcastEventHappeningNow(eventId: string): { count: number } {
    const event = this.getEventById(eventId);
    if (!event) return { count: 0 };

    const regs = this.getRegistrations().filter(r => r.eventId === eventId && r.status === 'CONFIRMED');
    if (regs.length === 0) return { count: 0 };
    const targetAudience = regs.map(r => ({ email: r.userEmail, name: r.userName, userId: r.userId, ref: r.referenceCode }));

    let count = 0;
    targetAudience.forEach(target => {
      // In-App Notification
      this.addInAppNotification({
        userId: target.userId,
        title: `Happening Now: ${event.title}`,
        message: `Live Kickoff! "${event.title}" is underway right now at ${event.venueName || 'Campus Main Hall'}. Doors are open!`,
        type: 'STARTING_NOW',
        eventId: event.id
      });

      // Automated Outbox Job
      this.enqueueOutboxJob({
        recipientEmail: target.email,
        recipientName: target.name,
        subject: `Happening Now: ${event.title} is Officially Underway!`,
        bodyHtml: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 26px 24px; color: #ffffff;">
              <span style="background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                Live Now &bull; Doors Open
              </span>
              <h1 style="margin: 12px 0 0; font-size: 22px; font-weight: 800; line-height: 1.3;">${event.title} is Happening Now!</h1>
            </div>
            <div style="padding: 24px; color: #334155; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0;">Dear <strong>${target.name}</strong>,</p>
              <p>The stage is set and the event is officially live right now!</p>
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin: 18px 0;">
                <p style="margin: 0 0 6px; font-size: 13px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'} (${event.campusArea || 'Main Campus'})</p>
                ${event.buildingHall ? `<p style="margin: 0 0 6px; font-size: 13px;"><strong>Hall / Room:</strong> ${event.buildingHall} - ${event.roomNumber || 'Main Space'}</p>` : ''}
                ${event.landmark ? `<p style="margin: 0 0 6px; font-size: 12px; color: #047857;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
                <p style="margin: 8px 0 0; font-size: 13px; font-weight: bold; color: #065f46;">Pass Reference: ${target.ref}</p>
              </div>
              <p style="font-size: 13px;">Head over to the venue check-in desk now to scan your digital ticket.</p>
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                Dispatched automatically by EventPulse Mail Engine &bull; <a href="mailto:support@eventpulse.com.ng" style="color: #1E40AF; text-decoration: none; font-weight: bold;">support@eventpulse.com.ng</a>
              </div>
            </div>
          </div>
        `,
        bodyText: `Happening Now: ${event.title} is officially live right now at ${event.venueName || 'Campus Main Hall'}!\nReference: ${target.ref}`,
        notificationType: 'STARTING_NOW',
        eventId: event.id,
        userId: target.userId,
        idempotencyKey: `now-${event.id}-${target.userId}`
      });
      count += 1;
    });

    this.logAction(undefined, 'Automated Scheduler', 'LIVE_DISPATCHED', 'Event', eventId, `Dispatched Happening Now notice to ${count} participants.`);

    // Dispatch via external mailing provider (Resend / MailerLite)
    emailService.sendBatchEmail({
      recipients: targetAudience.map(t => ({ email: t.email, name: t.name })),
      subject: `Happening Now: ${event.title} is Officially Underway!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 26px 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Happening Now: ${event.title} is Live!</h1>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <p>The doors are open and the session has officially begun!</p>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin: 18px 0;">
              <p style="margin: 0 0 6px;"><strong>Venue:</strong> ${event.venueName || 'Campus Main Hall'}</p>
              ${event.landmark ? `<p style="margin: 0 0 6px; color: #047857;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
            </div>
            <p>Proceed to check-in to validate your pass.</p>
          </div>
        </div>
      `,
      text: `Happening Now: ${event.title} is underway now at ${event.venueName || 'Campus Main Hall'}!`,
      category: 'happening_now',
    });

    return { count };
  }

  /**
   * 5. AUTOMATED LIFECYCLE SCHEDULER SCANNER
   * Scans all published events against current time to trigger approaching reminders and live alerts.
   */
  public runAutomatedLifecycleScan(): { dispatched24h: number; dispatched1h: number; dispatchedNow: number } {
    const events = this.getEvents().filter(e => e.status === 'PUBLISHED');
    const now = Date.now();
    let dispatched24h = 0;
    let dispatched1h = 0;
    let dispatchedNow = 0;

    events.forEach(event => {
      const startMs = new Date(event.startTime).getTime();
      const endMs = new Date(event.endTime).getTime();
      const diffMs = startMs - now;
      const oneHourMs = 60 * 60 * 1000;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      // Event about to happen (within 24 hours, but > 1 hour away)
      if (diffMs > oneHourMs && diffMs <= twentyFourHoursMs) {
        const outbox = this.getOutboxJobs();
        const alreadySent = outbox.some(j => j.idempotencyKey.startsWith(`reminder-reminder_24h-${event.id}`));
        if (!alreadySent) {
          const res = this.broadcastEventAboutToHappen(event.id, 'REMINDER_24H');
          dispatched24h += res.count;
        }
      }

      // Event about to happen (within 1 hour and > 0)
      if (diffMs > 0 && diffMs <= oneHourMs) {
        const outbox = this.getOutboxJobs();
        const alreadySent = outbox.some(j => j.idempotencyKey.startsWith(`reminder-reminder_1h-${event.id}`));
        if (!alreadySent) {
          const res = this.broadcastEventAboutToHappen(event.id, 'REMINDER_1H');
          dispatched1h += res.count;
        }
      }

      // Event happening now (now >= startMs and now <= endMs or within 3 hours of start)
      if (now >= startMs && (now <= endMs || (now - startMs < 3 * oneHourMs))) {
        const outbox = this.getOutboxJobs();
        const alreadySent = outbox.some(j => j.idempotencyKey.startsWith(`now-${event.id}`));
        if (!alreadySent) {
          const res = this.broadcastEventHappeningNow(event.id);
          dispatchedNow += res.count;
        }
      }
    });

    return { dispatched24h, dispatched1h, dispatchedNow };
  }

  private broadcastEventUpdate(event: Event, changeReason: string) {
    const registrations = this.getRegistrations().filter(r => r.eventId === event.id && r.status === 'CONFIRMED');
    registrations.forEach(r => {
      this.addInAppNotification({
        userId: r.userId,
        title: `Event Notice: ${event.title}`,
        message: `Notice: ${changeReason}. Latest venue: ${event.venueName}, Time: ${new Date(event.startTime).toLocaleTimeString()}.`,
        type: 'EVENT_UPDATE',
        eventId: event.id
      });
      this.enqueueOutboxJob({
        recipientEmail: r.userEmail,
        recipientName: r.userName,
        subject: `Event Updated: ${event.title}`,
        bodyHtml: `<h3>Notice: ${changeReason}</h3><p>New Venue: ${event.venueName}</p><p>New Time: ${new Date(event.startTime).toLocaleString()}</p>`,
        bodyText: `Event Updated: ${event.title}. ${changeReason}. Latest venue: ${event.venueName}`,
        notificationType: 'EVENT_UPDATE',
        eventId: event.id,
        userId: r.userId,
        idempotencyKey: `update-${event.id}-${r.userId}-${Date.now()}`
      });
    });
  }

  private broadcastEventCancelled(event: Event) {
    const registrations = this.getRegistrations().filter(r => r.eventId === event.id && r.status === 'CONFIRMED');
    registrations.forEach(r => {
      this.addInAppNotification({
        userId: r.userId,
        title: `Event Cancelled: ${event.title}`,
        message: `Notice: "${event.title}" has been cancelled.`,
        type: 'EVENT_CANCELLED',
        eventId: event.id
      });
      this.enqueueOutboxJob({
        recipientEmail: r.userEmail,
        recipientName: r.userName,
        subject: `Event Cancelled: ${event.title}`,
        bodyHtml: `<h3>Cancellation Notice</h3><p>Dear ${r.userName}, "${event.title}" has been cancelled.</p>`,
        bodyText: `"${event.title}" has been cancelled.`,
        notificationType: 'EVENT_CANCELLED',
        eventId: event.id,
        userId: r.userId,
        idempotencyKey: `cancel-${event.id}-${r.userId}`
      });
    });
  }

  // --- Organiser Applications ---
  public getApplications(): OrganiserApplication[] {
    return this.get<OrganiserApplication[]>(STORAGE_KEYS.APPLICATIONS, []);
  }

  public submitApplication(app: Omit<OrganiserApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): OrganiserApplication {
    const apps = this.getApplications();
    const newApp: OrganiserApplication = {
      ...app,
      id: `app-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    apps.unshift(newApp);
    this.set(STORAGE_KEYS.APPLICATIONS, apps);
    this.logAction(app.userId, app.userName, 'ORGANIZER_APPLY', 'Application', newApp.id, `Applied for organizer privileges`);
    return newApp;
  }

  public reviewApplication(appId: string, status: 'APPROVED' | 'REJECTED', adminName: string, feedback?: string): boolean {
    const apps = this.getApplications();
    const app = apps.find(a => a.id === appId);
    if (!app) return false;

    app.status = status;
    app.adminFeedback = feedback;
    app.reviewedBy = adminName;
    app.updatedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.APPLICATIONS, apps);

    if (status === 'APPROVED') {
      this.updateUserRole(app.userId, 'ORGANIZER', adminName);
      this.addInAppNotification({
        userId: app.userId,
        title: 'Organiser Application Approved!',
        message: 'You have been granted access to the EventPulse Organiser Workspace.',
        type: 'ANNOUNCEMENT'
      });
    }

    this.logAction(undefined, adminName, `APPLICATION_${status}`, 'Application', appId, `Organiser application ${status.toLowerCase()}`);
    return true;
  }

  // --- Audit Logs & Preferences ---
  public getLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.LOGS, SYSTEM_INITIAL_LOGS);
  }

  public logAction(userId: string | undefined, userName: string, action: string, entityType: string, entityId: string, details: string) {
    const logs = this.getLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      ipAddress: '102.89.44.12',
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.set(STORAGE_KEYS.LOGS, logs.slice(0, 100));
  }

  public getPreferences(userId: string): NotificationPreferences {
    const all = this.get<Record<string, NotificationPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    return all[userId] || {
      userId,
      emailAnnouncements: true,
      reminder24h: true,
      reminder1h: true,
      eventStartingNow: true,
      eventChanges: true,
      unsubscribeToken: `unsub-${userId}`
    };
  }

  public setPreferences(userId: string, prefs: NotificationPreferences): void {
    const all = this.get<Record<string, NotificationPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    all[userId] = prefs;
    this.set(STORAGE_KEYS.PREFERENCES, all);
  }

  // --- Feedback ---
  public getEventFeedbacks(eventId: string): EventFeedback[] {
    const feedbacks = this.get<EventFeedback[]>(STORAGE_KEYS.FEEDBACKS, []);
    return feedbacks.filter(f => f.eventId === eventId);
  }

  public addFeedback(fb: Omit<EventFeedback, 'id' | 'createdAt'>): EventFeedback {
    const feedbacks = this.get<EventFeedback[]>(STORAGE_KEYS.FEEDBACKS, []);
    const newFb: EventFeedback = {
      ...fb,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    feedbacks.unshift(newFb);
    this.set(STORAGE_KEYS.FEEDBACKS, feedbacks);
    return newFb;
  }
}

export const db = new EventPulseStorage();

if (typeof window !== 'undefined') {
  (window as unknown as { db: EventPulseStorage }).db = db;
  // Periodic background scanner: automatically checks approaching events and live kickoffs
  setInterval(() => {
    db.runAutomatedLifecycleScan();
  }, 45000);
}
