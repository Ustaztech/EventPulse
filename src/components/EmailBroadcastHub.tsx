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
  Copy, 
  Check, 
  Eye, 
  RefreshCw, 
  Layers, 
  Key, 
  ShieldCheck, 
  Zap, 
  X,
  ChevronRight,
  Sliders,
  Calendar,
  Ticket,
  Lock
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { emailService, EmailProviderConfig, DispatchLogItem } from '../lib/emailService';
import { canManageMailingSettings } from '../lib/rbac';

interface EmailBroadcastHubProps {
  initialTab?: 'compose' | 'automated' | 'logs' | 'settings';
}

export const EmailBroadcastHub: React.FC<EmailBroadcastHubProps> = ({
  initialTab = 'compose'
}) => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'automated' | 'logs' | 'settings'>(initialTab);

  // Email Config State
  const [config, setConfig] = useState<EmailProviderConfig>(() => emailService.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Compose State
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'ORGANIZERS' | 'ADMINS' | 'EVENT_ATTENDEES' | 'CUSTOM'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('New Campus Update: Stay Informed with EventPulse');
  const [headline, setHeadline] = useState('Important Campus Announcement');
  const [messageBody, setMessageBody] = useState(
    'We are excited to share new upcoming campus events and academic workshops. Explore confirmed schedules, directions, and secure your digital entry passes on EventPulse.'
  );
  const [buttonText, setButtonText] = useState('View Details on EventPulse');
  const [buttonUrl, setButtonUrl] = useState('http://localhost:5173/');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Logs & Notification State
  const [logs, setLogs] = useState<DispatchLogItem[]>(() => emailService.getLogs());
  const [logFilter, setLogFilter] = useState<'ALL' | 'welcome' | 'new_event' | 'approaching' | 'happening_now' | 'custom'>('ALL');
  const [selectedLog, setSelectedLog] = useState<DispatchLogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const users = db.getUsers();
  const events = db.getEvents();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const refreshLogs = () => {
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
      return users.filter(u => u.role === 'STUDENT').map(u => ({ email: u.email, name: u.name }));
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
    emailService.saveConfig(config);
    setConfigSaved(true);
    showToast('Mailing platform settings saved successfully!');
    setTimeout(() => setConfigSaved(false), 2500);
  };

  // Test Resend / MailerLite connection by sending a real email to the user
  const handleTestConnection = async () => {
    if (!currentUser?.email) return;
    setIsTestingConnection(true);

    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1E40AF, #0D9488); padding: 28px 24px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800;">EventPulse Mailer Test</h2>
          <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.9;">Provider: ${config.provider.toUpperCase()} Verification Ping</p>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p>Hello <strong>${currentUser.name}</strong>,</p>
          <p>Your mailing platform integration with <strong>${config.provider.toUpperCase()}</strong> is connected and sending transactional emails to real user mailboxes.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 18px 0; color: #166534; font-size: 13px;">
            <strong>Status: Verified & Operational</strong><br />
            Sender: ${config.senderName} &lt;${config.senderEmail}&gt;<br />
            Timestamp: ${new Date().toLocaleString()}
          </div>
          <p style="font-size: 12px; color: #64748b;">Dispatched automatically by EventPulse Campaign Hub.</p>
        </div>
      </div>
    `;

    const res = await emailService.sendEmail({
      to: currentUser.email,
      recipientName: currentUser.name,
      subject: `[Verified] EventPulse ${config.provider.toUpperCase()} Connection Test`,
      html: testHtml,
      category: 'custom'
    });

    setIsTestingConnection(false);
    refreshLogs();

    if (res.success) {
      showToast(`Success! Test email delivered to ${currentUser.email} via ${res.providerUsed}`);
    } else {
      showToast(`Error: ${res.error || 'Failed to dispatch test email'}`);
    }
  };

  // Dispatch Broadcast Email
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRecipients.length === 0) {
      showToast('Please specify at least one recipient email address.');
      return;
    }
    if (!subject.trim() || !messageBody.trim()) {
      showToast('Please provide both subject line and announcement message.');
      return;
    }

    setIsSending(true);

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1E40AF, #0D9488); padding: 32px 24px; color: #ffffff;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            EventPulse Campus Bulletin
          </span>
          <h1 style="margin: 12px 0 0; font-size: 24px; font-weight: 800; line-height: 1.3;">${headline}</h1>
        </div>
        <div style="padding: 28px 24px; color: #334155; line-height: 1.6;">
          <div style="font-size: 15px; color: #1e293b; white-space: pre-line;">
            ${messageBody}
          </div>
          ${buttonText ? `
            <div style="margin: 28px 0; text-align: center;">
              <a href="${buttonUrl}" style="display: inline-block; background: #1E40AF; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(30,64,175,0.25);">
                ${buttonText}
              </a>
            </div>
          ` : ''}
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            Sent by EventPulse &bull; <a href="mailto:support@eventpulse.com.ng" style="color: #1E40AF; text-decoration: none;">support@eventpulse.com.ng</a><br />
            To manage notifications, visit your EventPulse profile settings.
          </div>
        </div>
      </div>
    `;

    const res = await emailService.sendBatchEmail({
      recipients: resolvedRecipients,
      subject: subject.trim(),
      html: emailHtml,
      text: `${headline}\n\n${messageBody}\n\n${buttonUrl}`,
      category: 'custom'
    });

    setIsSending(false);
    refreshLogs();
    refreshUserData();

    showToast(`Email campaign dispatched to ${res.sent} recipient(s) via ${config.provider.toUpperCase()}!`);
  };

  // Preset Template Selectors
  const applyPreset = (type: 'welcome' | 'new_event' | 'reminder' | 'happening_now' | 'announcement') => {
    if (type === 'welcome') {
      setSubject('Welcome to EventPulse: Campus Event Discovery & Smart Notification Engine');
      setHeadline('Welcome to EventPulse!');
      setMessageBody('Welcome to the official campus event platform! Your account has been activated. You will receive automated alerts for newly scheduled events, approaching departure reminders (24h & 1h), and live kickoff alerts.');
      setButtonText('Explore Campus Events');
      setButtonUrl('http://localhost:5173/explore');
    } else if (type === 'new_event') {
      const evt = events[0];
      setSubject(`New Campus Event Added: ${evt?.title || 'Annual Technology Showcase'}`);
      setHeadline(`New Event Added: ${evt?.title || 'Annual Technology Showcase'}`);
      setMessageBody(`A new campus event has just been scheduled and registration is now open.\n\nDate: ${new Date(evt?.startTime || Date.now()).toLocaleString()}\nVenue: ${evt?.venueName || 'Campus Main Hall'} (${evt?.campusArea || 'Main Campus'})\n\nReserve your seat and claim your verified digital pass now!`);
      setButtonText('Reserve Digital Pass');
      setButtonUrl(`http://localhost:5173/events/${evt?.slug || ''}`);
    } else if (type === 'reminder') {
      const evt = events[0];
      setSubject(`Starting in 1 Hour: ${evt?.title || 'Campus Hackathon'} - Doors Opening Soon!`);
      setHeadline(`Countdown: Starting in 1 Hour!`);
      setMessageBody(`This is an automated reminder that "${evt?.title || 'Campus Hackathon'}" commences in 1 hour at ${evt?.venueName || 'Campus Main Hall'}.\n\nPlease have your digital ticket QR code ready on your mobile device for entrance check-in.`);
      setButtonText('Open Digital Pass');
      setButtonUrl('http://localhost:5173/dashboard/student');
    } else if (type === 'happening_now') {
      const evt = events[0];
      setSubject(`Happening Now: ${evt?.title || 'Robotics & AI Symposium'} is Officially Underway!`);
      setHeadline(`Happening Now: Live Kickoff!`);
      setMessageBody(`The doors are open and "${evt?.title || 'Robotics & AI Symposium'}" is officially live right now!\n\nProceed to ${evt?.venueName || 'Campus Main Hall'} entrance desk to validate your attendance.`);
      setButtonText('View Venue Directions');
      setButtonUrl('http://localhost:5173/explore');
    } else if (type === 'announcement') {
      setSubject('Campus Announcement: Event Schedule Updates');
      setHeadline('Important Notice to All Campus Members');
      setMessageBody('Please take note of upcoming adjustments to campus event schedules and venue arrangements for the upcoming academic week.');
      setButtonText('Read Full Notice');
      setButtonUrl('http://localhost:5173/');
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-royal to-teal flex items-center justify-center text-white shadow-md shadow-royal/20">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Email Campaign & Transactional Dispatcher
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                config.resendApiKey && config.provider === 'resend'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : config.mailerliteApiKey && config.provider === 'mailerlite'
                  ? 'bg-blue-100 text-royal border-blue-300 dark:bg-royal/30 dark:text-turquoise'
                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.resendApiKey || config.mailerliteApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {config.provider.toUpperCase()} {config.resendApiKey || config.mailerliteApiKey ? 'CONNECTED' : 'SANDBOX'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send automated and bulk emails to platform users via Resend or MailerLite to their actual email inboxes.
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
            <span>{isTestingConnection ? 'Sending Test...' : 'Test Real Delivery'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'bg-royal text-white shadow-md'
                : 'bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Provider Setup</span>
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
              ? 'border-royal text-royal dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Compose & Broadcast</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automated')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'automated'
              ? 'border-royal text-royal dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Automated Lifecycle Rules</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('logs');
            refreshLogs();
          }}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'border-royal text-royal dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dispatch & Delivery Logs ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'border-royal text-royal dark:text-turquoise font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>MailerLite / Resend Setup</span>
        </button>
      </div>

      {/* Main Body Content based on active tab */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

        {/* TAB 1: COMPOSE & BROADCAST */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (Left 7 Cols) */}
            <form onSubmit={handleSendBroadcast} className="lg:col-span-7 space-y-5">
              {/* Presets Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Template Presets:</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => applyPreset('welcome')}
                    className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 hover:opacity-90"
                  >
                    📬 Welcome Message
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('new_event')}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-royal/30 text-royal dark:text-turquoise font-bold border border-blue-200 dark:border-royal/50 hover:opacity-90"
                  >
                    📢 New Event Added
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('reminder')}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 hover:opacity-90"
                  >
                    ⏰ 1h Countdown Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('happening_now')}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 hover:opacity-90"
                  >
                    🟢 Happening Now Alert
                  </button>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Target Audience
                  </label>
                  <span className="text-xs font-bold text-royal dark:text-turquoise">
                    {resolvedRecipients.length} Recipient(s) Targeted
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('ALL')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'ALL'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">All Platform Users</span>
                    <span className="text-[10px] text-slate-400">{users.length} accounts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('STUDENTS')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'STUDENTS'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">Students Only</span>
                    <span className="text-[10px] text-slate-400">{users.filter(u => u.role === 'STUDENT').length} accounts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('ORGANIZERS')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'ORGANIZERS'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">Organizers</span>
                    <span className="text-[10px] text-slate-400">{users.filter(u => u.role === 'ORGANIZER').length} accounts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('ADMINS')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'ADMINS'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">Administrators</span>
                    <span className="text-[10px] text-slate-400">{users.filter(u => u.role === 'ADMIN').length} accounts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('EVENT_ATTENDEES')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'EVENT_ATTENDEES'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">Event Attendees</span>
                    <span className="text-[10px] text-slate-400">By Specific Event</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('CUSTOM')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetAudience === 'CUSTOM'
                        ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="block font-bold">Custom Email(s)</span>
                    <span className="text-[10px] text-slate-400">Specific addresses</span>
                  </button>
                </div>

                {/* Sub-selectors */}
                {targetAudience === 'EVENT_ATTENDEES' && (
                  <div className="pt-2">
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs font-medium"
                      required
                    >
                      <option value="">Select event to email attendees...</option>
                      {events.map(e => (
                        <option key={e.id} value={e.id}>{e.title} ({e.registeredCount || 0} registered)</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetAudience === 'CUSTOM' && (
                  <div className="pt-2">
                    <textarea
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      placeholder="Enter emails separated by comma or new line: e.g. student@gmail.com, organizer@eventpulse.com.ng"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs font-mono"
                      rows={2}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Subject Line */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Email Subject Line (Appears in User's Main Inbox)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Starting in 1 Hour: Campus Robotics Workshop"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Email Header Banner Title
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Important Campus Notice"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Announcement Message Content
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message to platform users..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  rows={5}
                  required
                />
              </div>

              {/* Call to Action Button Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Action Button Label</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. View Details on EventPulse"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Action Link URL</label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Send Button */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Sender: <strong className="text-slate-800 dark:text-slate-200">{config.senderName}</strong> &lt;{config.senderEmail}&gt;
                </div>

                <button
                  type="submit"
                  disabled={isSending || resolvedRecipients.length === 0}
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-black text-xs shadow-lg shadow-royal/25 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching via {config.provider.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <span>Dispatch to {resolvedRecipients.length} User(s)</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Email Preview Column (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-royal" />
                  <span>Recipient Inbox Preview</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Exact HTML rendered in recipient mail
                </span>
              </div>

              {/* Rendered Email Simulator */}
              <div className="rounded-2xl border border-slate-300 dark:border-navy-light/60 overflow-hidden shadow-lg bg-slate-100 dark:bg-navy-dark p-3">
                {/* Email Client Header Chrome */}
                <div className="bg-white dark:bg-[#111A33] rounded-t-xl p-3 border-b border-slate-200 dark:border-navy-light/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>From: {config.senderName} &lt;{config.senderEmail}&gt;</span>
                    <span>Just now</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {subject || 'No subject'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    To: {resolvedRecipients[0]?.email || 'user@example.com'} {resolvedRecipients.length > 1 ? `(+${resolvedRecipients.length - 1} more)` : ''}
                  </div>
                </div>

                {/* Email Body Card */}
                <div className="bg-white text-slate-800 rounded-b-xl overflow-hidden shadow-xs border-t-0">
                  <div className="bg-gradient-to-r from-royal to-teal p-5 text-white">
                    <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                      EventPulse Campus Bulletin
                    </span>
                    <h3 className="text-base font-black mt-2">{headline}</h3>
                  </div>

                  <div className="p-5 space-y-4 text-xs leading-relaxed text-slate-700">
                    <p className="whitespace-pre-line text-xs font-normal">
                      {messageBody}
                    </p>

                    {buttonText && (
                      <div className="text-center pt-2">
                        <span className="inline-block px-5 py-2.5 rounded-xl bg-royal text-white font-bold text-xs shadow-md">
                          {buttonText}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                      Sent automatically by EventPulse &bull; support@eventpulse.com.ng<br />
                      You received this notification because your account is registered on EventPulse.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATED LIFECYCLE RULES */}
        {activeTab === 'automated' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-royal/20 border border-blue-200 dark:border-royal/40 flex items-start gap-3">
              <Zap className="w-5 h-5 text-royal dark:text-turquoise shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-royal dark:text-turquoise text-sm">
                  Automatic Lifecycle Dispatch Engine
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  These 4 automatic triggers run silently in the platform background and send direct transactional emails to users' main email addresses via your configured provider ({config.provider.toUpperCase()}).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rule 1: Welcome Message */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Welcome Email</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Trigger: On User Registration</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ENABLED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Automatically dispatches an onboarding email when any student, organizer, or staff member registers a new account on EventPulse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) return;
                    db.sendWelcomeEmail(currentUser);
                    refreshLogs();
                    showToast(`Test Welcome email dispatched to ${currentUser.email}!`);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-navy-light/60 hover:border-teal text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-teal" />
                  <span>Send Test Welcome to My Email</span>
                </button>
              </div>

              {/* Rule 2: New Event Added */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise flex items-center justify-center font-bold">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. New Event Added</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Trigger: On Event Published</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ENABLED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Broadcasts a transactional announcement to campus members as soon as a new event is approved or published by organizers/administrators.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const evt = events[0];
                    if (evt) {
                      db.broadcastNewEventPublished(evt);
                      refreshLogs();
                      showToast(`Test New Event announcement dispatched for "${evt.title}"!`);
                    } else {
                      showToast('Please create at least one event first.');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-navy-light/60 hover:border-royal text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-royal" />
                  <span>Send Test New Event Broadcast</span>
                </button>
              </div>

              {/* Rule 3: About to Happen (24h & 1h) */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. About to Happen (24h / 1h)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Trigger: Countdown Scheduler</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ENABLED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Automated background ticker scans approaching event start times and sends reminders with verified ticket codes to confirmed attendees.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const evt = events[0];
                    if (evt) {
                      db.broadcastEventAboutToHappen(evt.id, 'REMINDER_1H');
                      refreshLogs();
                      showToast(`Test 1-Hour Reminder dispatched for "${evt.title}"!`);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-navy-light/60 hover:border-amber-500 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-amber-500" />
                  <span>Send Test 1-Hour Reminder</span>
                </button>
              </div>

              {/* Rule 4: Happening Now */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Happening Now Alert</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Trigger: Live Kickoff Notice</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ENABLED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Dispatched automatically when an event starts live to alert attendees that doors are open and validation desks are active.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const evt = events[0];
                    if (evt) {
                      db.broadcastEventHappeningNow(evt.id);
                      refreshLogs();
                      showToast(`Test Happening Now alert dispatched for "${evt.title}"!`);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-navy border border-slate-200 dark:border-navy-light/60 hover:border-emerald-500 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Send Test Happening Now Alert</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISPATCH & DELIVERY LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['ALL', 'welcome', 'new_event', 'approaching', 'happening_now', 'custom'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setLogFilter(f)}
                    className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                      logFilter === f
                        ? 'bg-royal text-white'
                        : 'bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'ALL' ? 'All Deliveries' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshLogs}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-light/40"
                  title="Refresh logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    emailService.clearLogs();
                    refreshLogs();
                    showToast('Delivery logs cleared');
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-navy-light/60 rounded-2xl overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-xs">No email dispatches recorded yet.</p>
                  <p className="text-[11px]">Send an email campaign or test an automated trigger to see real delivery logs here.</p>
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
                        <th className="p-3 text-right">Payload</th>
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
                            <span className="text-royal dark:text-turquoise font-bold">{item.provider}</span>
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

        {/* TAB 4: MAILERLITE / RESEND SETUP */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border border-slate-200 dark:border-navy-light/60 rounded-3xl p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-[#0B132B]/60">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-royal" />
                  <span>Configure Resend / MailerLite Provider</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connect your real API key to dispatch transactional emails to platform users via Resend or MailerLite.
                </p>
              </div>

              {!canManageMailingSettings(currentUser) ? (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Administrator Managed Configuration</span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                    Global mailing provider tokens and API credentials are restricted to Platform Administrators.
                    Your broadcasts and automated event notices are routed automatically through the active verified provider.
                  </p>
                  <div className="p-3.5 bg-white dark:bg-[#0B132B] rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Provider:</span>
                      <strong className="text-royal dark:text-turquoise">{config.provider.toUpperCase()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sender Identity:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{config.senderName} &lt;{config.senderEmail}&gt;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Connection Status:</span>
                      <span className="text-emerald-600 font-bold">Verified & Active</span>
                    </div>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                {/* Provider Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Select Mailing Platform</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, provider: 'resend' }))}
                      className={`p-3.5 rounded-2xl border text-left font-bold transition-all ${
                        config.provider === 'resend'
                          ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise ring-2 ring-royal/20'
                          : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">Resend (Recommended)</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">resend.com &bull; 3,000 free emails/mo</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, provider: 'mailerlite' }))}
                      className={`p-3.5 rounded-2xl border text-left font-bold transition-all ${
                        config.provider === 'mailerlite'
                          ? 'border-royal bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise ring-2 ring-royal/20'
                          : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">MailerLite</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">mailerlite.com &bull; campaign tokens</div>
                    </button>
                  </div>
                </div>

                {/* Resend API Key Input */}
                {config.provider === 'resend' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-200">Resend API Key</label>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-royal dark:text-turquoise font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Get Free Key (resend.com)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={config.resendApiKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, resendApiKey: e.target.value }))}
                        placeholder="re_123456789..."
                        className="w-full p-3 pr-20 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-royal/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Your key is securely stored in local browser environment for direct client API dispatches.
                    </p>
                  </div>
                )}

                {/* MailerLite API Key Input */}
                {config.provider === 'mailerlite' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-200">MailerLite API Token</label>
                      <a
                        href="https://mailerlite.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-royal dark:text-turquoise font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Get MailerLite Token</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.mailerliteApiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, mailerliteApiKey: e.target.value }))}
                      placeholder="MailerLite API Token..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-royal/30"
                    />
                  </div>
                )}

                {/* Sender Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-200">Sender Display Name</label>
                    <input
                      type="text"
                      value={config.senderName}
                      onChange={(e) => setConfig(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="e.g. EventPulse Notifications"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-200">Sender From Email</label>
                    <input
                      type="text"
                      value={config.senderEmail}
                      onChange={(e) => setConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="e.g. onboarding@resend.dev or support@eventpulse.com.ng"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Tip for Resend testing:</strong> Use <code className="font-bold">onboarding@resend.dev</code> to send test emails right away to your verified Resend account email address without needing DNS domain verification.
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-xs shadow-md hover:bg-royal-hover transition-all"
                  >
                    Save Platform Configuration
                  </button>
                </div>
              </form>
              )}
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
                  <span className="font-bold text-royal dark:text-turquoise">{selectedLog.provider}</span>
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
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Rendered HTML Payload:</span>
                <div 
                  className="p-4 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white max-h-60 overflow-y-auto text-slate-800"
                  dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailBroadcastHub;
