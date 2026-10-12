import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Calendar, ShieldCheck, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-dark text-slate-300 border-t border-slate-800">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & About Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="lg" isDark={true} />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mt-3">
              EventPulse is an independent, next-generation campus event management and intelligent notification system. Built for university communities, featuring Nasarawa State University, Keffi (NSUK) as a flagship pilot case study.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-turquoise shrink-0" />
                <span>Keffi-Akwanga Corridor, Nasarawa State, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-accent shrink-0" />
                <span>support@eventpulse.com.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-royal shrink-0" />
                <span>+234 (0) 700 EVENTPULSE</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explore Events
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="hover:text-turquoise transition-colors">
                  All Campus Events
                </Link>
              </li>
              <li>
                <Link to="/explore?view=calendar" className="hover:text-turquoise transition-colors">
                  Interactive Calendar
                </Link>
              </li>
              <li>
                <Link to="/explore?category=academic" className="hover:text-turquoise transition-colors">
                  Academic & Lectures
                </Link>
              </li>
              <li>
                <Link to="/explore?category=technology" className="hover:text-turquoise transition-colors">
                  Tech & Innovation
                </Link>
              </li>
              <li>
                <Link to="/explore?category=sports" className="hover:text-turquoise transition-colors">
                  Sports & Tournaments
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Accounts */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              User Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/dashboard/student" className="hover:text-turquoise transition-colors">
                  Student/Staff Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/organizer" className="hover:text-turquoise transition-colors">
                  Organiser Workspace
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-turquoise transition-colors">
                  Admin Control Center
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-turquoise transition-colors">
                  Notification Settings
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-turquoise transition-colors">
                  Notification Centre
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional & Legal */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Institutional
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-turquoise transition-colors">
                  About EventPulse
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-turquoise transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-turquoise transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-turquoise transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/unsubscribe" className="hover:text-rose-400 transition-colors">
                  Unsubscribe Preferences
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            &copy; {new Date().getFullYear()} EventPulse. Campus Event Management System (NSUK Pilot Case Study). All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span>Stay Connected. Never Miss an Event.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
