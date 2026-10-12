import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';

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

export function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        {initialLoading && (
          <LoadingScreen 
            message="Connecting to NSUK Event Hub..."
            isInitialBoot
            onFinish={() => setInitialLoading(false)}
          />
        )}
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-navy-dark dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/verify" element={<VerifyEmailPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                
                {/* Dashboards */}
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                
                {/* Notifications & Profile */}
                <Route path="/notifications" element={<NotificationCenterPage />} />
                <Route path="/profile" element={<ProfilePreferencesPage />} />
                
                {/* Info & Legal */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
