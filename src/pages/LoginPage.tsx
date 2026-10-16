import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
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
      const res = await login(email.trim(), password, rememberMe);
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
      <div className="w-full max-w-5xl bg-white dark:bg-[#111A33] rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[640px]">
        
        {/* Left Hero Column - Exact Match to Image 3 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0F172A] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Branding Matching Image 3 */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="14" y="17" width="72" height="72" rx="18" stroke="#FFFFFF" strokeWidth="8" fill="transparent" />
                  <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#2DD4BF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">EventPulse</span>
                <span className="text-xs font-black uppercase tracking-wider text-teal-300">NSUK</span>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Stay Connected.
                <span className="block text-teal-300">Never Miss an Event.</span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90 font-normal leading-relaxed">
                Discover campus events, join vibrant communities and make the most of your NSUK experience.
              </p>
            </div>
          </div>

          {/* 3D Floating Calendar Card Graphic - Exact Match to Image 3 */}
          <div className="relative z-10 my-4 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-blue-950/40 backdrop-blur-sm group">
            <div className="relative h-48 sm:h-56 w-full flex items-center justify-center">
              <img 
                src="/assets/calendar_3d.jpg" 
                alt="EventPulse 3D Calendar and Campus Events" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Footer note in left column */}
          <div className="relative z-10 text-[11px] text-blue-200/80">
            Nasarawa State University, Keffi &bull; Campus Hub
          </div>
        </div>

        {/* Right Form Column - Exact Match to Image 3 */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Eyebrow and EventPulse Logo matching Image 3 */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block">
                WELCOME TO
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 p-1.5 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                    <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#1D4ED8" />
                    <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#1D4ED8" />
                    <rect x="14" y="17" width="72" height="72" rx="18" stroke="#1D4ED8" strokeWidth="8" fill="transparent" />
                    <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#0D9488" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">EventPulse</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">NSUK</span>
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Access your events, communities and more.
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@nsuk.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
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

              {/* Remember Me and Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <Link 
                  to="/auth/reset-password" 
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] py-3.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 active:scale-[0.99]"
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
                <span className="bg-white dark:bg-[#111A33] px-3 text-xs text-slate-400 absolute font-medium">or</span>
              </div>

              {/* Create account outline button */}
              <Link 
                to="/auth/register" 
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-center font-bold text-sm text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-navy-light/20 flex items-center justify-center transition-all"
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
