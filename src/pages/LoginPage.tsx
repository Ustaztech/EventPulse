import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Calendar, 
  Bell, 
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your email and password.');
      } else {
        navigate('/dashboard/student');
      }
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-navy-dark py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Main Dual-Column Container */}
      <div className="max-w-5xl w-full bg-white dark:bg-[#111A33] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left Branding & Institutional Showcase Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy-dark via-navy to-royal p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient decorative glowing backdrops */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-turquoise/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Section */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-turquoise tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-turquoise animate-pulse" />
              <span>NSUK Secure Portal Gateway</span>
            </div>

            <div className="space-y-2">
              <BrandLogo size="lg" isDark={true} showTagline={false} />
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                Nasarawa State University, Keffi
              </p>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-light">
              Stay synchronized with academic symposiums, faculty defenses, athletic championships, and tech bootcamps across all four NSUK campuses.
            </p>

            {/* Feature Highlights List */}
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-turquoise shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Centralized Campus Directory</p>
                  <p className="text-slate-300 text-[11px]">Real-time dates, faculty venues, and verified GPS map directions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Bell className="w-4 h-4 text-teal-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Automated Schedule Reminders</p>
                  <p className="text-slate-300 text-[11px]">Durable outbox dispatch 24 hours and 1 hour before session kickoff.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-royal-light shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Instant QR Admission Passes</p>
                  <p className="text-slate-300 text-[11px]">Digital admission credentials with entrance scanner verification.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Accreditation Badge */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-turquoise" />
              <span>256-bit Encrypted Session</span>
            </div>
            <span>v1.0.0 Production</span>
          </div>
        </div>

        {/* Right Authentication Form Column (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-royal dark:text-turquoise uppercase tracking-wider">
                  Campus Member Sign In
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  NSUK Portal &bull; Keffi
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your university email address and password to access your EventPulse portal.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:rose-300 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@nsuk.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 dark:placeholder-slate-500"
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
                    className="text-xs font-bold text-royal dark:text-turquoise hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-navy-light text-royal focus:ring-royal/30 cursor-pointer"
                  />
                  <span>Remember me on this campus workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-royal via-blue-700 to-teal hover:opacity-95 text-white font-bold text-sm shadow-md shadow-royal/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to EventPulse</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer & Registration Link */}
          <div className="pt-4 border-t border-slate-100 dark:border-navy-light/40 space-y-3 text-center text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Don’t have an EventPulse account?{' '}
              <Link to="/auth/register" className="font-bold text-royal dark:text-turquoise hover:underline">
                Create NSUK Student/Staff Account
              </Link>
            </p>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need help? Contact ICT Directorate at </span>
              <a href="mailto:helpdesk@nsuk.edu.ng" className="text-slate-600 dark:text-slate-300 font-semibold hover:underline">
                helpdesk@nsuk.edu.ng
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
