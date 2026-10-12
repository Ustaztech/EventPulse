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

export const AdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'approvals' | 'users' | 'outbox' | 'logs'>('applications');
  const [outboxModalOpen, setOutboxModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

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

  const [adminNotice, setAdminNotice] = useState<string | null>(null);

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
    db.updateUserRole(userId, newRole, currentUser.name);
    refreshUserData();
    setAdminNotice(`User privileges updated to ${newRole}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-dark via-navy to-royal rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-turquoise text-navy-dark">
              NSUK Administrative Console
            </span>
            <span className="text-xs text-slate-300">System Oversight & Moderation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Administrator Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Supervise campus organizer accreditation, verify event proposals, monitor email queues, and inspect audit logs.
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{users.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Users</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{pendingApps.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Org Apps</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{pendingEvents.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Pending Evts</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{outboxJobs.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Outbox Jobs</span>
          </div>
        </div>
      </div>

      {adminNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between text-xs font-bold shadow-xs">
          <span>{adminNotice}</span>
          <button type="button" onClick={() => setAdminNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-light/40 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'applications'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Organiser Applications ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'approvals'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Approvals ({pendingEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outbox')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'outbox'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Outbox Queue ({outboxJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'logs'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Logs ({logs.length})</span>
        </button>
      </div>

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
                      <span className="text-[10px] text-slate-400">{u.faculty || 'NSUK'}</span>
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
                        className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-semibold"
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

      {/* Tab 4: Email Outbox Inspector */}
      {activeTab === 'outbox' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Transactional Outbox Queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect enqueued notifications, view retry backoff attempts, and preview raw responsive HTML templates.
              </p>
            </div>
            <button
              onClick={() => setOutboxModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-royal text-white font-bold text-xs hover:bg-royal-hover shadow-xs self-start"
            >
              <Mail className="w-4 h-4" />
              <span>Open Detailed Queue Inspector</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-dark text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-navy-light/40">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject & Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-light/30">
                {outboxJobs.slice(0, 15).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-light/20">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {job.recipientEmail}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{job.subject}</div>
                      <span className="text-[10px] text-royal dark:text-turquoise font-mono">{job.notificationType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        job.status === 'DELIVERED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                        job.status === 'QUEUED' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {job.attemptCount}/{job.maxAttempts}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* Outbox Inspector Modal */}
      <OutboxInspectorModal
        isOpen={outboxModalOpen}
        onClose={() => setOutboxModalOpen(false)}
      />
    </div>
  );
};
export default AdminDashboard;
