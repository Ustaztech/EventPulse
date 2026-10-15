import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';

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

export function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          {initialLoading && (
            <LoadingScreen 
              message="Initializing EventPulse Campus Hub..."
              isInitialBoot
              onFinish={() => setInitialLoading(false)}
            />
          )}
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-navy-dark dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Homepage is accessible only when logged out; authenticated users are routed to their dashboard */}
                <Route path="/" element={<HomePageOrDashboard />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/auth/login" element={<AuthPageOnly><LoginPage /></AuthPageOnly>} />
                {/* Unified login: /auth/admin-login redirects to /auth/login */}
                <Route path="/auth/admin-login" element={<Navigate to="/auth/login" replace />} />
                <Route path="/auth/register" element={<AuthPageOnly><RegisterPage /></AuthPageOnly>} />
                <Route path="/auth/verify" element={<VerifyEmailPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                
                {/* Dashboards with Role-Based Access Control */}
                <Route 
                  path="/dashboard/student" 
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/organizer" 
                  element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Notifications & Profile */}
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN']}>
                      <NotificationCenterPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ORGANIZER', 'ADMIN']}>
                      <ProfilePreferencesPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Info & Legal */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />

                {/* Explicit 404 Not Found Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
