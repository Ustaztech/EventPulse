import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Mail, ArrowRight, Info } from 'lucide-react';
import { api } from '../lib/api';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 pb-20">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">EventPulse NSUK Campus Pilot Project &bull; Last Updated: October 2026</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-navy-card border border-blue-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-royal dark:text-turquoise shrink-0 mt-0.5" />
          <span>EventPulse is an academic campus event pilot research project conducted for Nasarawa State University, Keffi (NSUK). This policy accurately details how student and staff registration records are handled.</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Information We Collect</h3>
        <p>
          EventPulse collects names, institutional campus email addresses, user category affiliations (Student or Staff), optional matriculation/staff IDs, and event registration timestamps solely to manage attendee capacities, digital admission passes, and event updates.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Storage and Data Isolation</h3>
        <p>
          All application records are securely persisted in a shared relational database with role-based access control and strict isolation policies. Browser local storage is limited to harmless visual preferences (such as color theme) and does not store plaintext passwords or authoritative access privileges.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Notifications and Granular Preferences</h3>
        <p>
          We distinguish between two types of communications:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Optional Campus Announcements:</strong> New event discovery digests. Users can opt out anytime via Profile Preferences or the Unsubscribe link.</li>
          <li><strong>Essential Transactional Notices:</strong> Verified ticket confirmation passes, emergency venue changes, and event cancellation alerts sent specifically for events you have registered to attend.</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Account Security</h3>
        <p>
          User passwords are cryptographically salted and hashed using PBKDF2 before storage. Server-side session tokens, expiring verification codes, and rate limiting protect user accounts from brute-force access attempts.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 pb-20">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">EventPulse Campus Event Logistics Pilot &bull; NSUK Case Study</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Pilot Project Purpose</h3>
        <p>
          EventPulse operates as a campus event management prototype for Nasarawa State University, Keffi (NSUK). It is designed to evaluate digital event notifications, seating capacity control, and attendance check-in.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Organiser Accreditation</h3>
        <p>
          Public account registration does not grant event publication privileges. Campus associations, departments, and committees must submit an organiser application detailing their organization and purpose, which requires administrative verification before publishing events.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Event Content & Hall Accuracy</h3>
        <p>
          Organisers must provide genuine event times, realistic venue locations, and accurate speaker agendas. False, misleading, or commercial solicitation proposals will be returned for revision or rejected during administrative review.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Fair Registration & Admission Passes</h3>
        <p>
          Admission passes are personal, generated with unique reference codes and verification tokens. If a registered attendee is no longer able to attend, they should withdraw their registration in their dashboard to free seating capacity for fellow students.
        </p>
      </div>
    </div>
  );
};

export const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [inputToken, setInputToken] = useState(token || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [unsubscribedEmail, setUnsubscribedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (token && token.trim()) {
      handleExecuteUnsubscribe(token.trim());
    }
  }, [token]);

  const handleExecuteUnsubscribe = async (unsubToken: string) => {
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.unsubscribe(unsubToken);
      if (res.success) {
        setStatus('success');
        setUnsubscribedEmail(res.email || null);
        setMessage('You have been successfully removed from optional campus event announcement digests.');
      } else {
        setStatus('error');
        setMessage(res.message || 'Invalid or expired unsubscribe link.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Invalid or expired unsubscribe token. Please verify the link in your email.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    handleExecuteUnsubscribe(inputToken.trim());
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-6 pb-20">
      <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-8 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-blue-50 dark:bg-royal/20 text-royal dark:text-turquoise rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notification Unsubscribe Center</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Manage your campus notification subscription preferences securely without requiring a portal sign-in session.
        </p>

        {status === 'loading' && (
          <div className="py-8 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-royal border-t-transparent rounded-full animate-spin" />
            <span>Verifying unsubscribe token...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Unsubscribe Preference Saved</span>
            </div>
            {unsubscribedEmail && (
              <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">Account: {unsubscribedEmail}</p>
            )}
            <p className="font-normal leading-relaxed text-slate-700 dark:text-slate-300">
              {message}
            </p>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-normal text-slate-500">
              <strong>Notice:</strong> Essential transactional messages (such as verified entry passes for events you explicitly register for, room changes, and cancellation notices) will still be delivered.
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{message}</span>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 text-xs text-left">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-200">Unsubscribe Security Token</label>
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste token from email footer..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal"
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60"
            >
              Opt Out of Optional Announcements
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-navy-light/40 text-xs">
          <Link to="/" className="text-royal dark:text-turquoise font-bold hover:underline">
            Return to EventPulse Campus Hub
          </Link>
        </div>
      </div>
    </div>
  );
};
