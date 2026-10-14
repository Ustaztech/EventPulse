import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { db } from './storage';

interface AuthContextType {
  currentUser: User | null;
  unreadCount: number;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (email: string, password: string, mfaCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    userType: 'STUDENT' | 'STAFF';
    matricOrStaffId?: string;
    department?: string;
    faculty?: string;
    phone?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const updateUnread = (userId: string) => {
    const notifs = db.getInAppNotifications(userId);
    setUnreadCount(notifs.filter(n => !n.isRead).length);
  };

  const refreshUserData = async () => {
    await db.syncFromBackend();
    const user = db.getCurrentUser();
    setCurrentUser(user);
    if (user) updateUnread(user.id);
  };

  useEffect(() => {
    db.init().then(() => {
      const user = db.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        updateUnread(user.id);
      }
    });
  }, []);

  const login = async (email: string, pass: string, rememberMe?: boolean) => {
    const res = await db.login(email, pass, rememberMe);
    if (res.user) {
      setCurrentUser(res.user);
      updateUnread(res.user.id);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const adminLogin = async (email: string, pass: string, mfaCode?: string) => {
    const res = await db.adminLogin(email, pass, mfaCode);
    if (res.user) {
      setCurrentUser(res.user);
      updateUnread(res.user.id);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setUnreadCount(0);
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    userType: 'STUDENT' | 'STAFF';
    matricOrStaffId?: string;
    department?: string;
    faculty?: string;
    phone?: string;
  }) => {
    const res = await db.registerUser(userData);
    if (res.user) {
      setCurrentUser(res.user);
      updateUnread(res.user.id);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error };
  };

  return (
    <AuthContext.Provider value={{ currentUser, unreadCount, login, adminLogin, logout, register, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
