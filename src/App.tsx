import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage, ResetPasswordPage } from './pages/AuthAuxPages';
import { StudentDashboard } from './pages/StudentDashboard';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { ProfilePreferencesPage } from './pages/ProfilePreferencesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage, TermsPage, UnsubscribePage } from './pages/LegalPages';
import { NotFoundPage } from './pages/NotFoundPage';

import { useAuth } from './lib/AuthContext';
import { getDefaultDashboardRoute } from './lib/rbac';

// Redirect authenticated users to their dashboard (users can only access homepage when logged out)
function HomePageOrDashboard() {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to={getDefaultDashboardRoute(currentUser)} replace />;
  }
  return <HomePage />;
}

// Redirect authenticated users away from auth pages to their dashboard
function AuthPageOnly({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to={getDefaultDashboardRoute(currentUser)} replace />;
  }
  return <>{children}</>;
}

function DashboardHomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={getDefaultDashboardRoute(currentUser)} replace />;
}

function AppContent() {
  const { isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 dark:bg-navy-dark dark:text-slate-200" role="status" aria-live="polite">
        <span>Loading your account…</span>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-navy-dark dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePageOrDashboard />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/events/:slug" element={<EventDetailsPage />} />
          <Route path="/auth/login" element={<AuthPageOnly><LoginPage /></AuthPageOnly>} />
          <Route path="/auth/admin-login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/register" element={<AuthPageOnly><RegisterPage /></AuthPageOnly>} />
          <Route path="/auth/verify" element={<VerifyEmailPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardHomeRedirect />} />
          <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/organizer" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}><OrganizerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}><NotificationCenterPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']}><ProfilePreferencesPage /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
