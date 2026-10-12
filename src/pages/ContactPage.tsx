import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-20">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Contact EventPulse Support
        </h1>
        <p className="text-sm text-slate-600">
          Have an issue with registration, need help with your organizer dashboard, or have questions about a campus event? We’re here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Info */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy via-navy-light to-royal rounded-3xl p-8 text-white space-y-6 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-turquoise">
              University Helpdesk
            </span>
            <h3 className="text-2xl font-black mt-1">Get in Touch Directly</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Our campus event coordination desk and ICT technical officers assist students and organizers Monday through Friday, 8:00 AM – 5:00 PM WAT.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-turquoise shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Main Campus Keffi</p>
                <p className="text-slate-300">Directorate of ICT & Academic Planning, Senate Building Complex, Keffi, Nasarawa State</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Official Email</p>
                <p className="text-slate-300">eventpulse@nsuk.edu.ng</p>
                <p className="text-slate-400">helpdesk@nsuk.edu.ng</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-royal-light shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Telephone Hotline</p>
                <p className="text-slate-300">+234 (0) 47 220 184 / +234 803 123 4567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {submitted && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your message has been dispatched to the NSUK ICT EventPulse team. We will respond promptly via email.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fatima Umar"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="f.umar@nsuk.edu.ng"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Subject Category</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-royal/30"
              >
                <option value="General Inquiry">General Campus Event Inquiry</option>
                <option value="Organizer Access">Organizer Accreditation & Permissions</option>
                <option value="Registration Issue">Ticket Registration or QR Issue</option>
                <option value="Feedback">Feedback / Report Inappropriate Content</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your inquiry or question in detail..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-royal to-teal text-white font-bold text-sm shadow-md flex items-center gap-2 hover:opacity-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ContactPage;
