import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  PlusCircle, 
  Menu, 
  X, 
  Layers,
  ChevronDown,
  ShieldAlert,
  Ticket,
  MapPin,
  Calendar,
  Sparkles,
  GraduationCap,
  Flame,
  Building2,
  ArrowRight,
  Compass
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { ThemeToggle } from '../lib/ThemeContext';

export const Navbar: React.FC = () => {
  const { currentUser, unreadCount, logout, refreshUserData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [mobileHomeOpen, setMobileHomeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'ADMIN';

  const otherNavLinks = [
    { label: 'Explore Events', path: '/explore' },
    { label: 'Calendar', path: '/explore?view=calendar' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (!currentUser) return '/auth/login';
    if (currentUser.role === 'ADMIN') return '/dashboard/admin';
    if (currentUser.role === 'ORGANIZER') return '/dashboard/organizer';
    return '/dashboard/student';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-navy/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <BrandLogo size="md" to={currentUser ? getDashboardPath() : '/'} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {!currentUser ? (
              /* Home with Dropdown (Accessible only when logged out) */
              <div 
                className="relative"
                onMouseEnter={() => setHomeDropdownOpen(true)}
                onMouseLeave={() => setHomeDropdownOpen(false)}
              >
                <div className="flex items-center">
                  <Link
                    to="/"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      location.pathname === '/'
                        ? 'text-royal dark:text-turquoise bg-blue-50/80 dark:bg-slate-800 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>Home</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${homeDropdownOpen ? 'rotate-180 text-royal dark:text-turquoise' : 'text-slate-400'}`} />
                  </Link>
                </div>


              {/* Home Mega Dropdown Menu */}
              {homeDropdownOpen && (
                <div className="absolute top-full left-0 pt-2 w-[620px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="bg-white dark:bg-[#111A33] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-navy-light/50 p-6 backdrop-blur-xl space-y-5">
                    {/* Header Banner */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-light/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise">
                            Discovery Hub
                          </span>
                          <span className="text-xs text-slate-400">Campus Event Directory</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          EventPulse &bull; Campus Venues & Tracks
                        </h4>
                      </div>
                      <Link
                        to="/"
                        onClick={() => setHomeDropdownOpen(false)}
                        className="text-xs font-bold text-royal dark:text-turquoise hover:underline flex items-center gap-1"
                      >
                        <span>Main Welcome Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Dual-Column Section */}
                    <div className="grid grid-cols-2 gap-5 text-xs">
                      {/* Left: Campuses */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] block">
                          Four University Campuses
                        </span>
                        <div className="space-y-1.5">
                          <Link
                            to="/explore?campus=Main Campus (Keffi)"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <Building2 className="w-4 h-4 text-royal dark:text-turquoise shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-royal dark:group-hover:text-turquoise transition-colors">
                                Main Campus (Keffi)
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Senate Chamber, Innovation Complex & Convocation
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?campus=Pyanku Campus"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <GraduationCap className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-teal transition-colors">
                                Pyanku Campus
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                School of Basic & Remedial Studies
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?campus=Gudi Campus"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <Sparkles className="w-4 h-4 text-turquoise shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-turquoise transition-colors">
                                Gudi Campus
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                College of Health Sciences & Engineering
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?campus=Lafia Campus"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                                Lafia Campus
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Faculty of Agriculture & Agro-Tech
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Right: Featured Categories & Live Feeds */}
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] block">
                          Featured Event Tracks
                        </span>
                        <div className="space-y-1.5">
                          <Link
                            to="/explore?category=academic-defense"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <GraduationCap className="w-4 h-4 text-royal dark:text-turquoise shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-royal dark:group-hover:text-turquoise transition-colors">
                                Academic & Thesis Defenses
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Faculty symposiums & guest colloquiums
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?category=technology-innovation"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-teal transition-colors">
                                Tech Expos & AI Hackathons
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Developer bootcamps & robotics showcases
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?category=sports-athletics"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors">
                                Sports & VC Championship
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Inter-faculty athletic leagues & tournaments
                              </p>
                            </div>
                          </Link>

                          <Link
                            to="/explore?category=student-life"
                            onClick={() => setHomeDropdownOpen(false)}
                            className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-light/30 transition-all flex items-start gap-2.5 group"
                          >
                            <Compass className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                                SUG & Campus Life
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Student Union cultural week & orientations
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Jump Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-navy-light/40 flex items-center justify-between text-xs font-semibold">
                      <Link
                        to="/explore?view=calendar"
                        onClick={() => setHomeDropdownOpen(false)}
                        className="text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-royal dark:text-turquoise" />
                        <span>Interactive Calendar Matrix</span>
                      </Link>

                      <Link
                        to="/explore"
                        onClick={() => setHomeDropdownOpen(false)}
                        className="text-royal dark:text-turquoise hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Browse All Events</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to={getDashboardPath()}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname.startsWith('/dashboard')
                  ? 'text-royal dark:text-turquoise bg-blue-50/80 dark:bg-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-royal dark:text-turquoise" />
              <span>Dashboard</span>
            </Link>
          )}

            {/* Other Navigation Links */}
            {otherNavLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path.includes('?') && location.search === link.path.split('?')[1]);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-royal dark:text-turquoise bg-blue-50/80 dark:bg-slate-800 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {currentUser ? (
              <>
                {/* Notification Bell (Image 4 style) */}
                <Link
                  to="/notifications"
                  aria-label="View notifications"
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-navy" />
                  )}
                </Link>

                {/* Direct Dashboard Link */}
                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 dark:text-teal-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 transition-all shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                {/* User Profile Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-navy-card transition-all"
                  >
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-xs"
                    />
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 leading-tight">{currentUser.name}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Menu Popover */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                        <span className="mt-1.5 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-teal-300">
                          {currentUser.role} Account
                        </span>
                      </div>

                      <div className="py-1">
                        {currentUser.role === 'ADMIN' ? (
                          <>
                            <Link
                              to="/dashboard/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-teal-300 bg-blue-50/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800"
                            >
                              <Shield className="w-4 h-4 text-blue-600 dark:text-teal-300" />
                              <span>Admin Command Center</span>
                            </Link>
                            <Link
                              to="/dashboard/organizer"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-teal-300"
                            >
                              <PlusCircle className="w-4 h-4 text-teal" />
                              <span>Organizer Workspace</span>
                            </Link>
                            <Link
                              to="/dashboard/student"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-teal-300"
                            >
                              <Ticket className="w-4 h-4 text-slate-400" />
                              <span>My Registrations & Tickets</span>
                            </Link>
                          </>
                        ) : (
                          <Link
                            to={getDashboardPath()}
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-teal-300"
                          >
                            <Layers className="w-4 h-4 text-slate-400" />
                            <span>
                              {currentUser.role === 'ORGANIZER' ? 'Organizer Dashboard' : 'Student Dashboard'}
                            </span>
                          </Link>
                        )}

                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-teal-300"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Profile & Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Visible Logout Button on the Right Side */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-xs"
                  title="Sign out from your account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-bold text-royal dark:text-turquoise hover:text-royal-hover hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-royal to-teal hover:opacity-95 rounded-xl shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            {currentUser && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-navy px-4 pt-3 pb-6 space-y-2">
          {/* Mobile Home Expandable Item (Only for unauthenticated visitors) */}
          {!currentUser ? (
            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-navy-light/30">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-navy-light/20">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-bold text-slate-800 dark:text-white hover:text-royal dark:hover:text-turquoise"
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileHomeOpen(!mobileHomeOpen)}
                  className="p-1 rounded-md text-slate-500 hover:text-royal dark:hover:text-turquoise"
                  aria-label="Toggle Home menu options"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileHomeOpen ? 'rotate-180 text-royal dark:text-turquoise' : ''}`} />
                </button>
              </div>

              {mobileHomeOpen && (
                <div className="p-3 bg-white dark:bg-[#111A33] border-t border-slate-100 dark:border-navy-light/40 space-y-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Campus Locations & Tracks
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 font-medium">
                    <Link
                      to="/explore?campus=Main Campus (Keffi)"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-light/30 text-slate-700 dark:text-slate-300"
                    >
                      Main Campus
                    </Link>
                    <Link
                      to="/explore?campus=Pyanku Campus"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-light/30 text-slate-700 dark:text-slate-300"
                    >
                      Pyanku Campus
                    </Link>
                    <Link
                      to="/explore?campus=Gudi Campus"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-light/30 text-slate-700 dark:text-slate-300"
                    >
                      Gudi Campus
                    </Link>
                    <Link
                      to="/explore?campus=Lafia Campus"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-light/30 text-slate-700 dark:text-slate-300"
                    >
                      Lafia Campus
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-navy-light/40">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                      Categories
                    </span>
                    <div className="space-y-1">
                      <Link
                        to="/explore?category=academic-defense"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block p-1 text-slate-700 dark:text-slate-300 hover:text-royal"
                      >
                        Academic Defenses
                      </Link>
                      <Link
                        to="/explore?category=technology-innovation"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block p-1 text-slate-700 dark:text-slate-300 hover:text-royal"
                      >
                        Tech Expos & AI Hackathons
                      </Link>
                      <Link
                        to="/explore?category=sports-athletics"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block p-1 text-slate-700 dark:text-slate-300 hover:text-royal"
                      >
                        Sports & VC Championship
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-royal/20 text-royal dark:text-turquoise font-bold text-base"
            >
              <Layers className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          )}

          {/* Other Navigation Links */}
          {otherNavLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}
          {currentUser ? (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {currentUser.role === 'ADMIN' ? (
                <>
                  <Link
                    to="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-bold text-royal dark:text-turquoise bg-blue-50 dark:bg-slate-800"
                  >
                    Admin Command Center
                  </Link>
                  <Link
                    to="/dashboard/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Organizer Workspace
                  </Link>
                  <Link
                    to="/dashboard/student"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    My Registrations & Tickets
                  </Link>
                </>
              ) : (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-bold text-royal dark:text-turquoise bg-blue-50 dark:bg-slate-800"
                >
                  Go to Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Notification Preferences
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl font-bold text-sm text-royal dark:text-turquoise border border-royal dark:border-turquoise"
              >
                Log In
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl font-bold text-sm text-white bg-royal"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
