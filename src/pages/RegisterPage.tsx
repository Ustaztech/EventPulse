import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  Calendar,
  Users,
  Bell
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getDefaultDashboardRoute } from '../lib/rbac';

export const RegisterPage: React.FC = () => {
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate(getDefaultDashboardRoute(currentUser), { replace: true });
    }
  }, [currentUser, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [matricOrStaffId, setMatricOrStaffId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const departmentsList = [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Business Administration',
    'Mass Communication',
    'Economics',
    'Biological Sciences',
    'Law & Legal Studies',
    'Accounting',
    'General Studies'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        userType,
        matricOrStaffId: matricOrStaffId.trim() || undefined,
        department: department.trim() || 'General Academic',
      });

      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      } else {
        navigate(`/auth/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error occurred during registration.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 dark:bg-navy-dark transition-colors flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111A33] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* Left Hero Column matching Image 5 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Tag */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
                  <rect x="14" y="17" width="72" height="72" rx="18" stroke="#FFFFFF" strokeWidth="8" fill="transparent" />
                  <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#2DD4BF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">Event<span className="text-teal-300">Pulse</span></span>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-teal-200/80">Campus Events</span>
              </div>
            </div>

            <div className="pt-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Join your campus community
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
                Discover events, meet people, and make the most of your campus experience with EventPulse.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 my-8 space-y-4">
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

          {/* Campus photo card at bottom */}
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-black/20">
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

        {/* Right Form Column matching Image 5 */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Join EventPulse and be part of the campus community.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Account Type Selector matching Image 5 cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('STUDENT')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                    userType === 'STUDENT'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    userType === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Student</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">I'm a student</span>
                  </div>
                  {userType === 'STUDENT' && (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('STAFF')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                    userType === 'STAFF'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    userType === 'STAFF' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">Staff</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">I'm a staff member</span>
                  </div>
                  {userType === 'STAFF' && (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@campus.edu or email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-all appearance-none cursor-pointer"
                  >
                    {departmentsList.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-navy-light text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    I agree to the <Link to="/terms" className="text-blue-600 dark:text-teal-300 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 dark:text-teal-300 font-semibold hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              {/* Create Account Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Login Link */}
            <div className="pt-1 text-center text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-bold text-blue-600 dark:text-teal-300 hover:underline">
                Sign in
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default RegisterPage;
