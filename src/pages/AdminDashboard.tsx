import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Eye, 
  Activity, 
  Settings,
  Send,
  Sparkles,
  Search,
  X,
  MessageSquare,
  BarChart3,
  Layers,
  Check,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { api } from '../lib/api';
import { Role, SupportTicket } from '../lib/types';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { EmailBroadcastHub } from '../components/EmailBroadcastHub';
import { OutboxInspectorModal } from '../components/OutboxInspectorModal';

export const AdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'approvals' | 'users' | 'tickets' | 'reports' | 'categories' | 'outbox' | 'logs'>('applications');
  const [outboxModalOpen, setOutboxModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Participation Reports State
  const [report, setReport] = useState<any>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<any[]>(() => db.getCategories());
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#1E40AF');

  const loadAdminData = async () => {
    try {
      const [repRes, tickRes, catRes] = await Promise.all([
        api.getParticipationReport().catch(() => ({ report: null })),
        api.getSupportTickets().catch(() => ({ tickets: [] })),
        api.getCategories().catch(() => ({ categories: [] })),
      ]);

      if (repRes?.report) setReport(repRes.report);
      if (tickRes?.tickets) setTickets(tickRes.tickets);
      if (catRes?.categories?.length) setCategories(catRes.categories);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Administrator Access Required</h2>
        <p className="text-slate-500 text-sm">You must be logged into an authenticated administrator account to access this console.</p>
        <Link to="/auth/admin-login" className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm inline-block shadow-md">
          Authenticate as Administrator
        </Link>
      </div>
    );
  }

  const applications = db.getApplications();
  const pendingApps = applications.filter(a => a.status === 'PENDING');

  const events = db.getEvents();
  const pendingEvents = events.filter(e => e.status === 'PENDING_APPROVAL');

  const users = db.getUsers();
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const outboxJobs = db.getOutboxJobs();
  const logs = db.getLogs();

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter !== 'ALL' && t.status !== ticketFilter) return false;
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      return (
        t.referenceCode.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApproveApplication = async (appId: string) => {
    await db.reviewApplication(appId, 'APPROVED', currentUser.name);
    await refreshUserData();
    setAdminNotice('Organizer application approved successfully.');
  };

  const handleRejectApplication = async (appId: string) => {
    await db.reviewApplication(appId, 'REJECTED', currentUser.name, 'Application did not meet current verification criteria.');
    await refreshUserData();
    setAdminNotice('Organizer application rejected.');
  };

  const handleApproveEvent = async (eventId: string) => {
    await db.updateEventStatus(eventId, 'PUBLISHED', currentUser.name);
    await refreshUserData();
    setAdminNotice('Event approved! Outbox notification jobs have been queued for opted-in campus members.');
  };

  const handleRejectEvent = async (eventId: string) => {
    await db.updateEventStatus(eventId, 'DRAFT', currentUser.name, 'Please revise event details and resubmit.');
    await refreshUserData();
    setAdminNotice('Event returned to organizer as draft.');
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const success = await db.updateUserRole(userId, newRole, currentUser.name);
    if (success) {
      await refreshUserData();
      setAdminNotice(`User privileges updated to ${newRole}.`);
    } else {
      setAdminNotice('Failed to update user role.');
    }
  };

  const handleTicketStatusChange = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      await api.updateSupportTicket(ticketId, status);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      setAdminNotice(`Ticket marked as ${status}`);
    } catch {
      setAdminNotice('Failed to update ticket status.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;

    try {
      const res = await api.createCategory({
        name: newCatName.trim(),
        slug: newCatSlug.trim().toLowerCase(),
        description: newCatDesc.trim() || undefined,
        color: newCatColor,
      });

      if (res.success && res.category) {
        setCategories(prev => [...prev, res.category]);
        setNewCatName('');
        setNewCatSlug('');
        setNewCatDesc('');
        setAdminNotice(`Category "${res.category.name}" created successfully.`);
      }
    } catch (err: any) {
      setAdminNotice(err?.message || 'Failed to create category.');
    }
  };

  const navItems: DashboardNavItem[] = [
    {
      id: 'applications',
      label: 'Organiser Applications',
      icon: ShieldCheck,
      badge: pendingApps.length,
      badgeVariant: pendingApps.length > 0 ? 'amber' : 'default',
    },
    {
      id: 'approvals',
      label: 'Event Approvals',
      icon: Calendar,
      badge: pendingEvents.length,
      badgeVariant: pendingEvents.length > 0 ? 'rose' : 'default',
    },
    {
      id: 'users',
      label: 'User Accounts & Roles',
      icon: Users,
      badge: users.length,
      badgeVariant: 'royal',
    },
    {
      id: 'tickets',
      label: 'Support Tickets',
      icon: MessageSquare,
      badge: tickets.filter(t => t.status === 'OPEN').length,
      badgeVariant: tickets.filter(t => t.status === 'OPEN').length > 0 ? 'rose' : 'default',
    },
    {
      id: 'reports',
      label: 'Participation Reports',
      icon: BarChart3,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tag,
      badge: categories.length,
    },
    {
      id: 'outbox',
      label: 'Email Outbox Hub',
      icon: Mail,
      badge: outboxJobs.length,
      badgeVariant: 'teal',
    },
    {
      id: 'logs',
      label: 'Security & Audit Logs',
      icon: Activity,
      badge: logs.length,
      badgeVariant: 'default',
    },
  ];

  const quickStats = [
    { label: 'Total Users', value: report?.totalUsers || users.length },
    { label: 'Published Events', value: report?.publishedEvents || events.filter(e => e.status === 'PUBLISHED').length },
    { label: 'Registrations', value: report?.totalRegistrations || 0 },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length },
  ];

  return (
    <>
      <DashboardLayout
        title="Admin Control Center"
        subtitle="Supervise campus organizer accreditation, verify event proposals, monitor email queues, and inspect audit logs."
        badgeText="EventPulse Administrative Console"
        badgeColor="purple"
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        navItems={navItems}
        quickStats={quickStats}
      >
        {adminNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-bold shadow-xs">
            <span>{adminNotice}</span>
            <button type="button" onClick={() => setAdminNotice(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Organiser Applications */}
        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Organiser Role Applications</h3>
            {applications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No applications submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-light/30">
                {applications.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{app.userName}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600 dark:text-slate-300">{app.userEmail}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="font-semibold text-royal dark:text-turquoise">Organization: {app.organizationName} ({app.department || 'Campus Department'})</p>
                      <p className="text-slate-600 dark:text-slate-300 max-w-xl italic">"{app.reason}"</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>

                    {app.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveApplication(app.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Access</span>
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app.id)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-light/40 hover:bg-rose-50 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Event Approvals Queue */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Event Publication Approval Queue</h3>
            {pendingEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-200">All submissions reviewed!</p>
                <p className="text-xs text-slate-400">There are no pending campus events awaiting publication.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-light/30">
                {pendingEvents.map((evt) => (
                  <div key={evt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-base">{evt.title}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise font-bold text-[10px]">{evt.format}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{evt.description}</p>
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 pt-1">
                        <span>Venue: <strong>{evt.venueName || 'Online'}</strong></span>
                        <span>Organizer: <strong>{evt.organizerName}</strong></span>
                        <span>Capacity: <strong>{evt.capacity || 'Open'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/events/${evt.slug}`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-light/50 hover:bg-slate-50 dark:hover:bg-navy-light/20 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Link>
                      <button
                        onClick={() => handleApproveEvent(evt.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve & Publish
                      </button>
                      <button
                        onClick={() => handleRejectEvent(evt.id)}
                        className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold"
                      >
                        Request Revisions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: User Accounts & Roles */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">User Directory & Role Permissions</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name/email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-royal"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-dark text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-navy-light/40">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Matric / Staff ID</th>
                    <th className="py-3 px-4">Faculty & Department</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-light/30">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-light/20">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {u.matricOrStaffId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{u.department || 'General'}</div>
                        <span className="text-[10px] text-slate-400">{u.faculty || 'Campus Community'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' :
                          u.role === 'ORGANIZER' ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' :
                          u.role === 'STAFF' ? 'bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise' : 'bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={u.id === currentUser.id}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="STAFF">Staff</option>
                          <option value="ORGANIZER">Organizer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Support Tickets Console */}
        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Support Tickets Queue</h3>
                <p className="text-xs text-slate-500">Track and manage campus inquiries, bug reports, and user assistance requests.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs bg-white dark:bg-[#0B132B] text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Only</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved Only</option>
                </select>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search ref/user..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs"
                  />
                </div>
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No tickets found matching the selected filter.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-light/30">
                {filteredTickets.map((t) => (
                  <div key={t.id} className="py-4 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-royal dark:text-turquoise">{t.referenceCode}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-bold text-slate-900 dark:text-white">{t.name}</span>
                        <span className="text-slate-400">({t.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={t.status}
                          onChange={(e) => handleTicketStatusChange(t.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-royal dark:bg-royal/30 dark:text-turquoise' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Subject: {t.subject}</p>
                    <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0B132B] p-3 rounded-xl border border-slate-100 dark:border-navy-light/40 leading-relaxed">
                      {t.message}
                    </p>
                    <span className="text-[10px] text-slate-400">Submitted: {new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Participation Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#111A33] p-5 rounded-2xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">Total System Events</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{report?.totalEvents || 0}</p>
                <span className="text-[10px] text-emerald-600 font-bold">{report?.publishedEvents || 0} Published</span>
              </div>
              <div className="bg-white dark:bg-[#111A33] p-5 rounded-2xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">Total Registrations</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{report?.totalRegistrations || 0}</p>
                <span className="text-[10px] text-royal dark:text-turquoise font-bold">Confirmed passes</span>
              </div>
              <div className="bg-white dark:bg-[#111A33] p-5 rounded-2xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">Verified Attendees</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{report?.totalAttended || 0}</p>
                <span className="text-[10px] text-emerald-600 font-bold">Scanned at venues</span>
              </div>
              <div className="bg-white dark:bg-[#111A33] p-5 rounded-2xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400">Attendance Rate</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{report?.attendanceRate || 0}%</p>
                <span className="text-[10px] text-slate-400">Overall turn-out</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Faculty Breakdown */}
              <div className="bg-white dark:bg-[#111A33] p-6 rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Participation by Faculty</h4>
                <div className="space-y-3">
                  {report?.byFaculty?.length ? (
                    report.byFaculty.map((f: any) => (
                      <div key={f.faculty} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{f.faculty}</span>
                          <span className="text-royal dark:text-turquoise font-bold">{f.count} passes</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-royal to-teal" 
                            style={{ width: `${Math.min(100, (f.count / (report.totalRegistrations || 1)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No registration metrics available yet.</p>
                  )}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-[#111A33] p-6 rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Participation by Event Category</h4>
                <div className="space-y-3">
                  {report?.byCategory?.length ? (
                    report.byCategory.map((c: any) => (
                      <div key={c.category} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{c.category}</span>
                          <span className="text-teal dark:text-turquoise font-bold">{c.count} registrations</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-teal to-emerald-500" 
                            style={{ width: `${Math.min(100, (c.count / (report.totalRegistrations || 1)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No category metrics available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Category Management */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Create Category Form */}
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add New Category</h3>
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }}
                    placeholder="e.g. Entrepreneurship"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B]"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Slug</label>
                  <input
                    type="text"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="e.g. entrepreneurship"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Categories List */}
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((c) => (
                  <div key={c.id || c.slug} className="p-4 rounded-2xl border border-slate-200 dark:border-navy-light/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</span>
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color || '#1E40AF' }} />
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">slug: {c.slug}</p>
                    {c.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Email Outbox Hub */}
        {activeTab === 'outbox' && (
          <EmailBroadcastHub initialTab="logs" />
        )}

        {/* Tab 8: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Security Audit Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-dark text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-navy-light/40">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-light/30">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-light/20">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {log.userName || 'System'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-royal dark:text-turquoise">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.entityType} ({log.entityId || 'N/A'})
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </DashboardLayout>

      {/* Outbox Inspector Modal */}
      <OutboxInspectorModal
        isOpen={outboxModalOpen}
        onClose={() => setOutboxModalOpen(false)}
      />
    </>
  );
};
export default AdminDashboard;
