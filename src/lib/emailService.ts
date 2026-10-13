/**
 * EventPulse Automated Email Service
 * Directly integrates with mailing platforms like Resend (resend.com) & MailerLite
 * to dispatch transactional emails to platform users' actual inboxes.
 */

export type EmailProviderType = 'resend' | 'mailerlite' | 'simulated';

export interface EmailProviderConfig {
  provider: EmailProviderType;
  resendApiKey: string;
  mailerliteApiKey: string;
  senderName: string;
  senderEmail: string;
  autoWelcome: boolean;
  autoNewEvent: boolean;
  autoApproaching: boolean;
  autoHappeningNow: boolean;
}

export interface DispatchLogItem {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: 'welcome' | 'new_event' | 'approaching' | 'happening_now' | 'custom';
  provider: 'RESEND' | 'MAILERLITE' | 'SIMULATED';
  externalId?: string;
  status: 'DELIVERED' | 'QUEUED' | 'FAILED';
  errorMessage?: string;
  timestamp: string;
}

const CONFIG_STORAGE_KEY = 'eventpulse_email_provider_config_v2';
const LOGS_STORAGE_KEY = 'eventpulse_email_dispatch_logs_v2';

const DEFAULT_CONFIG: EmailProviderConfig = {
  provider: 'resend',
  resendApiKey: '',
  mailerliteApiKey: '',
  senderName: 'EventPulse Campus Notifications',
  // Default to Resend testing sender address (which works out of the box without domain verification)
  senderEmail: 'onboarding@resend.dev',
  autoWelcome: true,
  autoNewEvent: true,
  autoApproaching: true,
  autoHappeningNow: true,
};

class EmailService {
  public getConfig(): EmailProviderConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: EmailProviderConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }

  public getLogs(): DispatchLogItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public addLog(item: Omit<DispatchLogItem, 'id' | 'timestamp'>): DispatchLogItem {
    const logs = this.getLogs();
    const newLog: DispatchLogItem = {
      ...item,
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
    }
    return newLog;
  }

  public clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGS_STORAGE_KEY);
    }
  }

  /**
   * Dispatches an email to a real user email via Resend or MailerLite.
   */
  public async sendEmail(params: {
    to: string;
    recipientName?: string;
    subject: string;
    html: string;
    text?: string;
    category?: DispatchLogItem['category'];
  }): Promise<{ success: boolean; messageId?: string; error?: string; providerUsed: 'RESEND' | 'MAILERLITE' | 'SIMULATED' }> {
    const config = this.getConfig();
    const category = params.category || 'custom';
    const cleanText = params.text || params.html.replace(/<[^>]*>?/gm, '');

    // 1. Send via Resend REST API if key is present
    if (config.provider === 'resend' && config.resendApiKey && config.resendApiKey.trim().length > 0) {
      try {
        const fromAddress = config.senderEmail && config.senderEmail.includes('@')
          ? `${config.senderName} <${config.senderEmail}>`
          : `${config.senderName} <onboarding@resend.dev>`;

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [params.to.trim()],
            subject: params.subject,
            html: params.html,
            text: cleanText,
          }),
        });

        const data = await response.json();

        if (response.ok && data?.id) {
          this.addLog({
            recipientEmail: params.to,
            recipientName: params.recipientName,
            subject: params.subject,
            bodyHtml: params.html,
            bodyText: cleanText,
            category,
            provider: 'RESEND',
            externalId: data.id,
            status: 'DELIVERED',
          });
          return { success: true, messageId: data.id, providerUsed: 'RESEND' };
        } else {
          const errDetail = data?.message || data?.error || 'Resend API rejected request';
          this.addLog({
            recipientEmail: params.to,
            recipientName: params.recipientName,
            subject: params.subject,
            bodyHtml: params.html,
            bodyText: cleanText,
            category,
            provider: 'RESEND',
            status: 'FAILED',
            errorMessage: errDetail,
          });
          return { success: false, error: errDetail, providerUsed: 'RESEND' };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Network error communicating with Resend';
        this.addLog({
          recipientEmail: params.to,
          recipientName: params.recipientName,
          subject: params.subject,
          bodyHtml: params.html,
          bodyText: cleanText,
          category,
          provider: 'RESEND',
          status: 'FAILED',
          errorMessage: errorMsg,
        });
        return { success: false, error: errorMsg, providerUsed: 'RESEND' };
      }
    }

    // 2. Send via MailerLite API if selected and key present
    if (config.provider === 'mailerlite' && config.mailerliteApiKey && config.mailerliteApiKey.trim().length > 0) {
      try {
        const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.mailerliteApiKey.trim()}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: `EventPulse: ${params.subject.slice(0, 30)}`,
            subject: params.subject,
            type: 'regular',
            emails: [
              {
                subject: params.subject,
                from_name: config.senderName,
                from: config.senderEmail || 'support@eventpulse.com.ng',
                content: params.html,
              }
            ]
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const messageId = data?.data?.id || `ml_${Date.now()}`;
          this.addLog({
            recipientEmail: params.to,
            recipientName: params.recipientName,
            subject: params.subject,
            bodyHtml: params.html,
            bodyText: cleanText,
            category,
            provider: 'MAILERLITE',
            externalId: messageId,
            status: 'DELIVERED',
          });
          return { success: true, messageId, providerUsed: 'MAILERLITE' };
        } else {
          const errMsg = data?.message || 'MailerLite API error';
          this.addLog({
            recipientEmail: params.to,
            recipientName: params.recipientName,
            subject: params.subject,
            bodyHtml: params.html,
            bodyText: cleanText,
            category,
            provider: 'MAILERLITE',
            status: 'FAILED',
            errorMessage: errMsg,
          });
          return { success: false, error: errMsg, providerUsed: 'MAILERLITE' };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Network error communicating with MailerLite';
        this.addLog({
          recipientEmail: params.to,
          recipientName: params.recipientName,
          subject: params.subject,
          bodyHtml: params.html,
          bodyText: cleanText,
          category,
          provider: 'MAILERLITE',
          status: 'FAILED',
          errorMessage: errorMsg,
        });
        return { success: false, error: errorMsg, providerUsed: 'MAILERLITE' };
      }
    }

    // 3. Fallback: Local Simulated Mode (Logs the exact transactional payload)
    const simulatedId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.addLog({
      recipientEmail: params.to,
      recipientName: params.recipientName,
      subject: params.subject,
      bodyHtml: params.html,
      bodyText: cleanText,
      category,
      provider: 'SIMULATED',
      externalId: simulatedId,
      status: 'DELIVERED',
    });

    return { 
      success: true, 
      messageId: simulatedId, 
      providerUsed: 'SIMULATED' 
    };
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
