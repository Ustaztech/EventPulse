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
  GraduationCap,
  Briefcase,
  Calendar,
  Users,
  Bell,
  Landmark,
  ChevronDown
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
  const [department, setDepartment] = useState('');
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
    'Political Science',
    'Biochemistry',
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
        department: department.trim() || 'Computer Science',
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
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 dark:bg-navy-dark transition-colors flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-[#111A33] rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[700px]">
        
        {/* Left Hero Column - Exact Match to Image 1 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0F172A] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative background blur and curved shapes */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Top Logo & Tag */}
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
              <div>
                <span className="text-xl font-black tracking-tight text-white block">EventPulse</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 block">NSUK CAMPUS EVENTS :</span>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Join your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                  campus community
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90 font-normal leading-relaxed">
                Discover events, meet people, and make the most of your NSUK experience with EventPulse.
              </p>
            </div>
          </div>

          {/* 3 Circular Feature Items Matching Image 1 */}
          <div className="relative z-10 my-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Find Events</h4>
                <p className="text-[11px] text-blue-100/80 leading-snug">Explore academic, social, and cultural events across campus.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Meet People</h4>
                <p className="text-[11px] text-blue-100/80 leading-snug">Connect with students, staff and communities who share your interests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Stay Updated</h4>
                <p className="text-[11px] text-blue-100/80 leading-snug">Get real-time updates and never miss what's happening at NSUK.</p>
              </div>
            </div>
          </div>

          {/* Bottom NSUK Gate Image with curved cyan wave - Matching Image 1 */}
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/20 shadow-lg mt-2 group">
            <div className="relative h-28 sm:h-32 w-full">
              <img 
                src="/assets/nsuk_gate.jpg" 
                alt="Nasarawa State University Keffi Entrance Gate" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Cyan decorative bottom wave overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent" />
              <div className="absolute -bottom-1 -left-2 w-28 h-10 bg-teal-400/50 rounded-tr-full blur-sm" />
            </div>
          </div>
        </div>

        {/* Right Form Column - Exact Match to Image 1 */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Join EventPulse and be part of the NSUK campus community.
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
              
              {/* Role Selector Matching Image 1: Side-by-side Student & Staff Pills */}
              <div className="grid grid-cols-2 gap-3">
                {/* Student Pill */}
                <button
                  type="button"
                  onClick={() => setUserType('STUDENT')}
                  className={`p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border ${
                    userType === 'STUDENT'
                      ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-navy-light/60 hover:border-slate-300 bg-white dark:bg-[#0B132B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      userType === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Student</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">I'm a student at NSUK</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1 ${
                    userType === 'STUDENT' ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {userType === 'STUDENT' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                </button>

                {/* Staff Pill */}
                <button
                  type="button"
                  onClick={() => setUserType('STAFF')}
                  className={`p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border ${
                    userType === 'STAFF'
                      ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-navy-light/60 hover:border-slate-300 bg-white dark:bg-[#0B132B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      userType === 'STAFF' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-navy-light/40 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">Staff</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">I'm a staff member at NSUK</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1 ${
                    userType === 'STAFF' ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {userType === 'STAFF' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
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
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@nsuk.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Department Dropdown Matching Image 1 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Department
                </label>
                <div className="relative">
                  <Landmark className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium appearance-none cursor-pointer transition-all"
                    required
                  >
                    <option value="" disabled>Select your department</option>
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    placeholder="Create a password"
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

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-11 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#terms" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">Privacy Policy</a>
                  </span>
                </label>
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
export default RegisterPage;
