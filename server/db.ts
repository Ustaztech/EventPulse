import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { hashPassword, generateSecureToken } from './auth';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'STUDENT' | 'STAFF' | 'ORGANIZER' | 'ADMIN';
  user_type: 'STUDENT' | 'STAFF' | 'ALUMNI' | 'EXTERNAL';
  matric_or_staff_id?: string;
  faculty?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
  email_verified: number; // 0 or 1
  verification_token?: string;
  verification_token_expires_at?: string;
  reset_token?: string;
  reset_token_expires_at?: string;
  mfa_enabled: number;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganiserApplicationRow {
  id: string;
  user_id: string;
  organization_name: string;
  faculty?: string;
  department?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: number;
  created_at: string;
}

export interface VenueRow {
  id: string;
  name: string;
  campus: string;
  building: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  is_active: number;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  banner_url?: string;
  category_id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_contact: string;
  target_audience: 'UNIVERSITY_WIDE' | 'FACULTY' | 'DEPARTMENT' | 'INTEREST';
  target_faculty?: string;
  target_department?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  format: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
  venue_id?: string;
  venue_name?: string;
  building_hall?: string;
  room_number?: string;
  campus_area?: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  directions_url?: string;
  online_platform?: string;
  online_join_link?: string;
  restrict_join_link: number;
  requires_registration: number;
  capacity?: number;
  registered_count: number;
  registration_deadline?: string;
  accessibility_info?: string;
  arrival_instructions?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'RETURNED_FOR_REVISION' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
  approval_feedback?: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  reference_code: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';
  qr_token: string;
  registered_at: string;
  attended_at?: string;
  cancellation_reason?: string;
  user_name?: string;
  user_email?: string;
  event_title?: string;
}

export interface InAppNotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  event_id?: string;
  is_read: number;
  created_at: string;
}

export interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  email_announcements: number;
  reminder_24h: number;
  reminder_1h: number;
  event_starting_now: number;
  event_changes: number;
  unsubscribe_token: string;
  updated_at: string;
}

export interface EmailOutboxRow {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  notification_type: string;
  event_id?: string;
  user_id?: string;
  scheduled_for: string;
  status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'SUPPRESSED';
  attempt_count: number;
  max_attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  provider?: string;
  provider_message_id?: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface EventFeedbackRow {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_name?: string;
}

export interface SupportTicketRow {
  id: string;
  reference_code: string;
  user_id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

class EventPulseDatabase {
  private db: DatabaseSync;

