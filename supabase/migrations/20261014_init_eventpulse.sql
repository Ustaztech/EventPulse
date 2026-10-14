-- ============================================================================
-- EventPulse Campus Event Management & Notification System
-- Nasarawa State University, Keffi (NSUK) Implementation
-- PostgreSQL / Supabase Production Schema & Row Level Security (RLS)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for clean migration run
-- Drop views / triggers first if existing
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS event_feedback CASCADE;
DROP TABLE IF EXISTS email_suppressions CASCADE;
DROP TABLE IF EXISTS email_outbox CASCADE;
DROP TABLE IF EXISTS in_app_notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS organiser_applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('STUDENT', 'STAFF', 'ALUMNI', 'EXTERNAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_format AS ENUM ('PHYSICAL', 'ONLINE', 'HYBRID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'RETURNED_FOR_REVISION', 'REJECTED', 'CANCELLED', 'COMPLETED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE target_audience AS ENUM ('UNIVERSITY_WIDE', 'FACULTY', 'DEPARTMENT', 'INTEREST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'ANNOUNCEMENT',
    'REGISTRATION_CONFIRMATION',
    'REMINDER_24H',
    'REMINDER_1H',
    'STARTING_NOW',
    'EVENT_UPDATE',
    'EVENT_CANCELLED',
    'PASSWORD_RESET',
    'EMAIL_VERIFICATION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'SUPPRESSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  user_type user_type NOT NULL DEFAULT 'STUDENT',
  matric_or_staff_id VARCHAR(100),
  faculty VARCHAR(255),
  department VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires_at TIMESTAMPTZ,
  reset_token VARCHAR(255),
  reset_token_expires_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organiser Applications
CREATE TABLE organiser_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  faculty VARCHAR(255),
  department VARCHAR(255),
  reason TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'PENDING',
  admin_feedback TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  campus VARCHAR(100) NOT NULL,
  building VARCHAR(255) NOT NULL,
  address TEXT,
  landmark VARCHAR(255),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT,
  category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organizer_name VARCHAR(255) NOT NULL,
  organizer_contact VARCHAR(255) NOT NULL,
  target_audience target_audience NOT NULL DEFAULT 'UNIVERSITY_WIDE',
  target_faculty VARCHAR(255),
  target_department VARCHAR(255),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Lagos',
  format event_format NOT NULL DEFAULT 'PHYSICAL',
  
  -- Venue / Location
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  venue_name VARCHAR(255),
  building_hall VARCHAR(255),
  room_number VARCHAR(100),
  campus_area VARCHAR(100),
  address TEXT,
  landmark VARCHAR(255),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  directions_url TEXT,
  
  -- Online format details
  online_platform VARCHAR(100),
  online_join_link TEXT,
  restrict_join_link BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Registration & Capacity
  requires_registration BOOLEAN NOT NULL DEFAULT TRUE,
  capacity INT CHECK (capacity IS NULL OR capacity > 0),
  registered_count INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  registration_deadline TIMESTAMPTZ,
  accessibility_info TEXT,
  arrival_instructions TEXT,
  status event_status NOT NULL DEFAULT 'DRAFT',
  approval_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_event_dates CHECK (end_time > start_time),
  CONSTRAINT valid_deadline CHECK (registration_deadline IS NULL OR registration_deadline <= start_time)
);

-- 6. Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_code VARCHAR(50) UNIQUE NOT NULL,
  status registration_status NOT NULL DEFAULT 'CONFIRMED',
  qr_token VARCHAR(100) UNIQUE NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  CONSTRAINT unique_active_user_event_reg UNIQUE (event_id, user_id)
);

-- 7. Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_event_bookmark UNIQUE (event_id, user_id)
);

-- 8. User Interests
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_category_interest UNIQUE (user_id, category_id)
);

-- 9. Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_24h BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_1h BOOLEAN NOT NULL DEFAULT TRUE,
  event_starting_now BOOLEAN NOT NULL DEFAULT TRUE,
  event_changes BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token VARCHAR(100) UNIQUE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. In-App Notifications
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Email Outbox
CREATE TABLE email_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status delivery_status NOT NULL DEFAULT 'QUEUED',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Email Suppressions
CREATE TABLE email_suppressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Event Feedback
CREATE TABLE event_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_event_feedback UNIQUE (event_id, user_id)
);

