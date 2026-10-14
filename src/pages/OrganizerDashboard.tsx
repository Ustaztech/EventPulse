import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Download, 
  QrCode, 
  Send, 
  Clock, 
  MapPin, 
  Globe, 
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Eye,
  X,
  Mail
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { api } from '../lib/api';
import { Event, TargetAudience, EventFormat } from '../lib/types';
import { CATEGORY_DEFINITIONS, POPULAR_NSUK_VENUES, NSUK_CAMPUSES, NSUK_FACULTIES } from '../lib/nsuk-data';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { EmailBroadcastHub } from '../components/EmailBroadcastHub';

export const OrganizerDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [searchParams] = useSearchParams();
  const actionParam = searchParams.get('action');

  const [activeTab, setActiveTab] = useState<'events' | 'create' | 'scanner' | 'broadcast' | 'mail'>(
    actionParam === 'new' ? 'create' : 'events'
  );

  // Scanner State
  const [scanCode, setScanCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Broadcast state
  const [selectedBroadcastEvent, setSelectedBroadcastEvent] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'UPDATE' | 'REMINDER_1H' | 'STARTING_NOW'>('UPDATE');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Event Creation Wizard State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200');
  const [categoryId, setCategoryId] = useState(CATEGORY_DEFINITIONS[0].slug);
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [format, setFormat] = useState<EventFormat>('PHYSICAL');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('UNIVERSITY_WIDE');
  const [startDate, setStartDate] = useState(getTomorrowDate());
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(getTomorrowDate());
  const [endTime, setEndTime] = useState('14:00');
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location
  const [venueName, setVenueName] = useState(POPULAR_NSUK_VENUES[0].name);
  const [buildingHall, setBuildingHall] = useState(POPULAR_NSUK_VENUES[0].building);
  const [roomNumber, setRoomNumber] = useState('Main Hall');
  const [campusArea, setCampusArea] = useState(POPULAR_NSUK_VENUES[0].campus);
  const [landmark, setLandmark] = useState(POPULAR_NSUK_VENUES[0].landmark);
  const [address, setAddress] = useState(POPULAR_NSUK_VENUES[0].address);
  const [onlinePlatform, setOnlinePlatform] = useState('Zoom');
  const [onlineJoinLink, setOnlineJoinLink] = useState('https://zoom.us/j/campus-event');
  
  // Rules
  const [capacity, setCapacity] = useState('200');
  const [accessibilityInfo, setAccessibilityInfo] = useState('Wheelchair accessible entry.');
  const [arrivalInstructions, setArrivalInstructions] = useState('Please arrive 15 minutes before scheduled start time.');

  if (!currentUser || (currentUser.role !== 'ORGANIZER' && currentUser.role !== 'ADMIN')) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Organiser Access Required</h2>
        <p className="text-slate-500 text-sm">
          You need an approved Organiser or Administrator account to manage and create campus events.
        </p>
        <Link to="/dashboard/student" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Return to Student Dashboard
        </Link>
      </div>
    );
  }

  const allEvents = db.getEvents();
  const myEvents = currentUser.role === 'ADMIN' 
    ? allEvents 
    : allEvents.filter(e => e.organizerId === currentUser.id);

  const totalRegistrations = myEvents.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const pendingApprovals = myEvents.filter(e => e.status === 'PENDING_APPROVAL').length;

  const handleVenuePreset = (presetName: string) => {
    const venue = POPULAR_NSUK_VENUES.find(v => v.name === presetName);
    if (venue) {
      setVenueName(venue.name);
      setBuildingHall(venue.building);
      setCampusArea(venue.campus);
      setLandmark(venue.landmark);
      setAddress(venue.address);
    }
  };

  const handleCreateSubmit = async (asDraft: boolean) => {
    if (!title.trim() || !description.trim() || !startDate) {
      setFormStatus({ type: 'error', message: 'Please provide event title, description, and start date.' });
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = endDate 
      ? new Date(`${endDate}T${endTime}:00`).toISOString()
      : new Date(`${startDate}T${endTime}:00`).toISOString();

    const selectedCategoryObj = CATEGORY_DEFINITIONS.find(c => c.slug === categoryId) || CATEGORY_DEFINITIONS[0];
    const venue = POPULAR_NSUK_VENUES.find(v => v.name === venueName);

    setIsSubmitting(true);
    setFormStatus(null);

    try {
      await db.saveEvent({
        title: title.trim(),
        description: description.trim(),
        bannerUrl,
        categoryId: selectedCategoryObj.slug || 'cat-1',
        categoryName: selectedCategoryObj.name,
        categoryColor: selectedCategoryObj.color,
        organizerId: currentUser.id,
        organizerName: currentUser.name,
        organizerContact: `${currentUser.email} | ${currentUser.phone || '+234 800 000 0000'}`,
        targetAudience,
        startTime: startISO,
        endTime: endISO,
        timezone: 'Africa/Lagos',
        format,
        venueName: format !== 'ONLINE' ? venueName : undefined,
        buildingHall: format !== 'ONLINE' ? buildingHall : undefined,
        roomNumber: format !== 'ONLINE' ? roomNumber : undefined,
        campusArea: format !== 'ONLINE' ? campusArea : undefined,
        address: format !== 'ONLINE' ? address : undefined,
        landmark: format !== 'ONLINE' ? landmark : undefined,
        latitude: venue?.lat,
        longitude: venue?.lng,
        directionsUrl: venue ? `https://maps.google.com/?q=${venue.lat},${venue.lng}` : undefined,
        onlinePlatform: format !== 'PHYSICAL' ? onlinePlatform : undefined,
        onlineJoinLink: format !== 'PHYSICAL' ? onlineJoinLink : undefined,
        restrictJoinLink: true,
        requiresRegistration: true,
        capacity: capacity ? parseInt(capacity) : undefined,
        accessibilityInfo,
        arrivalInstructions,
        asDraft,
        status: asDraft ? 'DRAFT' : (currentUser.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING_APPROVAL')
      });

      await refreshUserData();
      setFormStatus({
        type: 'success',
        message: asDraft 
          ? 'Event saved as Draft!' 
          : currentUser.role === 'ADMIN' 
          ? 'Event published successfully! Active for registrations.' 
          : 'Event proposal submitted for Administrator approval!'
      });
      setActiveTab('events');
    } catch (err: any) {
      setFormStatus({ type: 'error', message: err?.message || 'Failed to create event.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check-in Scanner Handler
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await db.checkInAttendee(scanCode.trim(), currentUser.name);
      if (res.success && res.attendee) {
        setScanResult({
          success: true,
          msg: `Verified! ${res.attendee.userName} (${res.attendee.userEmail}) checked in successfully.`
        });
        setScanCode('');
        await refreshUserData();
      } else {
        setScanResult({
          success: false,
          msg: res.error || 'Failed to verify pass code.'
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        msg: err?.message || 'Failed to verify pass code.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  // CSV Export Handler
  const exportParticipantRoster = async (eventId: string, eventTitle: string) => {
    try {
      let attendees: any[] = [];
      try {
        const res = await api.getEventAttendees(eventId);
        if (res?.attendees) attendees = res.attendees;
      } catch {
        attendees = db.getRegistrations().filter(r => r.eventId === eventId);
      }

      if (attendees.length === 0) {
        setFormStatus({ type: 'error', message: 'No registrations recorded yet for this event.' });
        return;
      }

      const headers = ['Reference Code', 'Full Name', 'Email Address', 'Status', 'Registration Date', 'Attended Time'];
      const rows = attendees.map((r: any) => [
        r.reference_code || r.referenceCode,
        `"${r.user_name || r.userName}"`,
        r.user_email || r.userEmail,
        r.status,
        new Date(r.registered_at || r.registeredAt).toLocaleString(),
        r.attended_at || r.attendedAt ? new Date(r.attended_at || r.attendedAt).toLocaleString() : 'N/A'
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventTitle.slice(0, 20)}-roster.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setFormStatus({ type: 'error', message: err?.message || 'Failed to export attendee roster.' });
    }
  };

  // Broadcast Handler
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBroadcastEvent) return;

    const evt = allEvents.find(e => e.id === selectedBroadcastEvent);
    if (!evt) return;

    await db.updateEvent(evt.id, {
      description: broadcastMessage.trim() ? `${evt.description}\n\n[Organizer Broadcast]: ${broadcastMessage.trim()}` : evt.description
    }, currentUser.name);

    setBroadcastSuccess(true);
    setBroadcastMessage('');
    refreshUserData();
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const navItems: DashboardNavItem[] = [
    {
      id: 'events',
      label: 'My Events',
      icon: Calendar,
      badge: myEvents.length,
      badgeVariant: 'royal',
    },
    {
      id: 'create',
      label: 'Create New Event',
      icon: PlusCircle,
      badge: 'Draft',
      badgeVariant: 'teal',
    },
    {
      id: 'scanner',
      label: 'Attendance Scanner',
      icon: QrCode,
      badge: 'Live',
      badgeVariant: 'amber',
    },
    {
      id: 'broadcast',
      label: 'Broadcast Notice',
      icon: Send,
      badge: 'Alert',
      badgeVariant: 'royal',
    },
    {
      id: 'mail',
      label: 'Email Hub (Resend / MailerLite)',
      icon: Mail,
      badge: 'Live',
      badgeVariant: 'teal',
    },
  ];

  const quickStats = [
    { label: 'Events', value: myEvents.length },
    { label: 'Registered', value: totalRegistrations },
    { label: 'Pending', value: pendingApprovals },
  ];

  return (
    <DashboardLayout
      title={`Organiser: ${currentUser.name}`}
      subtitle="Publish university events, track registrations, verify attendee passes, and broadcast live alerts."
      badgeText="Organiser Workspace"
      badgeColor="teal"
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id)}
      navItems={navItems}
      quickStats={quickStats}
    >

      {/* Tab 1: Manage My Events */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-navy-light/40 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Created Events Directory</h3>
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal-600 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>

          {formStatus && (
            <div className={`mx-6 mt-4 p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
              formStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
            }`}>
              <span>{formStatus.message}</span>
              <button type="button" onClick={() => setFormStatus(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-dark text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-navy-light/40">
                <tr>
                  <th className="py-3 px-6">Event Title</th>
                  <th className="py-3 px-6">Format & Venue</th>
                  <th className="py-3 px-6">Schedule (WAT)</th>
                  <th className="py-3 px-6">Seating & Regs</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-light/30">
                {myEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">No events created yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click "Create Event" to draft and publish your first campus event.</p>
                    </td>
                  </tr>
                ) : (
                  myEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-light/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white text-sm max-w-xs truncate">{evt.title}</div>
                      <span className="text-[10px] text-slate-400">{evt.categoryName}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold">{evt.format}</div>
                      <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                        {evt.venueName || 'Online Platform'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <div>{new Date(evt.startTime).toLocaleDateString()}</div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 dark:text-white">{evt.registeredCount || 0}</span>
                      <span className="text-slate-400"> / {evt.capacity || 'Open'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        evt.status === 'PUBLISHED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : evt.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : evt.status === 'DRAFT'
                          ? 'bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {evt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => exportParticipantRoster(evt.id, evt.title)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-blue-50 dark:hover:bg-navy-light/30 transition-colors"
                        title="Download CSV Participant Roster"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/events/${evt.slug}`}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-blue-50 dark:hover:bg-navy-light/30 transition-colors inline-block"
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Create New Event Wizard */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Create Campus Event</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide thorough details to ensure accurate map directions, capacity enforcement, and prompt approval.
            </p>
          </div>

          {formStatus && (
            <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
              formStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
            }`}>
              <span>{formStatus.message}</span>
              <button type="button" onClick={() => setFormStatus(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-6">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Campus Robotics & AI Showcase 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-sm bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30"
                >
                  {CATEGORY_DEFINITIONS.map(c => (
                    <option key={c.slug} value={c.slug} className="dark:bg-navy-dark">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Full Description & Agenda</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail keynote speakers, research themes, participation requirements, and learning objectives..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                rows={4}
                required
              />
            </div>

            {/* Banner URL & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Banner Image URL</label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-sm bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30"
                >
                  <option value="UNIVERSITY_WIDE" className="dark:bg-navy-dark">University-Wide (All Campus)</option>
                  <option value="FACULTY" className="dark:bg-navy-dark">Faculty Specific</option>
                  <option value="DEPARTMENT" className="dark:bg-navy-dark">Department Specific</option>
                  <option value="INTEREST" className="dark:bg-navy-dark">Interest Based</option>
                </select>
              </div>
            </div>

            {/* Date & Time (WAT - Africa/Lagos) */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-navy/40 border border-blue-200/60 dark:border-navy-light/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-royal dark:text-turquoise">
                <Clock className="w-4 h-4" />
                <span>Schedule & Timezone (Africa/Lagos - WAT UTC+1)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Event Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Delivery Format</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'PHYSICAL', label: 'Campus Physical', icon: MapPin },
                  { id: 'ONLINE', label: 'Virtual Only', icon: Globe },
                  { id: 'HYBRID', label: 'Hybrid Format', icon: Sparkles },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      format === f.id
                        ? 'bg-royal text-white border-royal shadow-sm'
                        : 'bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-light/50 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                    }`}
                  >
                    <f.icon className="w-4 h-4" />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Fields for Physical & Hybrid */}
            {format !== 'ONLINE' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy/40 border border-slate-200 dark:border-navy-light/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <MapPin className="w-4 h-4 text-royal dark:text-turquoise" />
                    <span>Physical Venue Location & Landmark</span>
                  </div>
                  {/* Preset Venue selector */}
                  <select
                    onChange={(e) => handleVenuePreset(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Load Campus Venue Preset...</option>
                    {POPULAR_NSUK_VENUES.map(v => (
                      <option key={v.name} value={v.name} className="dark:bg-navy-dark">{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Venue Name</label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Building / Hall</label>
                    <input
                      type="text"
                      value={buildingHall}
                      onChange={(e) => setBuildingHall(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Campus Area</label>
                    <input
                      type="text"
                      value={campusArea}
                      onChange={(e) => setCampusArea(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Landmark Description</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Online Fields */}
            {format !== 'PHYSICAL' && (
              <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Meeting Platform</label>
                  <input
                    type="text"
                    value={onlinePlatform}
                    onChange={(e) => setOnlinePlatform(e.target.value)}
                    placeholder="Zoom, Google Meet, Microsoft Teams"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Meeting Join Link</label>
                  <input
                    type="url"
                    value={onlineJoinLink}
                    onChange={(e) => setOnlineJoinLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Seating Capacity & Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Seating Capacity (Leave blank for open)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Accessibility Information</label>
                <input
                  type="text"
                  value={accessibilityInfo}
                  onChange={(e) => setAccessibilityInfo(e.target.value)}
                  placeholder="Ramp access, sign language interpreter, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-light/40">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateSubmit(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-navy-light/60 hover:bg-slate-50 dark:hover:bg-navy-light/20 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateSubmit(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-xs shadow-md disabled:opacity-60"
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : currentUser.role === 'ADMIN' 
                  ? 'Publish Event Directly' 
                  : 'Submit for Admin Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Scanner Simulator */}
      {activeTab === 'scanner' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 sm:p-8 space-y-6 max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-royal/20 text-royal dark:text-turquoise rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Entrance Attendance Check-In</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify attendee passes using their digital code (e.g. <code>EP-74892</code>) or camera scanner.
            </p>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-3">
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Enter Reference Code (e.g. EP-74892)..."
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-center font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-royal"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-royal text-white font-bold text-xs hover:bg-royal-hover shadow-sm"
            >
              Verify & Check-In Attendee
            </button>
          </form>

          {scanResult && (
            <div className={`p-4 rounded-2xl border text-xs font-bold text-left flex items-start gap-2.5 ${
              scanResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
            }`}>
              {scanResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{scanResult.msg}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Broadcast Announcement Tool */}
      {activeTab === 'broadcast' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Broadcast Notice to Attendees</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Notify registered participants immediately via in-app alerts and transactional email regarding schedule or venue adjustments.
            </p>
          </div>

          {broadcastSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Broadcast dispatched to all registered attendees!</span>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Event</label>
              <select
                value={selectedBroadcastEvent}
                onChange={(e) => setSelectedBroadcastEvent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30"
                required
              >
                <option value="">Select one of your events...</option>
                {myEvents.map(e => (
                  <option key={e.id} value={e.id} className="dark:bg-navy-dark">{e.title} ({e.registeredCount || 0} registered)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Broadcast Notification Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setBroadcastType('UPDATE')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    broadcastType === 'UPDATE' 
                      ? 'bg-royal text-white border-royal' 
                      : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                  }`}
                >
                  Schedule / Venue Update
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('REMINDER_1H')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    broadcastType === 'REMINDER_1H' 
                      ? 'bg-amber-500 text-slate-900 border-amber-500 font-black' 
                      : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                  }`}
                >
                  ⏰ 1-Hour Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('STARTING_NOW')}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    broadcastType === 'STARTING_NOW' 
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black' 
                      : 'border-slate-200 dark:border-navy-light/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                  }`}
                >
                  🟢 Happening Now Alert
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Custom Note (Optional)</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. Notice: Seating will commence 15 minutes earlier due to guest arrival..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-royal text-white font-bold text-xs hover:bg-royal-hover shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Broadcast Alert</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Email Broadcast & Campaign Hub (Resend / MailerLite) */}
      {activeTab === 'mail' && (
        <EmailBroadcastHub initialTab="compose" />
      )}
    </DashboardLayout>
  );
};
export default OrganizerDashboard;
