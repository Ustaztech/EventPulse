/**
 * EventPulse Client API Gateway
 * Talks directly to shared backend API endpoints (/api/*).
 * Never relies on browser localStorage as the authoritative record store.
 */

const TOKEN_KEY = 'eventpulse_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(normalizedEndpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (data?.error) {
      throw new Error(data.error);
    }
    if (response.status === 404) {
      throw new Error(`Endpoint unavailable (${response.status}). Please verify the backend service is running or reload.`);
    }
    throw new Error(`HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, pass: string, rememberMe?: boolean) {
    const res = await request<{ success: boolean; user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, rememberMe }),
    });
    setStoredToken(res.token);
    return res;
  },

  async adminLogin(email: string, pass: string, mfaCode?: string) {
    const res = await request<{ success: boolean; user: any; token: string }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, mfaCode }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(userData: any) {
    const res = await request<{ success: boolean; user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: any }>('/api/auth/me');
  },

  logout() {
    setStoredToken(null);
  },

  async verifyEmail(code: string, email?: string) {
    return request<{ success: boolean; message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code, email }),
    });
  },

  async forgotPassword(email: string) {
    return request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async updateProfile(updates: any) {
    return request<{ success: boolean; user: any }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Events
  async getEvents(params?: Record<string, string | boolean | undefined>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    const qStr = query.toString();
    return request<{ events: any[] }>(`/api/events${qStr ? '?' + qStr : ''}`);
  },

  async getEventBySlug(slug: string) {
    return request<{ event: any }>(`/api/events/${encodeURIComponent(slug)}`);
  },

  async createEvent(eventData: any) {
    return request<{ success: boolean; event: any }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async updateEvent(id: string, updates: any) {
    return request<{ success: boolean; event: any }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateEventStatus(id: string, status: string, feedback?: string) {
    return request<{ success: boolean; event: any }>(`/api/events/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, feedback }),
    });
  },

  // Registrations & Tickets
  async registerForEvent(eventId: string) {
    return request<{ success: boolean; registration: any }>(`/api/events/${eventId}/register`, {
      method: 'POST',
    });
  },

  async unregisterForEvent(eventId: string) {
    return request<{ success: boolean; message: string }>(`/api/events/${eventId}/unregister`, {
      method: 'POST',
    });
  },

  async getMyRegistrations() {
    return request<{ registrations: any[] }>('/api/registrations/my');
  },

  async getEventAttendees(eventId: string) {
    return request<{ attendees: any[] }>(`/api/registrations/event/${eventId}`);
  },

  async scanQr(code: string) {
    return request<{ success: boolean; attendee: any }>('/api/registrations/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: any[] }>('/api/notifications');
  },

  async markNotificationRead(id?: string, all?: boolean) {
    return request<{ success: boolean }>('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id, all }),
    });
  },

  async getNotificationPreferences() {
    return request<{ preferences: any }>('/api/notifications/preferences');
  },

  async updateNotificationPreferences(prefs: any) {
    return request<{ success: boolean; preferences: any }>('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  },

  async unsubscribe(token: string) {
    return request<{ success: boolean; email?: string; message: string }>('/api/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Organiser Applications
  async submitOrganizerApplication(data: { organizationName: string; reason: string; faculty?: string; department?: string }) {
    return request<{ success: boolean; application: any }>('/api/organizers/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOrganizerApplications() {
    return request<{ applications: any[] }>('/api/organizers/applications');
  },

  async reviewOrganizerApplication(id: string, status: 'APPROVED' | 'REJECTED', feedback?: string) {
    return request<{ success: boolean; message: string }>(`/api/organizers/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, feedback }),
    });
  },

  // Support Tickets
  async submitSupportTicket(data: { name: string; email: string; subject: string; message: string }) {
    return request<{ success: boolean; referenceCode: string; message: string }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSupportTickets() {
    return request<{ tickets: any[] }>('/api/support/tickets');
  },

  async updateSupportTicket(id: string, status: string, adminNotes?: string) {
    return request<{ success: boolean }>(`/api/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Feedback
  async submitFeedback(eventId: string, rating: number, comment?: string) {
    return request<{ success: boolean; message: string }>(`/api/events/${eventId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  async getEventFeedback(eventId: string) {
    return request<{ feedbacks: any[] }>(`/api/events/${eventId}/feedback`);
  },

  // Admin Controls
  async getAdminUsers() {
    return request<{ users: any[] }>('/api/admin/users');
  },

  async updateUserRole(userId: string, role: string) {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async getAdminOutbox() {
    return request<{ outbox: any[] }>('/api/admin/outbox');
  },

  async sendMail(payload: { to: string; recipientName?: string; subject: string; html: string; text?: string; category?: string }) {
    return request<{ success: boolean; messageId: string; provider: string }>('/api/mail/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async broadcastMail(payload: { targetAudience: string; subject: string; html: string; text?: string; eventId?: string; customEmails?: string }) {
    return request<{ success: boolean; total: number; sent: number; failed: number }>('/api/mail/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAuditLogs() {
    return request<{ logs: any[] }>('/api/admin/audit-logs');
  },

  async getParticipationReport() {
    return request<{ report: any }>('/api/admin/participation-reports');
  },

  // Categories & Venues
  async getCategories() {
    return request<{ categories: any[] }>('/api/categories');
  },

  async createCategory(data: any) {
    return request<{ success: boolean; category: any }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVenues() {
    return request<{ venues: any[] }>('/api/venues');
  },
};