-- 14. Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'OPEN',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. System Settings
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal querying
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_ref ON registrations(reference_code);
CREATE INDEX idx_registrations_qr ON registrations(qr_token);
CREATE INDEX idx_notifications_user_read ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_outbox_status_scheduled ON email_outbox(status, scheduled_for);
CREATE INDEX idx_outbox_idempotency ON email_outbox(idempotency_key);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organiser_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current Supabase Auth user is ADMIN
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current Supabase Auth user is ORGANIZER
CREATE OR REPLACE FUNCTION auth_is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND (role = 'ORGANIZER' OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories & Venues Policies (Public Read)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories manageable by admins" ON categories FOR ALL USING (auth_is_admin());

CREATE POLICY "Venues are viewable by everyone" ON venues FOR SELECT USING (true);
CREATE POLICY "Venues manageable by admins" ON venues FOR ALL USING (auth_is_admin());

-- Events Policies
-- Anonymous visitors can ONLY view PUBLISHED events
CREATE POLICY "Published events viewable by everyone" ON events
  FOR SELECT USING (status = 'PUBLISHED' OR auth.uid() = organizer_id OR auth_is_admin());

-- Organizers can create draft/pending events
CREATE POLICY "Organizers can create events" ON events
  FOR INSERT WITH CHECK (auth_is_organizer() AND organizer_id = auth.uid());

-- Organizers can edit their own events; admins can edit any
CREATE POLICY "Organizers manage own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id OR auth_is_admin());

CREATE POLICY "Admins can delete events without registrations" ON events
  FOR DELETE USING (auth_is_admin() AND registered_count = 0);

-- Registrations Policies
-- Users can view only their own registrations; organizers can view registrations for their events; admins can view all
CREATE POLICY "Users view own registrations" ON registrations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR
    auth_is_admin()
  );

CREATE POLICY "Users can create their own registration" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own registration" ON registrations
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR
    auth_is_admin()
  );

-- In-App Notifications Policies (Strict user isolation)
CREATE POLICY "Users access own notifications" ON in_app_notifications
  FOR ALL USING (auth.uid() = user_id OR auth_is_admin());

-- Bookmarks & Interests
CREATE POLICY "Users manage own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own interests" ON user_interests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id OR auth_is_admin());

-- Organiser Applications Policies
CREATE POLICY "Users view own applications" ON organiser_applications
  FOR SELECT USING (auth.uid() = user_id OR auth_is_admin());

CREATE POLICY "Users can submit applications" ON organiser_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins review applications" ON organiser_applications
  FOR UPDATE USING (auth_is_admin());

-- Feedback Policies
CREATE POLICY "Feedback viewable for published events" ON event_feedback
  FOR SELECT USING (true);

CREATE POLICY "Registered users can submit feedback" ON event_feedback
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM registrations 
      WHERE registrations.event_id = event_feedback.event_id 
        AND registrations.user_id = auth.uid()
        AND registrations.status IN ('CONFIRMED', 'ATTENDED')
    )
  );

-- Support Tickets
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id OR auth_is_admin());

CREATE POLICY "Anyone can create support ticket" ON support_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins manage support tickets" ON support_tickets
  FOR UPDATE USING (auth_is_admin());

-- Email Outbox & Audit Logs (Restricted to Admins)
CREATE POLICY "Admins manage email outbox" ON email_outbox
  FOR ALL USING (auth_is_admin());

CREATE POLICY "Admins view audit logs" ON audit_logs
  FOR SELECT USING (auth_is_admin());

-- ============================================================================
-- ATOMIC STORED FUNCTIONS
-- ============================================================================

