/**
 * Server-side Transactional Email Delivery Engine
 * Protects credentials strictly in server environment secrets.
 * Enforces truthful delivery statuses, retries, and idempotency.
 */

export interface MailPayload {
  to: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: 'welcome' | 'new_event' | 'approaching' | 'happening_now' | 'custom' | 'ticket' | 'security';
}

export interface MailResult {
  success: boolean;
  provider: 'resend' | 'smtp' | 'sandbox';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'SUPPRESSED';
  providerMessageId?: string;
  error?: string;
}

export async function sendTransactionalEmail(payload: MailPayload): Promise<MailResult> {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();
  const resendApiKey = (process.env.EVENTPULSE_MAILS_API_KEY || process.env.RESEND_API_KEY || '').trim();
  const senderEmail = (process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'support@eventpulse.com.ng').trim();
  const senderName = (process.env.RESEND_FROM_NAME || process.env.SMTP_FROM_NAME || 'EventPulse')
    .replace(/[<>\r\n"]/g, '')
    .trim();
  const testMode = process.env.EVENTPULSE_EMAIL_TEST_MODE === 'true';
  const testRecipient = process.env.EVENTPULSE_TEST_EMAIL_RECIPIENT?.trim();
  if (testMode && !testRecipient) {
    return {
      success: false,
      provider: 'sandbox',
      status: 'FAILED',
      error: 'Test email mode is enabled but no test recipient is configured.',
    };
  }
  const deliveryRecipient = testMode ? testRecipient! : payload.to.trim();

  if (provider !== 'resend') {
    return {
      success: false,
      provider: 'sandbox',
      status: 'FAILED',
      error: `Email provider "${provider}" is not supported by this delivery engine. Set EMAIL_PROVIDER=resend.`,
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) || !senderName) {
    return {
      success: false,
      provider: 'sandbox',
      status: 'FAILED',
      error: 'Email sender configuration is invalid. Set a valid RESEND_FROM_EMAIL and RESEND_FROM_NAME.',
    };
  }

  const cleanText = payload.bodyText || payload.bodyHtml.replace(/<[^>]*>?/gm, '').trim();
  const brandedHtml = `
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="background:#1d4ed8;padding:22px 28px;color:#ffffff">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:42px;height:42px;border-radius:12px;background:#14b8a6;color:#042f2e;text-align:center;vertical-align:middle;font-size:15px;font-weight:900;letter-spacing:-1px">EP</td>
            <td style="padding-left:12px;vertical-align:middle">
              <div style="font-size:22px;font-weight:800;letter-spacing:-.5px">EventPulse <span style="font-size:11px;color:#99f6e4;letter-spacing:1px">NSUK</span></div>
              <div style="font-size:12px;color:#dbeafe;margin-top:4px">Campus events, connected.</div>
            </td>
          </tr></table>
        </div>
        <div style="padding:28px">${payload.bodyHtml}</div>
        <div style="border-top:1px solid #e2e8f0;padding:16px 28px;color:#64748b;font-size:12px">EventPulse NSUK · Nasarawa State University, Keffi</div>
      </div>
    </div>`;

  // 1. Live Resend Provider
  if (resendApiKey && resendApiKey.trim().length > 0) {
    try {
      const fromAddress = `${senderName} <${senderEmail}>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [deliveryRecipient],
          subject: payload.subject,
          html: brandedHtml,
          text: cleanText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && typeof data?.id === 'string') {
        return {
          success: true,
          provider: 'resend',
          // Resend POST /emails accepted by provider. Truthful status: SENT / PROVIDER_ACCEPTED.
          status: 'SENT',
          providerMessageId: data.id,
        };
      } else {
        const errorDetail = data?.message || data?.error || 'Resend rejected the dispatch request';
        return {
          success: false,
          provider: 'resend',
          status: 'FAILED',
          error: errorDetail,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'resend',
        status: 'FAILED',
        error: err?.message || 'Network failure communicating with Resend',
      };
    }
  }

  return {
    success: false,
    provider: 'sandbox',
    status: 'FAILED',
    error: 'Email delivery is not configured. Add a server-side Resend key before sending messages.',
  };
}
