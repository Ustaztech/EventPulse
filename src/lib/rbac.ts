import { User, Role } from './types';

/**
 * Checks if a user has any of the specified roles.
 */
export function hasRole(user: User | null | undefined, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Can user access the Administrator Dashboard and administrative actions.
 * Strictly checks the cryptographically verified role.
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

/**
 * Can user access Organizer Workspace and event management actions.
 */
export function canAccessOrganizer(user: User | null | undefined): boolean {
  return user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
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
 * Can user configure global mailing platform credentials.
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
