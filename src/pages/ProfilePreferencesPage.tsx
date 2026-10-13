import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bell, Mail, Shield, Save, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { NotificationPreferences } from '../lib/types';
import { NSUK_FACULTIES } from '../lib/nsuk-data';

export const ProfilePreferencesPage: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm">Sign in to view and edit your profile settings.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [faculty, setFaculty] = useState(currentUser.faculty || NSUK_FACULTIES[0].name);
  const [department, setDepartment] = useState(currentUser.department || NSUK_FACULTIES[0].departments[0]);

  // Preferences
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => db.getPreferences(currentUser.id));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFacultyChange = (fName: string) => {
    setFaculty(fName);
    const found = NSUK_FACULTIES.find(f => f.name === fName);
    if (found && found.departments.length > 0) {
      setDepartment(found.departments[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.setPreferences(currentUser.id, prefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Profile & Notification Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your department information and granular automated mailing preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Notification preferences and profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal Details Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-royal" />
            <h3 className="font-bold text-slate-900 text-base">Account Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Matric / Staff ID</label>
              <input
                type="text"
                value={currentUser.matricOrStaffId || 'Not Specified'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Faculty</label>
              <select
                value={faculty}
                onChange={(e) => handleFacultyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-royal/30"
              >
                {NSUK_FACULTIES.map(f => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-royal/30"
              >
                {NSUK_FACULTIES.find(f => f.name === faculty)?.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Granular Automated Mailing Preferences Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-5 h-5 text-teal" />
            <h3 className="font-bold text-slate-900 text-base">Automated Email Notification Rules</h3>
          </div>

          <div className="space-y-4">
            {/* Announcements */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs block">New Event Published Announcements</span>
                <p className="text-[11px] text-slate-500">
                  Receive email newsletters when newly approved events match your faculty, department, or selected interests.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailAnnouncements}
                onChange={(e) => setPrefs({ ...prefs, emailAnnouncements: e.target.checked })}
                className="w-5 h-5 rounded text-royal focus:ring-royal mt-1 cursor-pointer"
              />
            </div>

            {/* 24-Hour Reminder */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs block">24-Hour Upcoming Event Reminder</span>
                <p className="text-[11px] text-slate-500">
                  Dispatches an email summary of the venue and schedule exactly 1 day before the event start.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.reminder24h}
                onChange={(e) => setPrefs({ ...prefs, reminder24h: e.target.checked })}
                className="w-5 h-5 rounded text-royal focus:ring-royal mt-1 cursor-pointer"
              />
            </div>

            {/* 1-Hour Reminder */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs block">1-Hour Final Departure Reminder</span>
                <p className="text-[11px] text-slate-500">
                  Alerts you 60 minutes before start time with venue directions or verified online link.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.reminder1h}
                onChange={(e) => setPrefs({ ...prefs, reminder1h: e.target.checked })}
                className="w-5 h-5 rounded text-royal focus:ring-royal mt-1 cursor-pointer"
              />
            </div>

            {/* Starting Now */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs block">Event Starting Now Alert</span>
                <p className="text-[11px] text-slate-500">
                  Dispatched at the exact event start time with live hall entrance directions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.eventStartingNow}
                onChange={(e) => setPrefs({ ...prefs, eventStartingNow: e.target.checked })}
                className="w-5 h-5 rounded text-royal focus:ring-royal mt-1 cursor-pointer"
              />
            </div>

            {/* Schedule Changes */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-xs block">Important Schedule & Venue Changes (Recommended)</span>
                <p className="text-[11px] text-slate-500">
                  Critical updates if an organizer changes venue, postpones time, or issues room relocations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.eventChanges}
                onChange={(e) => setPrefs({ ...prefs, eventChanges: e.target.checked })}
                className="w-5 h-5 rounded text-royal focus:ring-royal mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
export default ProfilePreferencesPage;