  constructor() {
    const dbDir = path.resolve(process.cwd(), 'prisma');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'dev.db');
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'STUDENT',
        user_type TEXT NOT NULL DEFAULT 'STUDENT',
        matric_or_staff_id TEXT,
        faculty TEXT,
        department TEXT,
        phone TEXT,
        avatar_url TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        verification_token TEXT,
        verification_token_expires_at TEXT,
        reset_token TEXT,
        reset_token_expires_at TEXT,
        mfa_enabled INTEGER NOT NULL DEFAULT 0,
        mfa_secret TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS organiser_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_name TEXT NOT NULL,
        faculty TEXT,
        department TEXT,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_feedback TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS venues (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        campus TEXT NOT NULL,
        building TEXT NOT NULL,
        address TEXT,
        landmark TEXT,
        latitude REAL,
        longitude REAL,
        capacity INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        banner_url TEXT,
        category_id TEXT NOT NULL REFERENCES categories(id),
        organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organizer_name TEXT NOT NULL,
        organizer_contact TEXT NOT NULL,
        target_audience TEXT NOT NULL DEFAULT 'UNIVERSITY_WIDE',
        target_faculty TEXT,
        target_department TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
        format TEXT NOT NULL DEFAULT 'PHYSICAL',
        venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
        venue_name TEXT,
        building_hall TEXT,
        room_number TEXT,
        campus_area TEXT,
        address TEXT,
        landmark TEXT,
        latitude REAL,
        longitude REAL,
        directions_url TEXT,
        online_platform TEXT,
        online_join_link TEXT,
        restrict_join_link INTEGER NOT NULL DEFAULT 1,
        requires_registration INTEGER NOT NULL DEFAULT 1,
        capacity INTEGER,
        registered_count INTEGER NOT NULL DEFAULT 0,
        registration_deadline TEXT,
        accessibility_info TEXT,
        arrival_instructions TEXT,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        approval_feedback TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reference_code TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        qr_token TEXT UNIQUE NOT NULL,
        registered_at TEXT NOT NULL,
        attended_at TEXT,
        cancellation_reason TEXT,
        UNIQUE (event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        UNIQUE (event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS user_interests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email_announcements INTEGER NOT NULL DEFAULT 1,
        reminder_24h INTEGER NOT NULL DEFAULT 1,
        reminder_1h INTEGER NOT NULL DEFAULT 1,
        event_starting_now INTEGER NOT NULL DEFAULT 1,
        event_changes INTEGER NOT NULL DEFAULT 1,
        unsubscribe_token TEXT UNIQUE NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS email_outbox (
        id TEXT PRIMARY KEY,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        scheduled_for TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'QUEUED',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        last_attempt_at TEXT,
        error_message TEXT,
        provider TEXT,
        provider_message_id TEXT,
        idempotency_key TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS email_suppressions (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_feedback (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT NOT NULL,
        UNIQUE (event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        reference_code TEXT UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN',
        admin_notes TEXT,
        resolved_at TEXT,
        resolved_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        user_name TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    this.seedDefaults();
  }

  private seedDefaults() {
    const now = new Date().toISOString();

    // 1. Seed Categories
    const categories = [
      { id: 'cat-1', name: 'Academic', slug: 'academic', description: 'Lectures, symposia, research presentations, and thesis defenses.', icon: 'BookOpen', color: '#1E40AF' },
      { id: 'cat-2', name: 'Technology', slug: 'technology', description: 'Hackathons, coding workshops, AI seminars, and tech expos.', icon: 'Code', color: '#06B6D4' },
      { id: 'cat-3', name: 'Workshops', slug: 'workshops', description: 'Skill acquisition sessions, hands-on training, and bootcamps.', icon: 'Wrench', color: '#0D9488' },
      { id: 'cat-4', name: 'Professional Development', slug: 'professional-development', description: 'Career fairs, leadership summits, resume reviews, and networking.', icon: 'Briefcase', color: '#6366F1' },
      { id: 'cat-5', name: 'Social', slug: 'social', description: 'Freshers orientation, dinners, award nights, and talent shows.', icon: 'PartyPopper', color: '#EC4899' },
      { id: 'cat-6', name: 'Sports', slug: 'sports', description: 'Inter-faculty matches, marathons, indoor games, and fitness galas.', icon: 'Trophy', color: '#10B981' },
      { id: 'cat-7', name: 'Cultural', slug: 'cultural', description: 'Cultural days, carnival displays, drama performances, and heritage exhibitions.', icon: 'Palette', color: '#F59E0B' },
      { id: 'cat-8', name: 'Religious', slug: 'religious', description: 'Fellowship meetings, Ramadan lectures, worship nights, and interfaith dialogue.', icon: 'HeartHandshake', color: '#8B5CF6' }
    ];

    const catStmt = this.db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, description, icon, color, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const c of categories) {
      catStmt.run(c.id, c.name, c.slug, c.description, c.icon, c.color, now);
    }

    // 2. Seed Venues
    const venues = [
      { id: 'ven-1', name: '1000 Capacity Assembly Hall', campus: 'Main Campus, Keffi', building: 'Central Assembly Complex', address: 'Academic Core, Nasarawa State University, Keffi', landmark: 'Opposite Main Library Plaza', lat: 8.8486, lng: 7.8741, cap: 1000 },
      { id: 'ven-2', name: 'ICT Centre Auditorium', campus: 'Main Campus, Keffi', building: 'Directorate of ICT Hub', address: 'ICT Drive, Main Campus, Keffi', landmark: 'Adjacent to Senate Complex', lat: 8.8492, lng: 7.8755, cap: 300 },
      { id: 'ven-3', name: 'Faculty of Science Main Lecture Theatre', campus: 'Main Campus, Keffi', building: 'Science Block B', address: 'Science Quadrant, Main Campus, Keffi', landmark: 'Near Chemistry Research Lab', lat: 8.8475, lng: 7.8732, cap: 250 },
      { id: 'ven-4', name: 'Senate Building Conference Hall', campus: 'Main Campus, Keffi', building: 'Administrative Senate Tower', address: 'Senate Circle, Keffi', landmark: 'NSUK Gate A Entrance', lat: 8.8501, lng: 7.8760, cap: 150 },
      { id: 'ven-5', name: 'University Sports Complex Arena', campus: 'Main Campus, Keffi', building: 'Outdoor & Indoor Sports Center', address: 'Sports Village, Keffi Campus', landmark: 'Behind Student Hostel Block C', lat: 8.8450, lng: 7.8720, cap: 2000 },
      { id: 'ven-6', name: 'Postgraduate School Seminar Room A', campus: 'Pyanku Campus, Keffi', building: 'PG Studies Building', address: 'Pyanku Road, Keffi', landmark: 'Old Campus Administrative Block', lat: 8.8390, lng: 7.8680, cap: 80 }
    ];

    const venStmt = this.db.prepare(`
      INSERT OR IGNORE INTO venues (id, name, campus, building, address, landmark, latitude, longitude, capacity, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const v of venues) {
      venStmt.run(v.id, v.name, v.campus, v.building, v.address, v.landmark, v.lat, v.lng, v.cap, now);
    }

    // 3. Seed Initial Administrator Account (Never plaintext!)
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@nsuk.edu.ng').toLowerCase();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
    const existingAdmin = this.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      const adminId = 'usr-admin-bootstrap';
      const passwordHash = hashPassword(adminPassword);
      this.db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, user_type, department, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ADMIN', 'STAFF', 'Directorate of ICT', 1, ?, ?)
      `).run(adminId, 'NSUK System Administrator', adminEmail, passwordHash, now, now);

      this.db.prepare(`
        INSERT OR IGNORE INTO notification_preferences (id, user_id, email_announcements, reminder_24h, reminder_1h, event_starting_now, event_changes, unsubscribe_token, updated_at)
        VALUES (?, ?, 1, 1, 1, 1, 1, ?, ?)
      `).run(`pref-${adminId}`, adminId, generateSecureToken(16), now);

      this.logAudit(adminId, 'System Bootstrap', 'SYSTEM_BOOTSTRAP', 'System', 'EVENTPULSE-CORE', 'Bootstrap administrator account provisioned', '127.0.0.1');
    }
  }

  // --- Users & Auth ---
  public getUserByEmail(email: string): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | undefined;
  }

  public getUserById(id: string): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  }

  public getUserByResetToken(token: string): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token) as UserRow | undefined;
  }

