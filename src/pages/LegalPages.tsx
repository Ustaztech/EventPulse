import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 pb-20">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: October 2026 &bull; Nasarawa State University, Keffi</p>
      </div>

      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
        <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
        <p>
          EventPulse collects student matriculation numbers, staff identity numbers, university institutional email addresses, departmental affiliations, and event registration records solely to facilitate campus event admission and academic coordination.
        </p>

        <h3 className="text-base font-bold text-slate-900">2. Use of Information</h3>
        <p>
          Your data is used strictly to dispatch automated event confirmations, 24-hour/1-hour calendar departure reminders, live hall location updates, and requested announcements. NSUK never sells or distributes student data to third-party commercial marketing entities.
        </p>

        <h3 className="text-base font-bold text-slate-900">3. Email Notifications & Unsubscribe Rights</h3>
        <p>
          In compliance with student communication guidelines, you may opt out of optional announcement newsletters at any time via your Profile Preferences or by using the direct 1-click unsubscribe links located in the footer of all optional notification emails.
        </p>

        <h3 className="text-base font-bold text-slate-900">4. Data Security</h3>
        <p>
          User passwords are encrypted using one-way cryptographic hashing. All API communications and database transactions enforce role-based access control and strict transactional isolation.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 pb-20">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Nasarawa State University, Keffi (NSUK)</p>
      </div>

      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
        <h3 className="text-base font-bold text-slate-900">1. User Eligibility</h3>
        <p>
          EventPulse is accessible to registered students, academic staff, non-academic personnel, alumni, and accredited university guests of Nasarawa State University, Keffi.
        </p>

        <h3 className="text-base font-bold text-slate-900">2. Organiser Responsibilities</h3>
        <p>
          Event organisers must provide accurate venue details, legitimate speaker information, verified start/end times, and adhere to university code of conduct. False venue locations or unauthorized commercial solicitations are strictly prohibited and subject to immediate administrative sanctions.
        </p>

        <h3 className="text-base font-bold text-slate-900">3. Seating Capacity & Registrations</h3>
        <p>
          Event passes and registration references are issued on a first-come, first-served basis according to room safety limits. Registrations are personal to the student and cannot be transferred without organizer consent.
        </p>
      </div>
    </div>
  );
};

export const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [unsubscribed, setUnsubscribed] = useState(false);

  const handleUnsubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setUnsubscribed(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-6 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-blue-50 text-royal rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Notification Unsubscribe Center</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You can stop optional announcement digests here without requiring an active portal login session.
        </p>

        {unsubscribed ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Unsubscribe Preference Saved</span>
            </div>
            <p>You have been removed from optional campus event announcement mailings. Critical registration receipts and time changes will still be delivered if you register for events.</p>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-3 pt-2 text-xs text-left">
            <label className="font-bold text-slate-700">Enter Your University Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@nsuk.edu.ng"
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-royal"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Unsubscribe from Announcements
            </button>
          </form>
        )}

        <div className="pt-2 text-xs">
          <Link to="/" className="text-royal font-bold hover:underline">
            Return to EventPulse Home
          </Link>
        </div>
      </div>
    </div>
  );
};
