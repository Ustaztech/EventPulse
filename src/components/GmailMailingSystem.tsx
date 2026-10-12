import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Archive, 
  Mail, 
  MailOpen, 
  RefreshCw, 
  Search, 
  Plus, 
  CheckSquare, 
  Square, 
  ArrowLeft, 
  Paperclip, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  Minimize2, 
  Maximize2, 
  Tag, 
  Ticket, 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical,
  Reply,
  Forward,
  Printer,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { InAppNotification, EmailOutboxJob, DeliveryStatus } from '../lib/types';

export interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  category: 'tickets' | 'announcements' | 'updates' | 'general';
  status?: DeliveryStatus | 'SENT' | string;
  ticketRef?: string;
  eventId?: string;
}

interface GmailMailingSystemProps {
  initialFolder?: 'inbox' | 'sent' | 'outbox' | 'starred';
}

export const GmailMailingSystem: React.FC<GmailMailingSystemProps> = ({
  initialFolder = 'inbox'
}) => {
  const { currentUser, refreshUserData } = useAuth();
  
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'sent' | 'outbox' | 'trash'>(initialFolder);
  const [categoryTab, setCategoryTab] = useState<'all' | 'tickets' | 'announcements' | 'updates'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set(['mail-demo-1']));
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [trashedIds, setTrashedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compose State
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [composeTo, setComposeTo] = useState('support@eventpulse.com.ng');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeCategory, setComposeCategory] = useState<'tickets' | 'announcements' | 'updates' | 'general'>('general');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Local sent storage
  const [sentMails, setSentMails] = useState<EmailItem[]>([]);

  if (!currentUser) return null;

  // Build unified mailbox from DB
  const rawNotifications = db.getInAppNotifications(currentUser.id);
  const rawOutbox = db.getOutboxJobs();
  const rawRegistrations = db.getUserRegistrations(currentUser.id);

  // Convert notifications and registrations into authentic email representations
  const inboxEmails: EmailItem[] = useMemo(() => {
    const list: EmailItem[] = [];

    // Registration confirmation emails
    rawRegistrations.forEach((reg) => {
      const id = `ticket-email-${reg.id}`;
      const eventTitle = reg.event?.title || 'Campus Event';
      list.push({
        id,
        senderName: 'EventPulse Ticket Dispatch',
        senderEmail: 'support@eventpulse.com.ng',
        recipientEmail: reg.userEmail || currentUser.email,
        subject: `Confirmed: Digital Pass for ${eventTitle} (${reg.referenceCode})`,
        preview: `Your official pass is confirmed. Reference: ${reg.referenceCode}. Venue: ${reg.event?.venueName || 'Main Campus'}.`,
        body: `
          <p>Dear <strong>${reg.userName}</strong>,</p>
          <p>Your seat reservation for <strong>${eventTitle}</strong> is successfully confirmed.</p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
            <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Ticket Reference:</p>
            <p style="margin: 0 0 12px; font-size: 20px; font-weight: 900; color: #1E40AF; letter-spacing: 1px;">${reg.referenceCode}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Date & Time:</strong> ${new Date(reg.event?.startTime || reg.registeredAt).toLocaleString()}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Venue:</strong> ${reg.event?.venueName || 'Campus Main Hall'} (${reg.event?.campusArea || 'Main Campus'})</p>
            ${reg.event?.landmark ? `<p style="margin: 4px 0; font-size: 12px; color: #64748b;"><strong>Landmark:</strong> ${reg.event.landmark}</p>` : ''}
          </div>
          <p>Please present this digital pass or your QR code inside the EventPulse dashboard at entrance validation.</p>
        `,
        date: reg.registeredAt,
        isRead: readIds.has(id),
        isStarred: starredIds.has(id),
        category: 'tickets',
        status: 'DELIVERED',
        ticketRef: reg.referenceCode,
        eventId: reg.eventId
      });
    });

    // In-app notifications converted into system broadcast emails
    rawNotifications.forEach((n) => {
      const id = `notif-email-${n.id}`;
      let cat: 'tickets' | 'announcements' | 'updates' | 'general' = 'general';
      if (n.type === 'REGISTRATION_CONFIRMATION') cat = 'tickets';
      else if (n.type === 'ANNOUNCEMENT') cat = 'announcements';
      else if (n.type === 'EVENT_UPDATE' || n.type === 'EVENT_CANCELLED') cat = 'updates';

      list.push({
        id,
        senderName: 'EventPulse Notification Engine',
        senderEmail: 'support@eventpulse.com.ng',
        recipientEmail: currentUser.email,
        subject: n.title,
        preview: n.message,
        body: `
          <p>Dear <strong>${currentUser.name}</strong>,</p>
          <p>${n.message}</p>
          <div style="background: #f1f5f9; border-left: 4px solid #0D9488; padding: 14px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Notice Category:</strong> ${n.type.replace(/_/g, ' ')}</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">Timestamp: ${new Date(n.createdAt).toLocaleString()}</p>
          </div>
          <p>For more details, visit your EventPulse dashboard.</p>
        `,
        date: n.createdAt,
        isRead: n.isRead || readIds.has(id),
        isStarred: starredIds.has(id),
        category: cat,
        status: 'DELIVERED',
        eventId: n.eventId
      });
    });

    // Welcome email if inbox is sparse
    list.push({
      id: 'welcome-eventpulse-mail',
      senderName: 'EventPulse Welcome Team',
      senderEmail: 'support@eventpulse.com.ng',
      recipientEmail: currentUser.email,
      subject: 'Welcome to EventPulse: Campus Event Discovery & Smart Notification Engine',
      preview: 'Stay Connected. Never Miss an Event. Discover upcoming campus events, reserve verified passes...',
      body: `
        <p>Dear <strong>${currentUser.name}</strong>,</p>
        <p>Welcome to <strong>EventPulse</strong> — the intelligent campus event discovery and notification platform.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px; color: #1E40AF; font-size: 14px;">Platform Capabilities:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
            <li><strong>Digital Tickets:</strong> Instant pass reservation with scannable entry codes.</li>
            <li><strong>Campus Mail:</strong> Automated reminders 24h & 1h prior to event commencement.</li>
            <li><strong>GPS Maps:</strong> Verified venue landmarks and geographical directions.</li>
          </ul>
        </div>
        <p>If you have questions or feedback, reply directly to this message or write to <strong>support@eventpulse.com.ng</strong>.</p>
      `,
      date: currentUser.createdAt || new Date().toISOString(),
      isRead: readIds.has('welcome-eventpulse-mail'),
      isStarred: starredIds.has('welcome-eventpulse-mail'),
      category: 'announcements',
      status: 'DELIVERED'
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawRegistrations, rawNotifications, currentUser, readIds, starredIds]);

  // Outbox representation
  const outboxEmails: EmailItem[] = useMemo(() => {
    return rawOutbox.map((job) => ({
      id: `outbox-${job.id}`,
      senderName: 'EventPulse Outbox Worker',
      senderEmail: 'support@eventpulse.com.ng',
      recipientEmail: job.recipientEmail,
      subject: job.subject,
      preview: job.bodyText.slice(0, 100),
      body: job.bodyHtml || job.bodyText,
      date: job.scheduledFor,
      isRead: true,
      isStarred: starredIds.has(`outbox-${job.id}`),
      category: 'general',
      status: job.status
    }));
  }, [rawOutbox, starredIds]);

  // Determine current email list based on active folder
  const currentList = useMemo(() => {
    let list: EmailItem[] = [];
    if (activeFolder === 'inbox') {
      list = inboxEmails.filter((m) => !trashedIds.has(m.id));
    } else if (activeFolder === 'starred') {
      list = [...inboxEmails, ...sentMails].filter((m) => starredIds.has(m.id) && !trashedIds.has(m.id));
    } else if (activeFolder === 'sent') {
      list = sentMails.filter((m) => !trashedIds.has(m.id));
    } else if (activeFolder === 'outbox') {
      list = outboxEmails;
    } else if (activeFolder === 'trash') {
      list = [...inboxEmails, ...sentMails].filter((m) => trashedIds.has(m.id));
    }

    // Apply category filter if in Inbox
    if (activeFolder === 'inbox' && categoryTab !== 'all') {
      list = list.filter((m) => m.category === categoryTab);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) =>
        m.subject.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q) ||
        m.recipientEmail.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeFolder, categoryTab, searchQuery, inboxEmails, sentMails, outboxEmails, starredIds, trashedIds]);

  const unreadInboxCount = inboxEmails.filter((m) => !m.isRead && !trashedIds.has(m.id)).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshUserData();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Mailbox updated.');
    }, 400);
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map((m) => m.id)));
    }
  };

  const handleMarkSelectedRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
    showToast('Marked as read');
  };

  const handleDeleteSelected = () => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
    if (selectedEmail && selectedIds.has(selectedEmail.id)) {
      setSelectedEmail(null);
    }
    showToast('Moved to trash');
  };

  const handleOpenEmail = (email: EmailItem) => {
    setSelectedEmail(email);
    setReadIds((prev) => new Set(prev).add(email.id));
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;

    setIsSending(true);

    setTimeout(() => {
      const newSentMail: EmailItem = {
        id: `sent-mail-${Date.now()}`,
        senderName: `${currentUser.name} (${currentUser.role})`,
        senderEmail: currentUser.email,
        recipientEmail: composeTo.trim(),
        subject: composeSubject.trim(),
        preview: composeBody.trim().slice(0, 100),
        body: `
          <p>${composeBody.replace(/\n/g, '<br/>')}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="font-size: 11px; color: #64748b;">
            Sent via EventPulse Campus Mail &bull; support@eventpulse.com.ng<br />
            Sender: ${currentUser.name} (${currentUser.email})
          </p>
        `,
        date: new Date().toISOString(),
        isRead: true,
        isStarred: false,
        category: composeCategory,
        status: 'DELIVERED'
      };

      // Add to sent storage
      setSentMails((prev) => [newSentMail, ...prev]);

      // Enqueue Outbox job for audit and durable simulation
      db.enqueueOutboxJob({
        recipientEmail: composeTo.trim(),
        recipientName: composeTo.split('@')[0],
        subject: composeSubject.trim(),
        bodyHtml: newSentMail.body,
        bodyText: composeBody.trim(),
        notificationType: 'ANNOUNCEMENT',
        userId: currentUser.id,
        idempotencyKey: `user-mail-${Date.now()}`
      });

      // Clear & Close
      setIsSending(false);
      setComposeOpen(false);
      setComposeSubject('');
      setComposeBody('');
      showToast(`Message sent to ${composeTo.trim()}`);
    }, 450);
  };

  return (
    <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/90 dark:border-navy-light/40 shadow-xl overflow-hidden min-h-[620px] flex flex-col relative transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gmail Top Search & Action Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-navy-light/40 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0B132B]/60">
        
        {/* Left: Brand Icon + Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-xl">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-royal to-teal flex items-center justify-center text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-slate-800 dark:text-white hidden sm:inline">
              Campus Mail
            </span>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mail, tickets, or broadcast alerts..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#111A33] text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium transition-all"
            />
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className={`p-2 rounded-xl text-slate-500 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-light/30 transition-colors ${
              isRefreshing ? 'animate-spin text-royal' : ''
            }`}
            title="Refresh mailbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setComposeOpen(true);
              setComposeTo('support@eventpulse.com.ng');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-royal to-teal text-white text-xs font-bold hover:opacity-95 shadow-md shadow-royal/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Gmail Dual-Column Layout (Sidebar + List/Reading Pane) */}
      <div className="flex flex-1 min-h-[520px]">
        
        {/* Left Gmail Navigation Folders Column */}
        <div className="w-48 sm:w-56 border-r border-slate-200/80 dark:border-navy-light/40 p-3 space-y-4 shrink-0 bg-slate-50/40 dark:bg-[#0B132B]/30 hidden md:block">
          
          <nav className="space-y-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveFolder('inbox');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeFolder === 'inbox'
                  ? 'bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
              </div>
              {unreadInboxCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-royal text-white text-[10px] font-black">
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFolder('starred');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeFolder === 'starred'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Starred</span>
              </div>
              {starredIds.size > 0 && (
                <span className="text-[10px] text-slate-400">{starredIds.size}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFolder('sent');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeFolder === 'sent'
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </div>
              <span className="text-[10px] text-slate-400">{sentMails.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFolder('outbox');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeFolder === 'outbox'
                  ? 'bg-blue-50 dark:bg-royal/20 text-royal dark:text-turquoise font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Outbox Queue</span>
              </div>
              <span className="text-[10px] text-slate-400">{outboxEmails.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFolder('trash');
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeFolder === 'trash'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </div>
              {trashedIds.size > 0 && (
                <span className="text-[10px] text-slate-400">{trashedIds.size}</span>
              )}
            </button>
          </nav>

          {/* Mail Quota Information */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-navy-light/30 space-y-1.5 px-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Mail Storage</span>
              <span>0.4 MB of 15 GB</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-navy-light/60 rounded-full overflow-hidden">
              <div className="h-full bg-teal w-[3%]" />
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              Durable EventPulse Outbox Engine Active
            </p>
          </div>
        </div>

        {/* Right Main Content Area: List View OR Reader View */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111A33]">
          
          {selectedEmail ? (
            /* ======================================================== */
            /* Authentic Gmail Reading Pane View                         */
            /* ======================================================== */
            <div className="flex-1 flex flex-col">
              {/* Reader Top Action Bar */}
              <div className="p-3 border-b border-slate-100 dark:border-navy-light/40 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#0B132B]/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-light/40 transition-colors"
                    title="Back to list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {activeFolder}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(e, selectedEmail.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-navy-light/40 transition-colors"
                    title="Star message"
                  >
                    <Star className={`w-4 h-4 ${starredIds.has(selectedEmail.id) ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTrashedIds((prev) => new Set(prev).add(selectedEmail.id));
                      setSelectedEmail(null);
                      showToast('Email moved to trash');
                    }}
                    className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reader Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[540px]">
                {/* Subject Header */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise">
                      {selectedEmail.category}
                    </span>
                    {selectedEmail.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {selectedEmail.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedEmail.subject}
                  </h2>
                </div>

                {/* Sender & Security Header */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200/80 dark:border-navy-light/40">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-navy to-royal text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {selectedEmail.senderName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {selectedEmail.senderName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          &lt;{selectedEmail.senderEmail}&gt;
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        to <span className="text-slate-600 dark:text-slate-300 font-medium">{selectedEmail.recipientEmail}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Mailed by eventpulse.com.ng &bull; TLS 256-bit Encrypted</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {new Date(selectedEmail.date).toLocaleString()}
                  </span>
                </div>

                {/* Rendered Email Message Content */}
                <div 
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />

                {/* Official Email Signature */}
                <div className="pt-6 border-t border-slate-200/60 dark:border-navy-light/40 space-y-1 text-xs text-slate-500">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    EventPulse Campus Notification Engine
                  </p>
                  <p className="text-[11px] text-slate-400">
                    "Stay Connected. Never Miss an Event." &bull; Email: support@eventpulse.com.ng
                  </p>
                </div>

                {/* Bottom Reply Bar */}
                <div className="pt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeOpen(true);
                      setComposeTo(selectedEmail.senderEmail);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposeOpen(true);
                      setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                      setComposeBody(`\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.senderName}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.preview}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* Gmail List View (Inbox / Sent / Starred / Outbox)        */
            /* ======================================================== */
            <div className="flex-1 flex flex-col">
              
              {/* List Toolbar */}
              <div className="p-2 sm:p-3 border-b border-slate-100 dark:border-navy-light/40 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#0B132B]/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-navy-light/30 text-slate-500"
                    title="Select all"
                  >
                    {selectedIds.size > 0 && selectedIds.size === currentList.length ? (
                      <CheckSquare className="w-4 h-4 text-royal dark:text-turquoise" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleMarkSelectedRead}
                        className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-navy-light/30 text-slate-600 dark:text-slate-300"
                        title="Mark as read"
                      >
                        <MailOpen className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                        title="Delete selected"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Pills (When viewing Inbox) */}
                {activeFolder === 'inbox' && (
                  <div className="flex items-center gap-1 overflow-x-auto text-xs">
                    {(['all', 'tickets', 'announcements', 'updates'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCategoryTab(tab)}
                        className={`px-3 py-1 rounded-full font-bold transition-all capitalize text-[11px] ${
                          categoryTab === tab
                            ? 'bg-royal text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-light/30'
                        }`}
                      >
                        {tab === 'all' ? 'All Mail' : tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Email List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-light/30">
                {currentList.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No messages found in {activeFolder}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      All campus event notifications, admission ticket deliveries, and announcements will appear here.
                    </p>
                  </div>
                ) : (
                  currentList.map((email) => {
                    const isSelected = selectedIds.has(email.id);
                    const isStarred = starredIds.has(email.id);

                    return (
                      <div
                        key={email.id}
                        onClick={() => handleOpenEmail(email)}
                        className={`flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors group text-xs ${
                          !email.isRead 
                            ? 'bg-blue-50/40 dark:bg-royal/10 font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-navy-light/20 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => handleSelectOne(e, email.id)}
                          className="shrink-0 text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-royal dark:text-turquoise" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {/* Star Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, email.id)}
                          className="shrink-0 text-slate-300 hover:text-amber-400"
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>

                        {/* Sender */}
                        <div className="w-36 sm:w-44 truncate shrink-0">
                          <span className={`text-slate-900 dark:text-white ${!email.isRead ? 'font-black' : 'font-medium'}`}>
                            {email.senderName}
                          </span>
                        </div>

                        {/* Subject + Snippet Preview */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className={`truncate ${!email.isRead ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {email.subject}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-normal truncate hidden sm:inline">
                            &bull; {email.preview}
                          </span>
                        </div>

                        {/* Category Badge */}
                        <div className="shrink-0 hidden md:block">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300 capitalize">
                            {email.category}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="shrink-0 font-mono text-[11px] text-slate-400 text-right">
                          {new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* Gmail-Style Floating / Dockable Compose Modal             */}
      {/* ======================================================== */}
      {composeOpen && (
        <div 
          className={`fixed z-50 transition-all duration-200 shadow-2xl rounded-t-3xl border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#111A33] overflow-hidden ${
            composeMaximized
              ? 'inset-4 sm:inset-10'
              : 'bottom-0 right-4 sm:right-8 w-full max-w-lg h-[500px]'
          }`}
        >
          {/* Compose Window Header Bar */}
          <div className="bg-slate-900 text-white dark:bg-[#0B132B] px-4 py-2.5 flex items-center justify-between">
            <span className="font-bold text-xs flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-turquoise" />
              <span>New Campus Event Message</span>
            </span>

            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                type="button"
                onClick={() => setComposeMaximized(!composeMaximized)}
                className="p-1 hover:text-white rounded"
              >
                {composeMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="p-1 hover:text-rose-400 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compose Form */}
          <form onSubmit={handleSendCompose} className="p-4 flex flex-col h-[calc(100%-42px)] justify-between space-y-3">
            <div className="space-y-2">
              {/* Recipient */}
              <div className="flex items-center border-b border-slate-200 dark:border-navy-light/40 py-1.5 text-xs">
                <span className="text-slate-400 w-12 font-bold shrink-0">To:</span>
                <input
                  type="text"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="e.g. support@eventpulse.com.ng or attendee email"
                  className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none font-medium"
                  required
                />
              </div>

              {/* Subject */}
              <div className="flex items-center border-b border-slate-200 dark:border-navy-light/40 py-1.5 text-xs">
                <span className="text-slate-400 w-12 font-bold shrink-0">Subject:</span>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject of event notice or announcement..."
                  className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none font-bold"
                  required
                />
              </div>

              {/* Category Picker */}
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="text-slate-400 font-bold">Category:</span>
                {(['general', 'announcements', 'updates', 'tickets'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setComposeCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-full capitalize font-semibold transition-all ${
                      composeCategory === cat
                        ? 'bg-royal text-white'
                        : 'bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Body */}
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Compose your campus event notice, query, or broadcast message..."
                className="w-full h-48 sm:h-56 p-2 bg-transparent text-slate-800 dark:text-white focus:outline-none text-xs sm:text-sm font-medium resize-none"
                required
              />
            </div>

            {/* Bottom Bar: Send Button & Controls */}
            <div className="pt-2 border-t border-slate-200 dark:border-navy-light/40 flex items-center justify-between">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-xs shadow-md shadow-royal/20 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Discard draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default GmailMailingSystem;
