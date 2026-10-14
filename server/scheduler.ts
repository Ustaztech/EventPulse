import { serverDb } from './db';
import { sendTransactionalEmail } from './mailer';

export class EventPulseScheduler {
  private isProcessing = false;

  /**
   * Run one lifecycle scan and outbox flush.
   */
  public async tick(): Promise<{
    reminders24h: number;
    reminders1h: number;
    remindersNow: number;
    emailsProcessed: number;
  }> {
    if (this.isProcessing) {
      return { reminders24h: 0, reminders1h: 0, remindersNow: 0, emailsProcessed: 0 };
    }
    this.isProcessing = true;

    let reminders24h = 0;
    let reminders1h = 0;
    let remindersNow = 0;
    let emailsProcessed = 0;

    try {
      // 1. Scan approaching events
      const publishedEvents = serverDb.getEvents({ status: 'PUBLISHED' });
      const nowMs = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      for (const event of publishedEvents) {
        const startMs = new Date(event.start_time).getTime();
        const endMs = new Date(event.end_time).getTime();
        const diffMs = startMs - nowMs;

        // A. 24-Hour Reminder Window
        if (diffMs > oneHourMs && diffMs <= twentyFourHoursMs) {
          const regs = serverDb.getRegistrationsByEventId(event.id).filter(r => r.status === 'CONFIRMED');
          for (const reg of regs) {
            const idemp = `remind-24h-${event.id}-${reg.user_id}`;
            const prefs = serverDb.getNotificationPreferences(reg.user_id);

            // In-app
            serverDb.createInAppNotification({
              userId: reg.user_id,
              title: `Starting Tomorrow: ${event.title}`,
              message: `Reminder: "${event.title}" takes place tomorrow at ${new Date(event.start_time).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' })} WAT. Venue: ${event.venue_name || 'Main Campus Hall'}.`,
              type: 'REMINDER_24H',
              eventId: event.id,
            });

            // Outbox
            if (prefs.reminder_24h) {
              serverDb.enqueueOutboxJob({
                recipientEmail: reg.user_email!,
                recipientName: reg.user_name!,
                subject: `Tomorrow: ${event.title} (24h Reminder)`,
                bodyHtml: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #1E40AF; margin-top: 0;">Event Reminder: 24 Hours to Go</h2>
                    <p>Dear <strong>${reg.user_name}</strong>,</p>
                    <p>This is a reminder that <strong>${event.title}</strong> is scheduled for tomorrow.</p>
                    <div style="background: #f8fafc; border-left: 4px solid #1E40AF; padding: 12px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(event.start_time).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</p>
                      <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.venue_name || 'Campus Main Hall'} (${event.campus_area || 'Main Campus'})</p>
                      ${event.landmark ? `<p style="margin: 4px 0;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
                      <p style="margin: 4px 0;"><strong>Ticket Reference:</strong> ${reg.reference_code}</p>
                    </div>
                    <p style="font-size: 12px; color: #64748b;">EventPulse NSUK Campus Hub</p>
                  </div>
                `,
                bodyText: `Reminder: ${event.title} starts tomorrow! Time: ${new Date(event.start_time).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT. Venue: ${event.venue_name}. Ticket: ${reg.reference_code}`,
                notificationType: 'REMINDER_24H',
                eventId: event.id,
                userId: reg.user_id,
                idempotencyKey: idemp,
              });
              reminders24h++;
            }
          }
        }

        // B. 1-Hour Reminder Window
        if (diffMs > 0 && diffMs <= oneHourMs) {
          const regs = serverDb.getRegistrationsByEventId(event.id).filter(r => r.status === 'CONFIRMED');
          for (const reg of regs) {
            const idemp = `remind-1h-${event.id}-${reg.user_id}`;
            const prefs = serverDb.getNotificationPreferences(reg.user_id);

            serverDb.createInAppNotification({
              userId: reg.user_id,
              title: `Starting in 1 Hour: ${event.title}`,
              message: `Doors open soon! "${event.title}" commences in 1 hour at ${event.venue_name || 'Main Campus Hall'}. Reference: ${reg.reference_code}.`,
              type: 'REMINDER_1H',
              eventId: event.id,
            });

            if (prefs.reminder_1h) {
              serverDb.enqueueOutboxJob({
                recipientEmail: reg.user_email!,
                recipientName: reg.user_name!,
                subject: `Starting in 1 Hour: ${event.title}`,
                bodyHtml: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #D97706; margin-top: 0;">Final Countdown: Starting in 1 Hour!</h2>
                    <p>Dear <strong>${reg.user_name}</strong>,</p>
                    <p>Doors are opening soon for <strong>${event.title}</strong>.</p>
                    <div style="background: #fffbeb; border-left: 4px solid #D97706; padding: 12px; margin: 16px 0;">
                      <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.venue_name || 'Campus Main Hall'} (${event.campus_area || 'Main Campus'})</p>
                      ${event.landmark ? `<p style="margin: 4px 0;"><strong>Landmark:</strong> ${event.landmark}</p>` : ''}
                      ${event.arrival_instructions ? `<p style="margin: 4px 0;"><strong>Arrival Instructions:</strong> ${event.arrival_instructions}</p>` : ''}
                      <p style="margin: 4px 0;"><strong>Ticket Reference:</strong> ${reg.reference_code}</p>
                    </div>
                    <p style="font-size: 12px; color: #64748b;">EventPulse NSUK Campus Hub</p>
                  </div>
                `,
                bodyText: `Starting in 1 Hour: ${event.title}! Venue: ${event.venue_name}. Ticket: ${reg.reference_code}`,
                notificationType: 'REMINDER_1H',
                eventId: event.id,
                userId: reg.user_id,
                idempotencyKey: idemp,
              });
              reminders1h++;
            }
          }
        }

        // C. Happening Now Window
        if (nowMs >= startMs && (nowMs <= endMs || (nowMs - startMs < 2 * oneHourMs))) {
          const regs = serverDb.getRegistrationsByEventId(event.id).filter(r => r.status === 'CONFIRMED');
          for (const reg of regs) {
            const idemp = `now-${event.id}-${reg.user_id}`;
            const prefs = serverDb.getNotificationPreferences(reg.user_id);

            serverDb.createInAppNotification({
              userId: reg.user_id,
              title: `Happening Now: ${event.title}`,
              message: `Live kickoff! "${event.title}" is underway right now at ${event.venue_name || 'Main Campus Hall'}.`,
              type: 'STARTING_NOW',
              eventId: event.id,
            });

            if (prefs.event_starting_now) {
              serverDb.enqueueOutboxJob({
                recipientEmail: reg.user_email!,
                recipientName: reg.user_name!,
                subject: `Happening Now: ${event.title}`,
                bodyHtml: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #059669; margin-top: 0;">Live Now: Doors Open!</h2>
                    <p>Dear <strong>${reg.user_name}</strong>,</p>
                    <p>The session for <strong>${event.title}</strong> has officially commenced.</p>
                    <p><strong>Venue:</strong> ${event.venue_name || 'Campus Main Hall'}</p>
                    <p><strong>Ticket Reference:</strong> ${reg.reference_code}</p>
                  </div>
                `,
                bodyText: `Happening Now: ${event.title} is underway now at ${event.venue_name}!`,
                notificationType: 'STARTING_NOW',
                eventId: event.id,
                userId: reg.user_id,
                idempotencyKey: idemp,
              });
              remindersNow++;
            }
          }
        }
      }

      // 2. Process Queued Outbox Jobs
      const queuedJobs = serverDb.getOutboxJobs(50).filter(j => j.status === 'QUEUED' || (j.status === 'FAILED' && j.attempt_count < j.max_attempts));
      
      for (const job of queuedJobs) {
        // Check if user has opted out of optional announcements
        if (job.user_id && job.notification_type === 'ANNOUNCEMENT') {
          const prefs = serverDb.getNotificationPreferences(job.user_id);
          if (!prefs.email_announcements) {
            serverDb.updateOutboxStatus(job.id, 'SUPPRESSED', undefined, undefined, 'User opted out of optional announcements');
            emailsProcessed++;
            continue;
          }
        }

        serverDb.updateOutboxStatus(job.id, 'PROCESSING');

        const result = await sendTransactionalEmail({
          to: job.recipient_email,
          recipientName: job.recipient_name,
          subject: job.subject,
          bodyHtml: job.body_html,
          bodyText: job.body_text,
          category: job.notification_type === 'ANNOUNCEMENT' ? 'new_event' : 'ticket',
        });

        if (result.success) {
          serverDb.updateOutboxStatus(job.id, result.status, result.provider, result.providerMessageId);
        } else {
          serverDb.updateOutboxStatus(job.id, 'FAILED', result.provider, undefined, result.error);
        }
        emailsProcessed++;
      }
    } catch (err: any) {
      console.error('[EventPulse Scheduler] Tick error:', err);
    } finally {
      this.isProcessing = false;
    }

    return { reminders24h, reminders1h, remindersNow, emailsProcessed };
  }

  /**
   * Start recurring daemon interval in Node runtime.
   */
  public startBackgroundWorker(intervalMs: number = 30000): NodeJS.Timeout {
    console.log(`[EventPulse Scheduler] Background reminder worker active (polling every ${intervalMs / 1000}s)`);
    // Run initial tick immediately
    this.tick().catch(() => {});
    return setInterval(() => {
      this.tick().catch(() => {});
    }, intervalMs);
  }
}

export const scheduler = new EventPulseScheduler();
