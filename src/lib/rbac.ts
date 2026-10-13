import { User, Role } from './types';

export const SUPER_ADMIN_EMAIL = 'yahayazaid2021@gmail.com';

/**
 * Checks if the user is the designated Super Administrator.
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/**
 * Checks if a user has any of the specified roles.
 */
export function hasRole(user: User | null | undefined, allowedRoles: Role[]): boolean {
  if (!user) return false;
  // If user is super admin email, they have access to all role actions
  if (isSuperAdmin(user)) return true;
  return allowedRoles.includes(user.role);
}

/**
 * Can user access the Administrator Dashboard and administrative actions.
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' || isSuperAdmin(user);
}

/**
 * Can user access Organizer Workspace and event management actions.
 */
export function canAccessOrganizer(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'ORGANIZER' || user.role === 'ADMIN' || isSuperAdmin(user);
}

/**
 * Can user access Student / Attendee Dashboard.
 */
export function canAccessStudent(user: User | null | undefined): boolean {
  return !!user;
}

/**
 * Can user manage, edit or cancel a specific event.
 */
export function canManageEvent(user: User | null | undefined, eventOrganizerId: string): boolean {
  if (!user) return false;
  if (canAccessAdmin(user)) return true;
  return user.id === eventOrganizerId && user.role === 'ORGANIZER';
}

/**
 * Can user configure global mailing platform credentials (Resend / MailerLite API keys).
 */
export function canManageMailingSettings(user: User | null | undefined): boolean {
  return canAccessAdmin(user);
}

/**
 * Returns the recommended landing dashboard route for the user based on role.
 */
export function getDefaultDashboardRoute(user: User | null | undefined): string {
  if (!user) return '/auth/login';
  if (canAccessAdmin(user)) return '/dashboard/admin';
  if (user.role === 'ORGANIZER') return '/dashboard/organizer';
  return '/dashboard/student';
}
