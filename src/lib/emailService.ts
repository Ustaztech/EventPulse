/**
 * EventPulse browser email client. Mail is always sent through the authenticated server endpoint.
 */

export interface DispatchLogItem {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: 'welcome' | 'new_event' | 'approaching' | 'happening_now' | 'custom' | 'ticket' | 'reminder';
  provider: 'RESEND';
  externalId?: string;
  status: 'DELIVERED' | 'QUEUED' | 'FAILED';
  errorMessage?: string;
  timestamp: string;
}

class EmailService {
  constructor() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eventpulse_resend_email_config_v3');
      localStorage.removeItem('eventpulse_email_provider_config_v2');
      localStorage.removeItem('eventpulse_resend_dispatch_logs_v3');
    }
  }

  public getLogs(): DispatchLogItem[] {
    return [];
  }

  public addLog(item: Omit<DispatchLogItem, 'id' | 'timestamp'>): DispatchLogItem {
    return {
      ...item,
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
  }

  public clearLogs(): void {}

  /**
   * Sends mail only through the server. Provider credentials never enter the browser.
   */
  public async sendEmail(params: {
    to: string;
    recipientName?: string;
    subject: string;
    html: string;
    text?: string;
    category?: DispatchLogItem['category'];
  }): Promise<{ success: boolean; messageId?: string; error?: string; providerUsed: 'RESEND' }> {
    const category = params.category || 'custom';
    const cleanText = params.text || params.html.replace(/<[^>]*>?/gm, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('eventpulse_auth_token') : null;

    try {
      const resp = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: params.to.trim(),
          recipientName: params.recipientName,
          subject: params.subject,
          html: params.html,
          text: cleanText,
          category,
        }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok || !result?.success) {
        throw new Error(result?.error || `Email could not be sent (HTTP ${resp.status}).`);
      }

      this.addLog({
        recipientEmail: params.to,
        recipientName: params.recipientName,
        subject: params.subject,
        bodyHtml: params.html,
        bodyText: cleanText,
        category,
        provider: 'RESEND',
        externalId: result.messageId,
        status: 'QUEUED',
      });
      return { success: true, messageId: result.messageId, providerUsed: 'RESEND' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email service is unavailable.';
      this.addLog({
        recipientEmail: params.to,
        recipientName: params.recipientName,
        subject: params.subject,
        bodyHtml: params.html,
        bodyText: cleanText,
        category,
        provider: 'RESEND',
        status: 'FAILED',
        errorMessage: message,
      });
      return { success: false, error: message, providerUsed: 'RESEND' };
    }
  }

  /**
   * Dispatches automated notification when a new event is published
   */
  public async sendNewEventNotification(event: {
    id: string;
    title: string;
    categoryName?: string;
    venueName?: string;
    startTime: string;
    organizerName?: string;
    slug?: string;
  }, recipients: { email: string; name?: string }[]): Promise<number> {
    const eventUrl = `https://eventpulse.com.ng/events/${event.slug || event.id}`;
    const formattedDate = new Date(event.startTime).toLocaleString('en-NG', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let sent = 0;
    for (const r of recipients) {
      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
            <div style="background: #0B2E81; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">EventPulse</div>
            <span style="color: #64748b; font-size: 13px;">Campus Event Notification</span>
          </div>
          <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px;">New Event: ${event.title}</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            Hello ${r.name || 'there'}, a new campus event matching your interests has just been published on EventPulse.
          </p>
          <div style="background: #f8fafc; border-left: 4px solid #0B2E81; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Category:</strong> ${event.categoryName || 'Campus Event'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Date & Time:</strong> ${formattedDate} WAT</p>
            <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Venue:</strong> ${event.venueName || 'Main Campus'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Organiser:</strong> ${event.organizerName || 'Campus Society'}</p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${eventUrl}" style="display: inline-block; background: #0B2E81; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
              View Event & Reserve Seat &rarr;
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            EventPulse Campus Event Management &bull; Support: support@eventpulse.com.ng
          </p>
        </div>
      `;

      const res = await this.sendEmail({
        to: r.email,
        recipientName: r.name,
        subject: `New Event: ${event.title} on EventPulse`,
        html,
        category: 'new_event',
      });
      if (res.success) sent++;
    }
    return sent;
  }

  /**
   * Dispatches automated pass confirmation email upon user registration
   */
  public async sendRegistrationConfirmation(params: {
    to: string;
    recipientName: string;
    eventTitle: string;
    venueName: string;
    startTime: string;
    referenceCode: string;
  }): Promise<boolean> {
    const formattedDate = new Date(params.startTime).toLocaleString('en-NG', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background: #0B2E81; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block; margin-bottom: 16px;">
          EventPulse Pass Confirmed
        </div>
        <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px;">You're Confirmed!</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
          Dear <strong>${params.recipientName}</strong>, your seat for <strong>${params.eventTitle}</strong> is secured. Present your reference code or digital pass at check-in.
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px; display: block;">Entry Reference Code</span>
          <span style="font-family: monospace; font-size: 26px; font-weight: 900; color: #0B2E81; letter-spacing: 3px; display: block; margin-top: 6px;">${params.referenceCode}</span>
        </div>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #334155;">
          <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${formattedDate} WAT</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${params.venueName}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          Need assistance? Contact support@eventpulse.com.ng
        </p>
      </div>
    `;

    const res = await this.sendEmail({
      to: params.to,
      recipientName: params.recipientName,
      subject: `Pass Confirmed: ${params.eventTitle} (${params.referenceCode})`,
      html,
      category: 'ticket',
    });

    return res.success;
  }

  /**
   * Dispatches emails to multiple users in batch.
   */
  public async sendBatchEmail(params: {
    recipients: { email: string; name?: string }[];
    subject: string;
    html: string;
    text?: string;
    category?: DispatchLogItem['category'];
  }): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const r of params.recipients) {
      const res = await this.sendEmail({
        to: r.email,
        recipientName: r.name,
        subject: params.subject,
        html: params.html,
        text: params.text,
        category: params.category,
      });
      if (res.success) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return { total: params.recipients.length, sent, failed };
  }
}

export const emailService = new EmailService();
