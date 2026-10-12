import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  GraduationCap, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Calendar,
  Sparkles,
  Phone,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { NSUK_FACULTIES } from '../lib/nsuk-data';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [matricOrStaffId, setMatricOrStaffId] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(NSUK_FACULTIES[0].name);
  const [selectedDepartment, setSelectedDepartment] = useState(NSUK_FACULTIES[0].departments[0]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentFacultyObj = NSUK_FACULTIES.find(f => f.name === selectedFaculty) || NSUK_FACULTIES[0];

  const handleFacultyChange = (newFac: string) => {
    setSelectedFaculty(newFac);
    const found = NSUK_FACULTIES.find(f => f.name === newFac);
    if (found && found.departments.length > 0) {
      setSelectedDepartment(found.departments[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the university terms of service to register.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Role cannot be self-assigned to ORGANIZER or ADMIN as per requirements
      const userRole = userType === 'STAFF' ? 'STAFF' : 'STUDENT';

      register({
        name,
        email,
        passwordHash: password,
        role: userRole,
        userType,
        matricOrStaffId,
        faculty: selectedFaculty,
        department: selectedDepartment,
        phone,
        avatarUrl: `https://images.unsplash.com/photo-${userType === 'STUDENT' ? '1539571696357-5a69c17a67c6' : '1580489944761-15a19d654956'}?w=150`
      });

      setIsLoading(false);
      navigate('/dashboard/student');
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-navy-dark py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Main Dual-Column Container */}
      <div className="max-w-5xl w-full bg-white dark:bg-[#111A33] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-navy-light/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        
        {/* Left Institutional Showcase Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy-dark via-navy to-royal p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient decorative glowing backdrops */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-turquoise/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Section */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-turquoise tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-turquoise animate-pulse" />
              <span>NSUK Member Registration</span>
            </div>

            <div className="space-y-2">
              <BrandLogo size="lg" isDark={true} showTagline={false} />
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                Nasarawa State University, Keffi
              </p>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-light">
              Join the official campus event network. Secure event seats, download scannable QR passes, and receive personalized notifications tailored to your faculty and department.
            </p>

            {/* Registration Benefits */}
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <GraduationCap className="w-4 h-4 text-turquoise shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Faculty-Targeted Notices</p>
                  <p className="text-slate-300 text-[11px]">Receive updates specific to your department or across all NSUK.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-teal-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">1-Click Calendar Sync (.ics)</p>
                  <p className="text-slate-300 text-[11px]">Sync booked symposiums to Google, Apple, or Outlook calendars.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-royal-light shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Verified University Identity</p>
                  <p className="text-slate-300 text-[11px]">Matriculation and staff authentication for official events.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-turquoise" />
              <span>Institutional Privacy Guaranteed</span>
            </div>
            <span>NSUK ICT Hub</span>
          </div>
        </div>

        {/* Right Registration Form Column (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-royal dark:text-turquoise uppercase tracking-wider">
                  New Account Registration
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  NSUK Portal &bull; Keffi
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Create Your Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your university credentials to get started with EventPulse.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:rose-300 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Account Type Selector Tabs */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 block">Affiliation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType('STUDENT')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      userType === 'STUDENT'
                        ? 'border-royal dark:border-turquoise bg-blue-50/90 dark:bg-royal/20 text-royal dark:text-turquoise shadow-xs ring-1 ring-royal dark:ring-turquoise'
                        : 'border-slate-200 dark:border-navy-light/40 bg-white dark:bg-[#0B132B] hover:bg-slate-50 dark:hover:bg-navy-light/20 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('STAFF')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      userType === 'STAFF'
                        ? 'border-royal dark:border-turquoise bg-blue-50/90 dark:bg-royal/20 text-royal dark:text-turquoise shadow-xs ring-1 ring-royal dark:ring-turquoise'
                        : 'border-slate-200 dark:border-navy-light/40 bg-white dark:bg-[#0B132B] hover:bg-slate-50 dark:hover:bg-navy-light/20 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Faculty Staff Profile</span>
                  </button>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ibrahim Musa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">University Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="musa@nsuk.edu.ng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>
              </div>

              {/* Matric/Staff ID & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">
                    {userType === 'STUDENT' ? 'Matriculation Number' : 'Staff Identification ID'}
                  </label>
                  <input
                    type="text"
                    value={matricOrStaffId}
                    onChange={(e) => setMatricOrStaffId(e.target.value)}
                    placeholder={userType === 'STUDENT' ? 'NSUK/CMP/2022/10492' : 'NSUK/STAFF/042'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-mono font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Faculty & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Faculty</label>
                  <select
                    value={selectedFaculty}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  >
                    {NSUK_FACULTIES.map((f) => (
                      <option key={f.name} value={f.name} className="dark:bg-navy-dark">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-xs bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  >
                    {currentFacultyObj.departments.map((d) => (
                      <option key={d} value={d} className="dark:bg-navy-dark">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-navy-light text-royal focus:ring-royal/30 cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" target="_blank" className="font-bold text-royal dark:text-turquoise hover:underline">
                      NSUK Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="font-bold text-royal dark:text-turquoise hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer & Login Link */}
          <div className="pt-4 border-t border-slate-100 dark:border-navy-light/40 space-y-3 text-center text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-bold text-royal dark:text-turquoise hover:underline">
                Sign In to Your Account
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
export default RegisterPage;