  public getUserByVerificationToken(token: string): UserRow | undefined {
    return this.db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token) as UserRow | undefined;
  }

  public getAllUsers(): UserRow[] {
    return this.db.prepare('SELECT id, name, email, role, user_type, matric_or_staff_id, faculty, department, phone, avatar_url, email_verified, mfa_enabled, created_at, updated_at FROM users ORDER BY created_at DESC').all() as UserRow[];
  }

  public createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'STUDENT' | 'STAFF';
    userType: 'STUDENT' | 'STAFF' | 'ALUMNI' | 'EXTERNAL';
    matricOrStaffId?: string;
    faculty?: string;
    department?: string;
    phone?: string;
    avatarUrl?: string;
    verificationToken?: string;
    verificationTokenExpiresAt?: string;
  }): UserRow {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, user_type, matric_or_staff_id, faculty, department, phone, avatar_url, email_verified, verification_token, verification_token_expires_at, mfa_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?)
    `).run(
      id,
      userData.name,
      userData.email.toLowerCase(),
      userData.passwordHash,
      userData.role,
      userData.userType,
      userData.matricOrStaffId || null,
      userData.faculty || null,
      userData.department || null,
      userData.phone || null,
      userData.avatarUrl || null,
      userData.verificationToken || null,
      userData.verificationTokenExpiresAt || null,
      now,
      now
    );

    // Default notification preferences
    const unsubToken = generateSecureToken(16);
    this.db.prepare(`
      INSERT INTO notification_preferences (id, user_id, email_announcements, reminder_24h, reminder_1h, event_starting_now, event_changes, unsubscribe_token, updated_at)
      VALUES (?, ?, 1, 1, 1, 1, 1, ?, ?)
    `).run(`pref-${id}`, id, unsubToken, now);

    return this.getUserById(id)!;
  }

  public verifyUserEmail(userId: string): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, userId);
    return res.changes > 0;
  }

  public setPasswordResetToken(userId: string, token: string, expiresAt: string): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE users SET reset_token = ?, reset_token_expires_at = ?, updated_at = ?
      WHERE id = ?
    `).run(token, expiresAt, now, userId);
    return res.changes > 0;
  }

  public updateUserPassword(userId: string, passwordHash: string): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, userId);
    return res.changes > 0;
  }

  public updateUserProfile(userId: string, updates: {
    name?: string;
    phone?: string;
    faculty?: string;
    department?: string;
    avatarUrl?: string;
    mfaEnabled?: number;
  }): UserRow | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        faculty = COALESCE(?, faculty),
        department = COALESCE(?, department),
        avatar_url = COALESCE(?, avatar_url),
        mfa_enabled = COALESCE(?, mfa_enabled),
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.name !== undefined ? updates.name : null,
      updates.phone !== undefined ? updates.phone : null,
      updates.faculty !== undefined ? updates.faculty : null,
      updates.department !== undefined ? updates.department : null,
      updates.avatarUrl !== undefined ? updates.avatarUrl : null,
      updates.mfaEnabled !== undefined ? updates.mfaEnabled : null,
      now,
      userId
    );

    return this.getUserById(userId);
  }

  public updateUserRole(userId: string, newRole: 'STUDENT' | 'STAFF' | 'ORGANIZER' | 'ADMIN'): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(newRole, now, userId);
    return res.changes > 0;
  }

  // --- Organiser Applications ---
  public submitOrganiserApplication(data: {
    userId: string;
    organizationName: string;
    faculty?: string;
    department?: string;
    reason: string;
  }): OrganiserApplicationRow {
    const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO organiser_applications (id, user_id, organization_name, faculty, department, reason, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(id, data.userId, data.organizationName, data.faculty || null, data.department || null, data.reason, now, now);

    return this.getOrganiserApplicationById(id)!;
  }

  public getOrganiserApplicationById(id: string): OrganiserApplicationRow | undefined {
    return this.db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM organiser_applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(id) as OrganiserApplicationRow | undefined;
  }

  public getOrganiserApplications(userId?: string): OrganiserApplicationRow[] {
    if (userId) {
      return this.db.prepare(`
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM organiser_applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
      `).all(userId) as OrganiserApplicationRow[];
    }
    return this.db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM organiser_applications a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `).all() as OrganiserApplicationRow[];
  }

  public reviewOrganiserApplication(id: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string, feedback?: string): boolean {
    const app = this.getOrganiserApplicationById(id);
    if (!app) return false;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE organiser_applications
      SET status = ?, reviewed_by = ?, admin_feedback = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(status, reviewedBy, feedback || null, now, now, id);

    if (status === 'APPROVED') {
      this.updateUserRole(app.user_id, 'ORGANIZER');
      this.createInAppNotification({
        userId: app.user_id,
        title: 'Organiser Application Approved!',
        message: 'Congratulations! Your campus event organiser accreditation has been verified and approved.',
        type: 'ANNOUNCEMENT'
      });
    }

    return true;
  }

  // --- Categories & Venues ---
  public getCategories(): CategoryRow[] {
    return this.db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC').all() as CategoryRow[];
  }

  public getCategoryBySlugOrId(identifier: string): CategoryRow | undefined {
    return this.db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ? OR LOWER(name) = LOWER(?)').get(identifier, identifier, identifier) as CategoryRow | undefined;
  }

  public createCategory(cat: { name: string; slug: string; description?: string; icon?: string; color?: string }): CategoryRow {
    const id = `cat-${Date.now()}`;
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO categories (id, name, slug, description, icon, color, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, cat.name, cat.slug, cat.description || null, cat.icon || null, cat.color || null, now);
    return this.getCategoryBySlugOrId(id)!;
  }

  public getVenues(): VenueRow[] {
    return this.db.prepare('SELECT * FROM venues WHERE is_active = 1 ORDER BY name ASC').all() as VenueRow[];
  }

  // --- Events ---
  public getEvents(filters?: {
    search?: string;
    category?: string;
    organizerId?: string;
    timeline?: 'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'all';
    campus?: string;
    format?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    includeDrafts?: boolean;
    sort?: 'date-asc' | 'date-desc' | 'popular' | 'alpha';
  }): EventRow[] {
    let query = `
      SELECT e.*, c.name as category_name, c.slug as category_slug, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // By default, public query only returns PUBLISHED
    if (filters?.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    } else if (!filters?.includeDrafts) {
      query += " AND e.status = 'PUBLISHED'";
    }

    // Search query
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(e.title) LIKE ? OR
        LOWER(e.description) LIKE ? OR
        LOWER(e.venue_name) LIKE ? OR
        LOWER(e.organizer_name) LIKE ? OR
        LOWER(c.name) LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    // Category matching (handles category ID, slug, or display name)
    if (filters?.category && filters.category !== 'all') {
      query += ' AND (e.category_id = ? OR c.slug = ? OR LOWER(c.name) = LOWER(?))';
      params.push(filters.category, filters.category, filters.category);
    }

    // Organizer filter
    if (filters?.organizerId && filters.organizerId !== 'all') {
      query += ' AND e.organizer_id = ?';
      params.push(filters.organizerId);
    }

    // Campus filter
    if (filters?.campus && filters.campus !== 'all') {
      query += ' AND (e.campus_area = ? OR e.venue_name LIKE ?)';
      params.push(filters.campus, `%${filters.campus}%`);
    }

    // Format filter
    if (filters?.format && filters.format !== 'all') {
      query += ' AND e.format = ?';
      params.push(filters.format);
    }

    // Date range filter
    if (filters?.startDate) {
      query += ' AND e.start_time >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND e.start_time <= ?';
      params.push(filters.endDate);
    }

    // Timeline filter
    const now = new Date().toISOString();
    if (filters?.timeline === 'upcoming') {
      query += " AND e.start_time > ? AND e.status != 'CANCELLED'";
      params.push(now);
    } else if (filters?.timeline === 'ongoing') {
      query += " AND e.start_time <= ? AND e.end_time >= ? AND e.status != 'CANCELLED'";
      params.push(now, now);
    } else if (filters?.timeline === 'past') {
      query += " AND e.end_time < ? AND e.status != 'CANCELLED'";
      params.push(now);
    } else if (filters?.timeline === 'cancelled') {
      query += " AND e.status = 'CANCELLED'";
    }

    // Sorting
    if (filters?.sort === 'date-desc') {
      query += ' ORDER BY e.start_time DESC';
    } else if (filters?.sort === 'popular') {
      query += ' ORDER BY e.registered_count DESC, e.start_time ASC';
    } else if (filters?.sort === 'alpha') {
      query += ' ORDER BY e.title ASC';
    } else {
      query += ' ORDER BY e.start_time ASC';
    }

    return this.db.prepare(query).all(...params) as EventRow[];
  }

  public getEventById(id: string): EventRow | undefined {
    return this.db.prepare(`
      SELECT e.*, c.name as category_name, c.slug as category_slug, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(id) as EventRow | undefined;
  }

  public getEventBySlug(slug: string): EventRow | undefined {
    return this.db.prepare(`
      SELECT e.*, c.name as category_name, c.slug as category_slug, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.slug = ?
    `).get(slug) as EventRow | undefined;
  }

  public createEvent(data: Omit<EventRow, 'id' | 'registered_count' | 'created_at' | 'updated_at' | 'category_name' | 'category_slug' | 'category_color'>): EventRow {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO events (
        id, title, slug, description, banner_url, category_id, organizer_id, organizer_name, organizer_contact,
        target_audience, target_faculty, target_department, start_time, end_time, timezone, format,
        venue_id, venue_name, building_hall, room_number, campus_area, address, landmark, latitude, longitude,
        directions_url, online_platform, online_join_link, restrict_join_link, requires_registration,
        capacity, registered_count, registration_deadline, accessibility_info, arrival_instructions, status,
        approval_feedback, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.slug, data.description, data.banner_url || null, data.category_id,
      data.organizer_id, data.organizer_name, data.organizer_contact, data.target_audience,
      data.target_faculty || null, data.target_department || null, data.start_time, data.end_time,
      data.timezone || 'Africa/Lagos', data.format, data.venue_id || null, data.venue_name || null,
      data.building_hall || null, data.room_number || null, data.campus_area || null,
      data.address || null, data.landmark || null, data.latitude || null, data.longitude || null,
      data.directions_url || null, data.online_platform || null, data.online_join_link || null,
      data.restrict_join_link !== undefined ? data.restrict_join_link : 1,
      data.requires_registration !== undefined ? data.requires_registration : 1,
      data.capacity || null, data.registration_deadline || null,
      data.accessibility_info || null, data.arrival_instructions || null,
      data.status || 'DRAFT', data.approval_feedback || null, now, now
    );

    return this.getEventById(id)!;
  }

  public updateEvent(id: string, updates: Partial<EventRow>): EventRow | undefined {
    const event = this.getEventById(id);
    if (!event) return undefined;

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE events SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        banner_url = COALESCE(?, banner_url),
        category_id = COALESCE(?, category_id),
        target_audience = COALESCE(?, target_audience),
        target_faculty = COALESCE(?, target_faculty),
        target_department = COALESCE(?, target_department),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        format = COALESCE(?, format),
        venue_name = COALESCE(?, venue_name),
        building_hall = COALESCE(?, building_hall),
        room_number = COALESCE(?, room_number),
        campus_area = COALESCE(?, campus_area),
        landmark = COALESCE(?, landmark),
        capacity = COALESCE(?, capacity),
        registration_deadline = COALESCE(?, registration_deadline),
        accessibility_info = COALESCE(?, accessibility_info),
        arrival_instructions = COALESCE(?, arrival_instructions),
        status = COALESCE(?, status),
        approval_feedback = COALESCE(?, approval_feedback),
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.title !== undefined ? updates.title : null,
      updates.description !== undefined ? updates.description : null,
      updates.banner_url !== undefined ? updates.banner_url : null,
      updates.category_id !== undefined ? updates.category_id : null,
      updates.target_audience !== undefined ? updates.target_audience : null,
      updates.target_faculty !== undefined ? updates.target_faculty : null,
      updates.target_department !== undefined ? updates.target_department : null,
      updates.start_time !== undefined ? updates.start_time : null,
      updates.end_time !== undefined ? updates.end_time : null,
      updates.format !== undefined ? updates.format : null,
      updates.venue_name !== undefined ? updates.venue_name : null,
      updates.building_hall !== undefined ? updates.building_hall : null,
      updates.room_number !== undefined ? updates.room_number : null,
      updates.campus_area !== undefined ? updates.campus_area : null,
      updates.landmark !== undefined ? updates.landmark : null,
      updates.capacity !== undefined ? updates.capacity : null,
      updates.registration_deadline !== undefined ? updates.registration_deadline : null,
      updates.accessibility_info !== undefined ? updates.accessibility_info : null,
      updates.arrival_instructions !== undefined ? updates.arrival_instructions : null,
      updates.status !== undefined ? updates.status : null,
      updates.approval_feedback !== undefined ? updates.approval_feedback : null,
      now,
      id
    );

    return this.getEventById(id);
  }

  public deleteEvent(id: string): { success: boolean; error?: string } {
    const event = this.getEventById(id);
    if (!event) return { success: false, error: 'Event not found.' };

    if (event.registered_count > 0) {
      return { success: false, error: 'Cannot delete event with existing registrations. Please cancel or archive the event instead.' };
    }

    this.db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return { success: true };
  }

  // --- Registrations (Transaction-Safe) ---
  public registerForEventAtomic(eventId: string, userId: string, userName: string, userEmail: string): {
    success: boolean;
    error?: string;
    registration?: RegistrationRow;
  } {
    const event = this.getEventById(eventId);
    if (!event) return { success: false, error: 'Event does not exist.' };

    if (event.status !== 'PUBLISHED') {
      return { success: false, error: 'This event is not open for registration.' };
    }

    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return { success: false, error: 'Registration deadline has passed for this event.' };
    }

    // Check duplicate
    const existing = this.db.prepare(`
      SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND status != 'CANCELLED'
    `).get(eventId, userId) as RegistrationRow | undefined;

    if (existing) {
      return { success: false, error: 'You are already registered for this event.' };
    }

    // Capacity constraint
    if (event.capacity && event.registered_count >= event.capacity) {
      return { success: false, error: 'This event has reached full seating capacity.' };
    }

    const id = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const refCode = `NSUK-EP-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrToken = generateSecureToken(16);
    const now = new Date().toISOString();

    // Atomic insert and increment
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`
        INSERT INTO registrations (id, event_id, user_id, reference_code, status, qr_token, registered_at)
        VALUES (?, ?, ?, ?, 'CONFIRMED', ?, ?)
      `).run(id, eventId, userId, refCode, qrToken, now);

      this.db.prepare(`
        UPDATE events SET registered_count = registered_count + 1 WHERE id = ?
      `).run(eventId);

      this.db.exec('COMMIT');
    } catch (err: any) {
      this.db.exec('ROLLBACK');
      return { success: false, error: err?.message || 'Transaction failed' };
    }

    const reg = this.getRegistrationById(id)!;
    return { success: true, registration: reg };
  }

  public getRegistrationById(id: string): RegistrationRow | undefined {
    return this.db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, e.title as event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `).get(id) as RegistrationRow | undefined;
  }

  public getRegistrationsByUserId(userId: string): (RegistrationRow & { event: EventRow })[] {
    const rows = this.db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, e.title as event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ? AND r.status != 'CANCELLED'
      ORDER BY r.registered_at DESC
    `).all(userId) as RegistrationRow[];

    return rows.map(r => ({
      ...r,
      event: this.getEventById(r.event_id)!
    }));
  }

  public getRegistrationsByEventId(eventId: string): RegistrationRow[] {
    return this.db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, u.matric_or_staff_id, u.department, e.title as event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.event_id = ?
      ORDER BY r.registered_at ASC
    `).all(eventId) as RegistrationRow[];
  }

  public cancelRegistration(regId: string, userId: string, isAdmin: boolean = false): boolean {
    const reg = this.getRegistrationById(regId);
    if (!reg) return false;
    if (!isAdmin && reg.user_id !== userId) return false;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare("UPDATE registrations SET status = 'CANCELLED' WHERE id = ?").run(regId);
      this.db.prepare('UPDATE events SET registered_count = MAX(0, registered_count - 1) WHERE id = ?').run(reg.event_id);
      this.db.exec('COMMIT');
    } catch {
      this.db.exec('ROLLBACK');
      return false;
    }

    return true;
  }

  public scanQrPass(qrTokenOrRef: string, scannerUserId: string, isAdmin: boolean = false): {
    success: boolean;
    error?: string;
    registration?: RegistrationRow;
  } {
    const reg = this.db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email, e.title as event_title, e.organizer_id
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.qr_token = ? OR UPPER(r.reference_code) = UPPER(?)
    `).get(qrTokenOrRef, qrTokenOrRef) as (RegistrationRow & { organizer_id: string }) | undefined;

    if (!reg) {
      return { success: false, error: 'Invalid admission pass. Ticket not recognized in system.' };
    }

    if (!isAdmin && reg.organizer_id !== scannerUserId) {
      return { success: false, error: 'Unauthorized: You can only check in attendees for your own events.' };
    }

    if (reg.status === 'ATTENDED') {
      return { success: false, error: `Already checked in at ${new Date(reg.attended_at!).toLocaleTimeString()}` };
    }

    if (reg.status === 'CANCELLED') {
      return { success: false, error: 'This registration pass was cancelled.' };
    }

    const now = new Date().toISOString();
    this.db.prepare("UPDATE registrations SET status = 'ATTENDED', attended_at = ? WHERE id = ?").run(now, reg.id);

    return { success: true, registration: this.getRegistrationById(reg.id) };
  }

  // --- Bookmarks ---
  public toggleBookmark(eventId: string, userId: string): boolean {
    const existing = this.db.prepare('SELECT id FROM bookmarks WHERE event_id = ? AND user_id = ?').get(eventId, userId);
    if (existing) {
      this.db.prepare('DELETE FROM bookmarks WHERE event_id = ? AND user_id = ?').run(eventId, userId);
      return false;
    } else {
      const id = `bm-${Date.now()}`;
      const now = new Date().toISOString();
      this.db.prepare('INSERT INTO bookmarks (id, event_id, user_id, created_at) VALUES (?, ?, ?, ?)').run(id, eventId, userId, now);
      return true;
    }
  }

  public getBookmarksByUserId(userId: string): { id: string; event_id: string; created_at: string }[] {
    return this.db.prepare('SELECT id, event_id, created_at FROM bookmarks WHERE user_id = ?').all(userId) as any[];
  }

  // --- In-App Notifications ---
  public getInAppNotifications(userId: string): InAppNotificationRow[] {
    return this.db.prepare('SELECT * FROM in_app_notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId) as InAppNotificationRow[];
  }

  public createInAppNotification(data: { userId: string; title: string; message: string; type: string; eventId?: string }): InAppNotificationRow {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO in_app_notifications (id, user_id, title, message, type, event_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, data.userId, data.title, data.message, data.type, data.eventId || null, now);

    return this.db.prepare('SELECT * FROM in_app_notifications WHERE id = ?').get(id) as InAppNotificationRow;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const res = this.db.prepare('UPDATE in_app_notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    const res = this.db.prepare('UPDATE in_app_notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    return res.changes > 0;
  }

  // --- Preferences & Unsubscribe ---
  public getNotificationPreferences(userId: string): NotificationPreferencesRow {
    let pref = this.db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as NotificationPreferencesRow | undefined;
    if (!pref) {
      const id = `pref-${userId}`;
      const unsub = generateSecureToken(16);
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO notification_preferences (id, user_id, email_announcements, reminder_24h, reminder_1h, event_starting_now, event_changes, unsubscribe_token, updated_at)
        VALUES (?, ?, 1, 1, 1, 1, 1, ?, ?)
      `).run(id, userId, unsub, now);
      pref = this.db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId) as NotificationPreferencesRow;
    }
    return pref;
  }

  public updateNotificationPreferences(userId: string, prefs: {
    emailAnnouncements?: boolean;
    reminder24h?: boolean;
    reminder1h?: boolean;
    eventStartingNow?: boolean;
    eventChanges?: boolean;
  }): NotificationPreferencesRow {
    const current = this.getNotificationPreferences(userId);
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE notification_preferences SET
        email_announcements = COALESCE(?, email_announcements),
        reminder_24h = COALESCE(?, reminder_24h),
        reminder_1h = COALESCE(?, reminder_1h),
        event_starting_now = COALESCE(?, event_starting_now),
        event_changes = COALESCE(?, event_changes),
        updated_at = ?
      WHERE user_id = ?
    `).run(
      prefs.emailAnnouncements !== undefined ? (prefs.emailAnnouncements ? 1 : 0) : null,
      prefs.reminder24h !== undefined ? (prefs.reminder24h ? 1 : 0) : null,
      prefs.reminder1h !== undefined ? (prefs.reminder1h ? 1 : 0) : null,
      prefs.eventStartingNow !== undefined ? (prefs.eventStartingNow ? 1 : 0) : null,
      prefs.eventChanges !== undefined ? (prefs.eventChanges ? 1 : 0) : null,
      now,
      userId
    );

    return this.getNotificationPreferences(userId);
  }

  public unsubscribeByToken(token: string): { success: boolean; email?: string; error?: string } {
    const pref = this.db.prepare('SELECT * FROM notification_preferences WHERE unsubscribe_token = ?').get(token) as NotificationPreferencesRow | undefined;
    if (!pref) {
      return { success: false, error: 'Invalid or expired unsubscribe token.' };
    }

    const now = new Date().toISOString();
    this.db.prepare("UPDATE notification_preferences SET email_announcements = 0, updated_at = ? WHERE id = ?").run(now, pref.id);

    const user = this.getUserById(pref.user_id);
    return { success: true, email: user?.email };
  }

  // --- Email Outbox ---
  public enqueueOutboxJob(job: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    notificationType: string;
    eventId?: string;
    userId?: string;
    scheduledFor?: string;
    idempotencyKey: string;
  }): EmailOutboxRow {
    const existing = this.db.prepare('SELECT * FROM email_outbox WHERE idempotency_key = ?').get(job.idempotencyKey) as EmailOutboxRow | undefined;
    if (existing) return existing;

    const id = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO email_outbox (
        id, recipient_email, recipient_name, subject, body_html, body_text, notification_type,
        event_id, user_id, scheduled_for, status, attempt_count, max_attempts, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', 0, 3, ?, ?, ?)
    `).run(
      id, job.recipientEmail, job.recipientName, job.subject, job.bodyHtml, job.bodyText,
      job.notificationType, job.eventId || null, job.userId || null, job.scheduledFor || now,
      job.idempotencyKey, now, now
    );

    return this.db.prepare('SELECT * FROM email_outbox WHERE id = ?').get(id) as EmailOutboxRow;
  }

  public getOutboxJobs(limit: number = 100): EmailOutboxRow[] {
    return this.db.prepare('SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT ?').all(limit) as EmailOutboxRow[];
  }

  public updateOutboxStatus(id: string, status: EmailOutboxRow['status'], provider?: string, providerMessageId?: string, errorMessage?: string): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE email_outbox SET
        status = ?,
        provider = COALESCE(?, provider),
        provider_message_id = COALESCE(?, provider_message_id),
        error_message = COALESCE(?, error_message),
        last_attempt_at = ?,
        attempt_count = attempt_count + 1,
        updated_at = ?
      WHERE id = ?
    `).run(status, provider || null, providerMessageId || null, errorMessage || null, now, now, id);
    return res.changes > 0;
  }

  // --- Feedback ---
  public addFeedback(fb: { eventId: string; userId: string; rating: number; comment?: string }): { success: boolean; error?: string } {
    // Eligibility: User must be registered or attended
    const reg = this.db.prepare(`
      SELECT id FROM registrations WHERE event_id = ? AND user_id = ? AND status != 'CANCELLED'
    `).get(fb.eventId, fb.userId);

    if (!reg) {
      return { success: false, error: 'Only confirmed or attended participants can submit event feedback.' };
    }

    const id = `fb-${Date.now()}`;
    const now = new Date().toISOString();

    try {
      this.db.prepare(`
        INSERT INTO event_feedback (id, event_id, user_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, fb.eventId, fb.userId, fb.rating, fb.comment || null, now);
      return { success: true };
    } catch {
      return { success: false, error: 'You have already submitted feedback for this event.' };
    }
  }

  public getEventFeedbacks(eventId: string): (EventFeedbackRow & { user_name: string })[] {
    return this.db.prepare(`
      SELECT f.*, u.name as user_name
      FROM event_feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.event_id = ?
      ORDER BY f.created_at DESC
    `).all(eventId) as any[];
  }

  // --- Support Tickets ---
  public createSupportTicket(ticket: { userId?: string; name: string; email: string; subject: string; message: string }): SupportTicketRow {
    const id = `tick-${Date.now()}`;
    const refCode = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO support_tickets (id, reference_code, user_id, name, email, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `).run(id, refCode, ticket.userId || null, ticket.name, ticket.email, ticket.subject, ticket.message, now, now);

    return this.db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id) as SupportTicketRow;
  }

  public getSupportTickets(): SupportTicketRow[] {
    return this.db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all() as SupportTicketRow[];
  }

  public updateSupportTicketStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED', resolvedBy?: string, adminNotes?: string): boolean {
    const now = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE support_tickets SET
        status = ?,
        resolved_by = COALESCE(?, resolved_by),
        admin_notes = COALESCE(?, admin_notes),
        resolved_at = CASE WHEN ? = 'RESOLVED' THEN ? ELSE resolved_at END,
        updated_at = ?
      WHERE id = ?
    `).run(status, resolvedBy || null, adminNotes || null, status, now, now, id);
    return res.changes > 0;
  }

  // --- Audit Logs (Real IP & Server Context) ---
  public logAudit(userId: string | undefined, userName: string | undefined, action: string, entityType: string, entityId: string | undefined, details: string, ipAddress?: string): void {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId || null, userName || 'System', action, entityType, entityId || null, details, ipAddress || '127.0.0.1', now);
  }

  public getAuditLogs(limit: number = 100): AuditLogRow[] {
    return this.db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit) as AuditLogRow[];
  }

  // --- Statistics & Participation Reports ---
  public getParticipationReport(): {
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    totalAttended: number;
    totalUsers: number;
    attendanceRate: number;
    byFaculty: { faculty: string; count: number }[];
    byCategory: { category: string; count: number }[];
  } {
    const totalEvents = (this.db.prepare('SELECT COUNT(*) as c FROM events').get() as any).c;
    const publishedEvents = (this.db.prepare("SELECT COUNT(*) as c FROM events WHERE status = 'PUBLISHED'").get() as any).c;
    const totalRegistrations = (this.db.prepare("SELECT COUNT(*) as c FROM registrations WHERE status != 'CANCELLED'").get() as any).c;
    const totalAttended = (this.db.prepare("SELECT COUNT(*) as c FROM registrations WHERE status = 'ATTENDED'").get() as any).c;
    const totalUsers = (this.db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

    const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

    const byFaculty = this.db.prepare(`
      SELECT COALESCE(u.faculty, 'Unspecified') as faculty, COUNT(r.id) as count
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.status != 'CANCELLED'
      GROUP BY u.faculty
      ORDER BY count DESC
    `).all() as any[];

    const byCategory = this.db.prepare(`
      SELECT c.name as category, COUNT(r.id) as count
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN categories c ON e.category_id = c.id
      WHERE r.status != 'CANCELLED'
      GROUP BY c.name
      ORDER BY count DESC
    `).all() as any[];

    return {
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalAttended,
      totalUsers,
      attendanceRate,
      byFaculty,
      byCategory
    };
  }
}

// Singleton backend database instance
export const serverDb = new EventPulseDatabase();
