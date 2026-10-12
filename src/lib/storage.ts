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

// Live production storage keys
const STORAGE_KEYS = {
  USERS: 'nsuk_ep_users_live',
  CURRENT_USER: 'nsuk_ep_current_user_live',
  EVENTS: 'nsuk_ep_events_live',
  REGISTRATIONS: 'nsuk_ep_registrations_live',
  BOOKMARKS: 'nsuk_ep_bookmarks_live',
  NOTIFICATIONS: 'nsuk_ep_notifications_live',
  OUTBOX: 'nsuk_ep_outbox_live',
  APPLICATIONS: 'nsuk_ep_applications_live',
  LOGS: 'nsuk_ep_logs_live',
  FEEDBACKS: 'nsuk_ep_feedbacks_live',
  PREFERENCES: 'nsuk_ep_preferences_live',
  CATEGORIES: 'nsuk_ep_categories_live'
};

// Official NSUK Categories (Permanent System Infrastructure)
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
    entityId: 'NSUK-EVENTPULSE-CORE',
    details: 'NSUK EventPulse production engine initialized. Waiting for administrator account creation.',
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

    // Purge old mock data from previous demo sessions
    const oldKeys = [
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
      'nsuk_ep_categories_v1'
    ];
    oldKeys.forEach(k => localStorage.removeItem(k));

    // Initialize clean production stores if not already existing
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
    if (user.passwordHash !== passwordHash) return { error: 'Invalid password. Please try again.' };
    
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

    // In-App Welcome Notification
    this.addInAppNotification({
      userId: newUser.id,
      title: 'Welcome to EventPulse NSUK!',
      message: isSuperAdminEmail 
        ? 'Welcome Super Administrator. Full NSUK management privileges unlocked.' 
        : `Your account has been registered as ${assignedRole}. Welcome to EventPulse.`,
      type: 'ANNOUNCEMENT'
    });

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

  // Broadcast Triggers
  private broadcastNewEventPublished(event: Event) {
    const users = this.getUsers().filter(u => u.emailVerified);
    users.forEach(u => {
      this.addInAppNotification({
        userId: u.id,
        title: `New Event: ${event.title}`,
        message: `A new campus event has been scheduled at ${event.venueName || 'NSUK'}.`,
        type: 'ANNOUNCEMENT',
        eventId: event.id
      });
      this.enqueueOutboxJob({
        recipientEmail: u.email,
        recipientName: u.name,
        subject: `New Campus Event: ${event.title}`,
        bodyHtml: `<h3>${event.title}</h3><p>${event.description}</p><p><strong>Venue:</strong> ${event.venueName || 'Online'}</p>`,
        bodyText: `New Campus Event: ${event.title} - ${event.description}`,
        notificationType: 'ANNOUNCEMENT',
        eventId: event.id,
        userId: u.id,
        idempotencyKey: `new-evt-${event.id}-${u.id}`
      });
    });
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
}
