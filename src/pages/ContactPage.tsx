import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { api } from '../lib/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Support Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitSupportTicket({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setIsSubmitting(false);
      if (res.success && res.referenceCode) {
        setReferenceCode(res.referenceCode);
        // Clear entered form upon success
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setErrorMessage(res.message || 'Failed to submit ticket. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Network error communicating with the support ticketing service. Your entered details have been preserved.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-20">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          EventPulse Support & Inquiries
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Have an issue with registration passes, need assistance with your organiser account, or want to report an issue? Submit a ticket below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Pilot Project Info */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy via-navy-light to-royal rounded-3xl p-8 text-white space-y-6 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-turquoise">
              Campus Pilot Support Desk
            </span>
            <h3 className="text-2xl font-black mt-1">Get in Touch</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              EventPulse is an intelligent campus event management and notification platform. Our technical support team reviews inquiries Monday through Friday, 8:00 AM – 5:00 PM WAT.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-turquoise shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Implementation Hub</p>
                <p className="text-slate-300">Campus Operations Center, EventPulse Hub</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Verified Contact Email</p>
                <p className="text-slate-300">support@eventpulse.com.ng</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-royal-light shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Automated Ticket Tracking</p>
                <p className="text-slate-300">Each inquiry generates a traceable reference code reviewed in the administration console.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Support Ticket Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 sm:p-8 shadow-sm">
          {referenceCode && (
            <div className="mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Support Ticket Created Successfully!</span>
              </div>
              <p className="font-mono text-sm">Ticket Reference: <strong className="text-royal dark:text-turquoise">{referenceCode}</strong></p>
              <p className="font-normal text-slate-600 dark:text-slate-300">
                Your inquiry has been stored in the support queue. An administrator will review your ticket and reach out via your provided email address.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fatima Umar"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-200">Campus Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@eventpulse.com.ng"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-200">Subject Category</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
              >
                <option value="General Support Inquiry">General Support Inquiry</option>
                <option value="Event Registration Issue">Event Registration Issue</option>
                <option value="Organiser Application Status">Organiser Application Status</option>
                <option value="Venue or Navigation Assistance">Venue or Navigation Assistance</option>
                <option value="Notification & Unsubscribe Question">Notification & Unsubscribe Question</option>
                <option value="Technical Issue or Bug Report">Technical Issue or Bug Report</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-200">Detailed Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or the issue you are experiencing..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Persisting Support Ticket...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket to Queue</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
