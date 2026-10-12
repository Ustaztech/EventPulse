export type Role = 'STUDENT' | 'STAFF' | 'ORGANIZER' | 'ADMIN';
export type UserType = 'STUDENT' | 'STAFF' | 'ALUMNI' | 'EXTERNAL';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TargetAudience = 'UNIVERSITY_WIDE' | 'FACULTY' | 'DEPARTMENT' | 'INTEREST';
export type EventFormat = 'PHYSICAL' | 'ONLINE' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CANCELLED';
export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';
export type NotificationType = 
  | 'ANNOUNCEMENT' 
  | 'REGISTRATION_CONFIRMATION' 
  | 'REMINDER_24H' 
  | 'REMINDER_1H' 
  | 'STARTING_NOW' 
  | 'EVENT_UPDATE' 
  | 'EVENT_CANCELLED';
export type DeliveryStatus = 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  userType: UserType;
  matricOrStaffId?: string;
  faculty?: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  verificationToken?: string;
  createdAt: string;
}

export interface OrganiserApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationName: string;
  department?: string;
  faculty?: string;
  reason: string;
  status: ApplicationStatus;
  adminFeedback?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  organizerId: string;
  organizerName: string;
  organizerContact: string;
  targetAudience: TargetAudience;
  targetFaculty?: string;
  targetDepartment?: string;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  timezone: string;  // Default "Africa/Lagos"
  format: EventFormat;
  
  // Physical / Hybrid details
  venueName?: string;
  buildingHall?: string;
  roomNumber?: string;
  campusArea?: string;
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  directionsUrl?: string;

  // Online / Hybrid details
  onlinePlatform?: string;
  onlineJoinLink?: string;
  restrictJoinLink: boolean;

  // Registration & Rules
  requiresRegistration: boolean;
  capacity?: number;
  registeredCount?: number;
  registrationDeadline?: string;
  accessibilityInfo?: string;
  arrivalInstructions?: string;
  status: EventStatus;
  approvalFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  referenceCode: string;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt?: string;
  event?: Event;
}

export interface Bookmark {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  emailAnnouncements: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  eventStartingNow: boolean;
  eventChanges: boolean;
  unsubscribeToken: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  eventId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailOutboxJob {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  notificationType: NotificationType;
  eventId?: string;
  userId?: string;
  scheduledFor: string;
  status: DeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
