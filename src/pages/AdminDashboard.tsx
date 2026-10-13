import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { OutboxInspectorModal } from '../components/OutboxInspectorModal';
import { Role } from '../lib/types';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { EmailBroadcastHub } from '../components/EmailBroadcastHub';

export const AdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'approvals' | 'users' | 'outbox' | 'logs'>('applications');
  const [outboxModalOpen, setOutboxModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Administrator Access Required</h2>
        <p className="text-slate-500 text-sm">You must be logged into an administrator account to view this console.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Switch to Admin
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

  const handleApproveApplication = (appId: string) => {
    db.reviewApplication(appId, 'APPROVED', currentUser.name);
    refreshUserData();
    setAdminNotice('Organizer application approved successfully.');
  };

  const handleRejectApplication = (appId: string) => {
    db.reviewApplication(appId, 'REJECTED', currentUser.name, 'Application did not meet current verification criteria.');
    refreshUserData();
    setAdminNotice('Organizer application rejected.');
  };

  const handleApproveEvent = (eventId: string) => {
    db.updateEventStatus(eventId, 'PUBLISHED', currentUser.name);
    refreshUserData();
    setAdminNotice('Event approved! Outbox notification jobs have been generated for opted-in campus members.');
  };

  const handleRejectEvent = (eventId: string) => {
    db.updateEventStatus(eventId, 'DRAFT', currentUser.name, 'Please revise event details and resubmit.');
    refreshUserData();
    setAdminNotice('Event returned to organizer as draft.');
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && targetUser.email.toLowerCase() === 'yahayazaid2021@gmail.com' && newRole !== 'ADMIN') {
      setAdminNotice('Security Policy: Cannot demote the primary Super Administrator account.');
      return;
    }
    db.updateUserRole(userId, newRole, currentUser.name);
    refreshUserData();
    setAdminNotice(`User privileges updated to ${newRole}.`);
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
      id: 'outbox',
      label: 'Email Hub (Resend / MailerLite)',
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
    { label: 'Users', value: users.length },
    { label: 'Org Apps', value: pendingApps.length },
    { label: 'Pending Evts', value: pendingEvents.length },
    { label: 'Outbox', value: outboxJobs.length },
  ];

  return (
    <>
      <DashboardLayout
        title="Admin Control Center"
        subtitle="Supervise campus organizer accreditation, verify event proposals, monitor email queues, and inspect audit logs."
        badgeText="EventPulse Administrative Console"
        badgeColor="purple"
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id)}
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
                    <p className="font-semibold text-royal dark:text-turquoise">Organization: {app.organizationName} ({app.department || 'NSUK'})</p>
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
                        disabled={u.id === currentUser.id || u.email.toLowerCase() === 'yahayazaid2021@gmail.com'}
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

      {/* Tab 4: Email Campaign & Dispatch Hub (Resend / MailerLite) */}
      {activeTab === 'outbox' && (
        <EmailBroadcastHub initialTab="settings" />
      )}

      {/* Tab 5: Audit Logs */}
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
                      {log.ipAddress || '102.89.44.12'}
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
