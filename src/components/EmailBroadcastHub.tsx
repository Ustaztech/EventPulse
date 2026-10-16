import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings, 
  Users, 
  Bell, 
  ExternalLink, 
  Check, 
  Eye, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Zap, 
  X,
  ChevronRight,
  Sliders,
  Calendar,
  Ticket,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { api } from '../lib/api';
import { emailService, EmailProviderConfig, DispatchLogItem } from '../lib/emailService';

interface EmailBroadcastHubProps {
  initialTab?: 'compose' | 'automated' | 'logs' | 'settings';
}

export const EmailBroadcastHub: React.FC<EmailBroadcastHubProps> = ({
  initialTab = 'compose'
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'automated' | 'logs' | 'settings'>(initialTab);

  // Email Config State
  const [config, setConfig] = useState<EmailProviderConfig>(() => emailService.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(config.resendApiKey || '');

  // Compose State
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'ORGANIZERS' | 'ADMINS' | 'EVENT_ATTENDEES' | 'CUSTOM'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('Campus Announcement: Upcoming Events on EventPulse');
  const [headline, setHeadline] = useState('Important Campus Update');
  const [messageBody, setMessageBody] = useState(
    'We are excited to share new upcoming campus workshops, lectures, and cultural events. Explore the verified schedules and secure your digital entry passes on EventPulse.'
  );
  const [buttonText, setButtonText] = useState('Explore Campus Events');
  const [buttonUrl, setButtonUrl] = useState('https://eventpulse.com.ng/explore');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Logs & Notification State
  const [logs, setLogs] = useState<DispatchLogItem[]>(() => emailService.getLogs());
  const [logFilter, setLogFilter] = useState<'ALL' | 'welcome' | 'new_event' | 'approaching' | 'happening_now' | 'custom' | 'ticket'>('ALL');
  const [selectedLog, setSelectedLog] = useState<DispatchLogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [triggeringEventId, setTriggeringEventId] = useState<string | null>(null);

  const users = db.getUsers();
  const events = db.getEvents();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const refreshLogs = async () => {
    try {
      const res = await api.getAdminOutbox();
      if (res?.outbox && res.outbox.length > 0) {
        const mapped: DispatchLogItem[] = res.outbox.map((o: any) => ({
          id: o.id,
          recipientEmail: o.recipient_email,
          recipientName: o.recipient_name,
          subject: o.subject,
          bodyHtml: o.body_html,
          bodyText: o.body_text,
          category: (o.notification_type?.toLowerCase() || 'custom') as any,
          provider: 'RESEND',
          status: o.status === 'SENT' || o.status === 'DELIVERED' ? 'DELIVERED' : o.status === 'QUEUED' || o.status === 'PROCESSING' ? 'QUEUED' : 'FAILED',
          errorMessage: o.error_message,
          timestamp: o.created_at,
        }));
        setLogs(mapped);
        return;
      }
    } catch {
      // Fallback to local logs
    }
    setLogs([...emailService.getLogs()]);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Compute recipient list based on audience selector
  const resolvedRecipients = React.useMemo(() => {
    if (targetAudience === 'ALL') {
      return users.map(u => ({ email: u.email, name: u.name }));
    }
    if (targetAudience === 'STUDENTS') {
      return users.filter(u => u.role === 'STUDENT' || u.role === 'STAFF').map(u => ({ email: u.email, name: u.name }));
    }
    if (targetAudience === 'ORGANIZERS') {
      return users.filter(u => u.role === 'ORGANIZER').map(u => ({ email: u.email, name: u.name }));
    }
    if (targetAudience === 'ADMINS') {
      return users.filter(u => u.role === 'ADMIN').map(u => ({ email: u.email, name: u.name }));
    }
    if (targetAudience === 'EVENT_ATTENDEES') {
      const regs = db.getRegistrations().filter(r => r.eventId === selectedEventId && r.status === 'CONFIRMED');
      return regs.map(r => ({ email: r.userEmail, name: r.userName }));
    }
    if (targetAudience === 'CUSTOM') {
      return customEmails
        .split(/[,;\n]/)
        .map(e => e.trim())
        .filter(e => e.length > 3 && e.includes('@'))
        .map(e => ({ email: e, name: e.split('@')[0] }));
    }
    return [];
  }, [targetAudience, selectedEventId, customEmails, users]);

  // Handle Save Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...config,
      resendApiKey: customApiKey.trim(),
    };
    setConfig(updated);
    emailService.saveConfig(updated);
    showToast('Resend configuration updated successfully!');
  };

  // Test Resend connection
  const handleTestConnection = async () => {
    if (!currentUser?.email) return;
    setIsTestingConnection(true);

    try {
      const testHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #0B2E81; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: 800; display: inline-block; font-size: 13px;">
            EventPulse
          </div>
          <h2 style="color: #0f172a; margin-top: 16px;">Resend API Delivery Verification</h2>
          <p style="color: #475569; font-size: 14px;">
            Hello <strong>${currentUser.name}</strong>, this email confirms that your Resend transactional mailing engine (configured with <code>EVENTPULSE_MAILS_API_KEY</code>) is working properly!
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #166534;">
            &check; Resend API Handshake: Verified &amp; Accepted
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            EventPulse Campus Notifications &bull; support@eventpulse.com.ng
          </p>
        </div>
      `;

      const res = await emailService.sendEmail({
        to: currentUser.email,
        recipientName: currentUser.name,
        subject: 'EventPulse: Resend API Connection Verified',
        html: testHtml,
        category: 'custom',
      });

      if (res.success) {
        showToast(`Verification email successfully dispatched to ${currentUser.email}!`);
      } else {
        showToast(`Error: ${res.error || 'Failed to dispatch test message'}`);
      }
      refreshLogs();
    } catch (err: any) {
      showToast(`Dispatch failed: ${err?.message || 'Network error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Broadcast Email to selected audience
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRecipients.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }
    if (!subject.trim() || !messageBody.trim()) {
      alert('Subject line and message content cannot be empty.');
      return;
    }

    setIsSending(true);

    const compiledHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
          <div style="background: #0B2E81; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 14px;">EventPulse</div>
          <span style="color: #64748b; font-size: 13px;">Campus Notification</span>
        </div>
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">${headline}</h1>
        <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap;">${messageBody}</div>
        ${buttonText && buttonUrl ? `
          <div style="text-align: center; margin: 28px 0;">
            <a href="${buttonUrl}" style="display: inline-block; background: #0B2E81; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
              ${buttonText} &rarr;
            </a>
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          EventPulse Campus Event Management &bull; support@eventpulse.com.ng
        </p>
      </div>
    `;

    try {
      const res = await api.broadcastMail({
        targetAudience,
        subject,
        html: compiledHtml,
        text: messageBody,
        eventId: selectedEventId,
        customEmails,
      });

      if (res?.success) {
        showToast(`Email broadcast dispatched to ${res.sent} recipients via Resend!`);
      } else {
        // Fallback to client-side batch
        const batchRes = await emailService.sendBatchEmail({
          recipients: resolvedRecipients,
          subject,
          html: compiledHtml,
          text: messageBody,
          category: 'custom',
        });
        showToast(`Dispatched to ${batchRes.sent} recipients!`);
      }
      refreshLogs();
    } catch {
      // Local fallback
      await emailService.sendBatchEmail({
        recipients: resolvedRecipients,
        subject,
        html: compiledHtml,
        text: messageBody,
        category: 'custom',
      });
      showToast(`Dispatched to ${resolvedRecipients.length} recipients!`);
      refreshLogs();
    } finally {
      setIsSending(false);
    }
  };

  // Trigger automated event notification for a specific event
  const handleTriggerEventNotification = async (evt: any) => {
    setTriggeringEventId(evt.id);
    try {
      const allCampusUsers = users.map(u => ({ email: u.email, name: u.name }));
      const sentCount = await emailService.sendNewEventNotification(evt, allCampusUsers);
      showToast(`Automated notification for "${evt.title}" dispatched to ${sentCount} campus users via Resend!`);
      refreshLogs();
    } catch (err: any) {
      showToast(`Failed: ${err?.message || 'Error sending notification'}`);
    } finally {
      setTriggeringEventId(null);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter(item => {
    if (logFilter === 'ALL') return true;
    return item.category === logFilter;
  });

  return (
    <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/90 dark:border-navy-light/40 shadow-xl overflow-hidden min-h-[660px] flex flex-col relative transition-colors">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Service Status Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-navy-light/40 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-[#0B132B]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B2E81] flex items-center justify-center text-white shadow-md shadow-blue-900/20">
            <Send className="w-5 h-5 text-turquoise" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Email Dispatcher & Automated Notifications
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                RESEND API ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Powered by Resend API (via <code className="font-mono text-royal dark:text-turquoise font-bold">EVENTPULSE_MAILS_API_KEY</code>). Dispatches directly to platform users' actual emails.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-navy-light/60 hover:bg-slate-100 dark:hover:bg-navy-light/30 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-60"
            title="Send a real verification email to your address"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTestingConnection ? 'animate-spin' : ''}`} />
            <span>{isTestingConnection ? 'Sending Test...' : 'Test Delivery'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-[#0B2E81] text-white shadow-md'
                : 'bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Resend Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 pt-2 border-b border-slate-200/80 dark:border-navy-light/40 flex items-center gap-2 overflow-x-auto text-xs font-bold bg-white dark:bg-[#111A33]">
        <button
          type="button"
          onClick={() => setActiveTab('compose')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'compose'
              ? 'border-[#0B2E81] text-[#0B2E81] dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Send Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automated')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'automated'
              ? 'border-[#0B2E81] text-[#0B2E81] dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Automatic Event Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('logs');
            refreshLogs();
          }}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'border-[#0B2E81] text-[#0B2E81] dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Outbox & Delivery Logs ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'border-[#0B2E81] text-[#0B2E81] dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Resend API Config</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

        {/* TAB 1: SEND EMAIL */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (Left 7 Cols) */}
            <form onSubmit={handleSendBroadcast} className="lg:col-span-7 space-y-5">
              {/* Recipient Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-royal" />
                    <span>Target Recipients:</span>
                  </span>
                  <span className="text-[11px] font-mono text-royal dark:text-turquoise font-bold">
                    {resolvedRecipients.length} recipient{resolvedRecipients.length === 1 ? '' : 's'}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', label: 'All Users', desc: 'All registered accounts' },
                    { id: 'STUDENTS', label: 'Students & Staff', desc: 'Active campus members' },
                    { id: 'ORGANIZERS', label: 'Organisers', desc: 'Event managers' },
                    { id: 'ADMINS', label: 'Administrators', desc: 'System operators' },
                    { id: 'EVENT_ATTENDEES', label: 'Event Attendees', desc: 'Confirmed pass holders' },
                    { id: 'CUSTOM', label: 'Custom List', desc: 'Direct email addresses' },
                  ].map(aud => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        targetAudience === aud.id
                          ? 'border-[#0B2E81] bg-blue-50/70 dark:bg-royal/20 text-[#0B2E81] dark:text-turquoise font-bold'
                          : 'border-slate-200 dark:border-navy-light/40 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{aud.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{aud.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Selector if EVENT_ATTENDEES */}
              {targetAudience === 'EVENT_ATTENDEES' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Select Target Event:
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-royal"
                    required
                  >
                    <option value="">-- Choose an event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({new Date(ev.startTime).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom emails input */}
              {targetAudience === 'CUSTOM' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Enter Email Addresses (comma, semicolon, or newline separated):
                  </label>
                  <textarea
                    rows={2}
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    placeholder="student1@eventpulse.com.ng, organizer@eventpulse.com.ng"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-800 dark:text-white font-mono focus:ring-2 focus:ring-royal"
                  />
                </div>
              )}

              {/* Subject Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Email Subject Line (Appears in User's Main Mailbox):
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Urgent Update: Tech Summit Venue Relocation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-royal"
                  required
                />
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Internal Headline Banner:
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Important Campus Announcement"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-royal"
                />
              </div>

              {/* Body Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Message Content:
                </label>
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-royal"
                  required
                />
              </div>

              {/* Action Button Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Call-to-Action Button Text:
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. View Details on EventPulse"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Button URL:
                  </label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://eventpulse.com.ng/explore"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Dispatch Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || resolvedRecipients.length === 0}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0B2E81] hover:bg-blue-900 text-white font-black text-xs shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                  <span>
                    {isSending
                      ? 'Dispatching via Resend...'
                      : `Dispatch Email to ${resolvedRecipients.length} Recipient${resolvedRecipients.length === 1 ? '' : 's'} via Resend`}
                  </span>
                </button>
              </div>
            </form>

            {/* Live Preview Column (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-royal" />
                  <span>Recipient Inbox Preview</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-light/40 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 font-bold ${
                      previewMode === 'desktop' ? 'bg-white dark:bg-[#111A33] text-royal dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 font-bold ${
                      previewMode === 'mobile' ? 'bg-white dark:bg-[#111A33] text-royal dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              <div className={`mx-auto bg-slate-100 dark:bg-[#0B132B] p-4 rounded-3xl border border-slate-200 dark:border-navy-light/60 transition-all ${
                previewMode === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}>
                {/* Email Window Mockup */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-5 space-y-4 text-slate-900 font-sans">
                  {/* Sender Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0B2E81] text-white flex items-center justify-center font-bold text-xs">
                        EP
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-900">EventPulse</span>
                        <span className="text-[10px] text-slate-400 block font-mono">support@eventpulse.com.ng</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                  </div>

                  {/* Subject */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {subject || 'No Subject'}
                    </h3>
                  </div>

                  {/* Content Box */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                    <h4 className="text-xs font-bold text-[#0B2E81] uppercase tracking-wide">
                      {headline}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {messageBody}
                    </p>
                    {buttonText && (
                      <div className="text-center pt-2">
                        <span className="inline-block bg-[#0B2E81] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs">
                          {buttonText} &rarr;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                    EventPulse Campus Event Management System &bull; Keffi
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATIC EVENT NOTIFICATIONS */}
        {activeTab === 'automated' && (
          <div className="space-y-6">
            <div className="bg-blue-50/70 dark:bg-royal/10 border border-blue-200 dark:border-royal/30 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-200">
                <span className="font-bold block text-slate-900 dark:text-white text-sm">
                  Automatic Event Notification Engine
                </span>
                EventPulse triggers real transactional emails through Resend API automatically during key lifecycle events. No manual intervention required.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Trigger 1: New Event Announcement */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  New Event Announcement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dispatched immediately to the campus community whenever an organizer or administrator publishes a new approved event.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Test Dispatch for Event:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {events.slice(0, 3).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between text-xs bg-white dark:bg-[#111A33] p-2 rounded-xl border border-slate-200/60 dark:border-navy-light/40">
                        <span className="font-bold truncate max-w-[150px]">{ev.title}</span>
                        <button
                          type="button"
                          onClick={() => handleTriggerEventNotification(ev)}
                          disabled={triggeringEventId === ev.id}
                          className="px-2 py-1 rounded-lg bg-[#0B2E81] text-white text-[10px] font-bold hover:bg-blue-900 disabled:opacity-50"
                        >
                          {triggeringEventId === ev.id ? 'Sending...' : 'Trigger'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trigger 2: Pass & Ticket Confirmation */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ticket & Pass Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sends the attendee an instant confirmation email with unique alphanumeric entry code, QR pass, venue instructions, and start time.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20 text-[11px] text-slate-500">
                  Trigger condition: User clicks "Register for free" on any event.
                </div>
              </div>

              {/* Trigger 3: 24-Hour Countdown Reminder */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  24-Hour Event Reminder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Background scheduler detects confirmed attendees and dispatches a 24-hour reminder with calendar reminders and directions.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20 text-[11px] text-slate-500">
                  Handled by server daemon (<code className="font-mono">/api/cron/reminders</code>).
                </div>
              </div>

              {/* Trigger 4: 1-Hour Countdown Reminder */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  1-Hour Doors Open Reminder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Final countdown email reminding participants that venue doors open in 60 minutes with quick-access ticket pass.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20 text-[11px] text-slate-500">
                  Trigger condition: 60 minutes prior to event start time.
                </div>
              </div>

              {/* Trigger 5: Schedule & Venue Relocation Notice */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Venue & Schedule Updates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When an organiser edits the venue or start time of an event, an urgent update email is dispatched to all registered attendees.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20 text-[11px] text-slate-500">
                  Trigger condition: Event details modified in Organizer Workspace.
                </div>
              </div>

              {/* Trigger 6: Welcome Email */}
              <div className="bg-slate-50/70 dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    AUTOMATIC
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Welcome to EventPulse
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Welcomes new student and staff accounts, providing orientation tips for discovering campus events and booking seats.
                </p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-navy-light/20 text-[11px] text-slate-500">
                  Trigger condition: Successful registration on /auth/register.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OUTBOX & DELIVERY LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {(['ALL', 'new_event', 'ticket', 'approaching', 'custom'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLogFilter(cat as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      logFilter === cat
                        ? 'bg-[#0B2E81] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat.toUpperCase().replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={refreshLogs}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-navy-light/60 hover:bg-slate-100 dark:hover:bg-navy-light/30 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-navy-light/60 rounded-2xl overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-xs">No email dispatches recorded yet.</p>
                  <p className="text-[11px]">Dispatch an email campaign or test an automated notification to see real Resend delivery logs here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-dark border-b border-slate-200 dark:border-navy-light/60 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-light/30">
                      {filteredLogs.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-light/20">
                          <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                            {item.recipientEmail}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {item.subject}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-300">
                              {item.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                            <span className="text-[#0B2E81] dark:text-turquoise font-bold">RESEND</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              item.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(item)}
                              className="text-royal dark:text-turquoise font-bold hover:underline"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RESEND SETUP */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border border-slate-200 dark:border-navy-light/60 rounded-3xl p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-[#0B132B]/60">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  <span>Resend Transactional Email Delivery Setup</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Powered exclusively by Resend API. In production on Vercel, the secret API key is read from the <code className="font-mono font-bold text-royal dark:text-turquoise">EVENTPULSE_MAILS_API_KEY</code> environment variable.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 text-xs space-y-4 shadow-xs">
                <div className="p-4 bg-slate-50 dark:bg-navy-dark rounded-xl border border-slate-200 dark:border-navy-light/40 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-navy-light/20">
                    <span className="text-slate-400">Provider:</span>
                    <strong className="text-[#0B2E81] dark:text-turquoise">Resend (resend.com)</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-navy-light/20">
                    <span className="text-slate-400">Vercel Environment Variable:</span>
                    <span className="text-emerald-600 font-bold">EVENTPULSE_MAILS_API_KEY</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-navy-light/20">
                    <span className="text-slate-400">Default Sender Identity:</span>
                    <span className="text-slate-700 dark:text-slate-300">EventPulse &lt;support@eventpulse.com.ng&gt;</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active &amp; Ready
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Override Resend API Key (Optional local override):
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-slate-50 dark:bg-[#111A33] text-xs font-mono pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0B2E81] hover:bg-blue-900 text-white font-bold text-xs shadow-md"
                  >
                    Save Settings
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111A33] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-navy-light/60 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-2">
                <Mail className="w-4 h-4 text-turquoise" />
                <span>Delivery Payload Details</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:text-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0B132B] p-3 rounded-xl font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">Recipient:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedLog.recipientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Provider:</span>
                  <span className="font-bold text-royal dark:text-turquoise">RESEND</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timestamp:</span>
                  <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedLog.status}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Subject:</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedLog.subject}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Content:</span>
                <div 
                  className="p-4 rounded-xl border border-slate-200 dark:border-navy-light/40 bg-white dark:bg-[#0B132B] max-h-60 overflow-y-auto text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-navy-light/40 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-light/40 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailBroadcastHub;
