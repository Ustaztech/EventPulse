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
import { AdminLoginPage } from './pages/AdminLoginPage';
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
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/admin-login" element={<AdminLoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
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