-- Transaction-Safe Event Registration with Capacity Enforcement
CREATE OR REPLACE FUNCTION register_for_event_atomic(
  p_event_id UUID,
  p_user_id UUID,
  p_ref_code VARCHAR,
  p_qr_token VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_event RECORD;
  v_existing RECORD;
  v_reg_id UUID;
BEGIN
  -- Lock event row for atomic check-and-increment
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Event does not exist.');
  END IF;

  IF v_event.status != 'PUBLISHED' THEN
    RETURN json_build_object('success', false, 'error', 'This event is not published or open for registrations.');
  END IF;

  IF v_event.registration_deadline IS NOT NULL AND NOW() > v_event.registration_deadline THEN
    RETURN json_build_object('success', false, 'error', 'Registration deadline has passed for this event.');
  END IF;

  -- Check existing active registration
  SELECT * INTO v_existing FROM registrations 
  WHERE event_id = p_event_id AND user_id = p_user_id AND status != 'CANCELLED';

  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are already registered for this event.');
  END IF;

  -- Capacity check
  IF v_event.capacity IS NOT NULL AND v_event.registered_count >= v_event.capacity THEN
    RETURN json_build_object('success', false, 'error', 'This event has reached full seating capacity.');
  END IF;

  -- Create registration
  INSERT INTO registrations (event_id, user_id, reference_code, qr_token, status)
  VALUES (p_event_id, p_user_id, p_ref_code, p_qr_token, 'CONFIRMED')
  RETURNING id INTO v_reg_id;

  -- Increment registered count
  UPDATE events SET registered_count = registered_count + 1 WHERE id = p_event_id;

  RETURN json_build_object('success', true, 'registration_id', v_reg_id, 'reference_code', p_ref_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check-in / Scan QR Pass
CREATE OR REPLACE FUNCTION scan_attendance_pass(
  p_qr_token VARCHAR,
  p_organizer_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_reg RECORD;
  v_event RECORD;
BEGIN
  SELECT * INTO v_reg FROM registrations WHERE qr_token = p_qr_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid ticket pass. No registration found.');
  END IF;

  SELECT * INTO v_event FROM events WHERE id = v_reg.event_id;

  -- Check authorization
  IF v_event.organizer_id != p_organizer_user_id AND NOT EXISTS (SELECT 1 FROM users WHERE id = p_organizer_user_id AND role = 'ADMIN') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized. You can only check in attendees for your own events.');
  END IF;

  IF v_reg.status = 'ATTENDED' THEN
    RETURN json_build_object('success', false, 'error', 'Pass has already been checked in at ' || v_reg.attended_at);
  END IF;

  IF v_reg.status = 'CANCELLED' THEN
    RETURN json_build_object('success', false, 'error', 'This registration was cancelled and cannot be used for admission.');
  END IF;

  UPDATE registrations 
  SET status = 'ATTENDED', attended_at = NOW() 
  WHERE id = v_reg.id;

  RETURN json_build_object('success', true, 'reference_code', v_reg.reference_code, 'event_title', v_event.title);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: OFFICIAL SYSTEM CATEGORIES & NSUK VENUES
-- ============================================================================

INSERT INTO categories (id, name, slug, description, icon, color) VALUES
  ('cat-1', 'Academic', 'academic', 'Lectures, symposia, research presentations, and thesis defenses.', 'BookOpen', '#1E40AF'),
  ('cat-2', 'Technology', 'technology', 'Hackathons, coding workshops, AI seminars, and tech expos.', 'Code', '#06B6D4'),
  ('cat-3', 'Workshops', 'workshops', 'Skill acquisition sessions, hands-on training, and bootcamps.', 'Wrench', '#0D9488'),
  ('cat-4', 'Professional Development', 'professional-development', 'Career fairs, leadership summits, resume reviews, and networking.', 'Briefcase', '#6366F1'),
  ('cat-5', 'Social', 'social', 'Freshers orientation, dinners, award nights, and talent shows.', 'PartyPopper', '#EC4899'),
  ('cat-6', 'Sports', 'sports', 'Inter-faculty matches, marathons, indoor games, and fitness galas.', 'Trophy', '#10B981'),
  ('cat-7', 'Cultural', 'cultural', 'Cultural days, carnival displays, drama performances, and heritage exhibitions.', 'Palette', '#F59E0B'),
  ('cat-8', 'Religious', 'religious', 'Fellowship meetings, Ramadan lectures, worship nights, and interfaith dialogue.', 'HeartHandshake', '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO venues (name, campus, building, address, landmark, latitude, longitude, capacity) VALUES
  ('1000 Capacity Assembly Hall', 'Main Campus, Keffi', 'Central Assembly Complex', 'Academic Core, Nasarawa State University, Keffi', 'Opposite Main Library Plaza', 8.8486, 7.8741, 1000),
  ('ICT Centre Auditorium', 'Main Campus, Keffi', 'Directorate of ICT Hub', 'ICT Drive, Main Campus, Keffi', 'Adjacent to Senate Complex', 8.8492, 7.8755, 300),
  ('Faculty of Science Main Lecture Theatre', 'Main Campus, Keffi', 'Science Block B', 'Science Quadrant, Main Campus, Keffi', 'Near Chemistry Research Lab', 8.8475, 7.8732, 250),
  ('Senate Building Conference Hall', 'Main Campus, Keffi', 'Administrative Senate Tower', 'Senate Circle, Keffi', 'NSUK Gate A Entrance', 8.8501, 7.8760, 150),
  ('University Sports Complex Arena', 'Main Campus, Keffi', 'Outdoor & Indoor Sports Center', 'Sports Village, Keffi Campus', 'Behind Student Hostel Block C', 8.8450, 7.8720, 2000),
  ('Postgraduate School Seminar Room A', 'Pyanku Campus, Keffi', 'PG Studies Building', 'Pyanku Road, Keffi', 'Old Campus Administrative Block', 8.8390, 7.8680, 80)
ON CONFLICT DO NOTHING;
