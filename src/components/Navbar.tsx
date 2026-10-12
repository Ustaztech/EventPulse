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
  Ticket
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { ThemeToggle } from '../lib/ThemeContext';

export const Navbar: React.FC = () => {
  const { currentUser, unreadCount, logout, refreshUserData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdminEmail = currentUser?.email.trim().toLowerCase() === 'yahayazaid2021@gmail.com';

  const handleClaimSuperAdmin = () => {
    if (!currentUser) return;
    db.promoteToAdmin(currentUser.id);
    refreshUserData();
    navigate('/dashboard/admin');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Events', path: '/explore' },
    { label: 'Calendar', path: '/explore?view=calendar' },
    { label: 'About NSUK', path: '/about' },
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
      {/* Top University Announcement Bar */}
      <div className="bg-gradient-to-r from-navy via-royal to-teal text-white py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-turquoise text-navy-dark px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
              NSUK Portal
            </span>
            <span>Nasarawa State University, Keffi — Campus Event Management & Notification System</span>
          </div>

          {/* User Account Elevation Indicator - Strictly restricted to yahayazaid2021@gmail.com */}
          {currentUser && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-200 text-[11px] hidden sm:inline">
                Signed in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
              </span>
              {isSuperAdminEmail && currentUser.role !== 'ADMIN' && (
                <button
                  onClick={handleClaimSuperAdmin}
                  className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-400 text-navy-dark hover:bg-amber-300 transition-all flex items-center gap-1 shadow-xs"
                  title="Claim Super Administrator Privileges"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Claim Super Admin</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div className="flex-shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path.includes('?') && location.search === link.path.split('?')[1]);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
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
                {/* In-App Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-turquoise hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Notification Centre"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Organizer / Admin quick create */}
                {(currentUser.role === 'ORGANIZER' || currentUser.role === 'ADMIN') && (
                  <Link
                    to="/dashboard/organizer?action=new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4 text-teal dark:text-teal-400" />
                    <span>Create Event</span>
                  </Link>
                )}

                {/* User Profile Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-navy-card transition-all"
                  >
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-xs"
                    />
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 leading-tight">{currentUser.name}</p>
                      <span className="inline-block text-[10px] font-semibold text-royal dark:text-turquoise uppercase tracking-wider">
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Profile Menu Popover */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-card rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                        <span className="mt-1.5 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-royal dark:text-turquoise">
                          {currentUser.role} Account
                        </span>
                      </div>

                      <div className="py-1">
                        {currentUser.role === 'ADMIN' ? (
                          <>
                            <Link
                              to="/dashboard/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-royal dark:text-turquoise bg-blue-50/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800"
                            >
                              <Shield className="w-4 h-4 text-royal dark:text-turquoise" />
                              <span>Admin Command Center</span>
                            </Link>
                            <Link
                              to="/dashboard/organizer"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-royal dark:hover:text-turquoise"
                            >
                              <PlusCircle className="w-4 h-4 text-teal" />
                              <span>Organizer Workspace</span>
                            </Link>
                            <Link
                              to="/dashboard/student"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-royal dark:hover:text-turquoise"
                            >
                              <Ticket className="w-4 h-4 text-slate-400" />
                              <span>My Registrations & Tickets</span>
                            </Link>
                          </>
                        ) : (
                          <Link
                            to={getDashboardPath()}
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-royal dark:hover:text-turquoise"
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
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-royal dark:hover:text-turquoise"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Profile & Notification Prefs</span>
                        </Link>

                        {/* Admin elevation action strictly for designated super admin */}
                        {isSuperAdminEmail && currentUser.role !== 'ADMIN' && (
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleClaimSuperAdmin();
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span>Claim Super Admin</span>
                          </button>
                        )}
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
              <Link
                to="/notifications"
                className="relative p-2 text-slate-600 dark:text-slate-300"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
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
          {navLinks.map((link) => (
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
              {isSuperAdminEmail && currentUser.role !== 'ADMIN' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleClaimSuperAdmin();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50"
                >
                  Claim Super Admin
                </button>
              )}
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
