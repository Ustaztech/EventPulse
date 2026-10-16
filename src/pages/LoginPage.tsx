import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Calendar,
  Users,
  Bell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { db } from '../lib/storage';
import { getDefaultDashboardRoute } from '../lib/rbac';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  React.useEffect(() => {
    if (currentUser) {
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam), { replace: true });
      } else {
        navigate(getDefaultDashboardRoute(currentUser), { replace: true });
      }
    }
  }, [currentUser, navigate, redirectParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid email or password. Please try again.');
      } else {
        if (redirectParam) {
          navigate(decodeURIComponent(redirectParam));
        } else {
          const loggedUser = db.getCurrentUser();
          navigate(getDefaultDashboardRoute(loggedUser));
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error occurred during login.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 dark:bg-navy-dark transition-colors flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111A33] rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[620px]">
        
        {/* Left Hero Branding Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white p-5 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative background wave */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Tag */}
          <div className="relative z-10 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="14" y="17" width="72" height="72" rx="18" stroke="#FFFFFF" strokeWidth="8" fill="transparent" />
                  <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#2DD4BF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">Event<span className="text-teal-300">Pulse</span></span>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-teal-200/80">Campus Events</span>
              </div>
            </div>

            <div className="pt-2 sm:pt-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                Welcome back to your campus hub
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
                Sign in to manage event passes, track upcoming campus workshops, and receive real-time notifications.
              </p>
            </div>
          </div>

          {/* Feature Highlights - visible on desktop/large screens, hidden on mobile for quick access */}
          <div className="relative z-10 my-6 lg:my-8 space-y-3.5 hidden lg:block">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Calendar className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Find Events</h4>
                <p className="text-[11px] text-blue-200/90 leading-snug">Explore academic, social, and cultural events across campus.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Users className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Meet People</h4>
                <p className="text-[11px] text-blue-200/90 leading-snug">Connect with students, staff and communities who share your interests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Bell className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Stay Updated</h4>
                <p className="text-[11px] text-blue-200/90 leading-snug">Get real-time updates and never miss what's happening.</p>
              </div>
            </div>
          </div>

          {/* Campus photo card at bottom - visible on desktop */}
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-black/20 hidden lg:block">
            <div className="relative h-24 w-full">
              <img 
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600" 
                alt="Campus community" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  Campus Event Hub & Community
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5 sm:space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered campus email and password to access your dashboard.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@campus.edu or admin"
                    className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Password
                  </label>
                  <Link 
                    to="/auth/reset-password" 
                    className="text-xs font-semibold text-blue-600 dark:text-teal-300 hover:underline py-1"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full pl-10 pr-11 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 font-medium py-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-navy-light text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] py-3.5 rounded-xl bg-[#0B2E81] hover:bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-900/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider 'or' */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-navy-light/40 w-full" />
                <span className="bg-white dark:bg-[#111A33] px-3 text-xs text-slate-400 absolute">or</span>
              </div>

              {/* Create account button */}
              <Link 
                to="/auth/register" 
                className="w-full min-h-[44px] py-3 rounded-xl border border-slate-200 dark:border-navy-light/60 text-center font-bold text-sm text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-navy-light/20 flex items-center justify-center transition-all"
              >
                Create account
              </Link>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
export default LoginPage;
