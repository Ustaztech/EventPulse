import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from './types';
import { db } from './storage';

interface AuthContextType {
  currentUser: User | null;
  unreadCount: number;
  login: (email: string, passwordHash: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>) => User;
  switchRole: (role: Role) => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    db.init();
    return db.getCurrentUser();
  });
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    const user = db.getCurrentUser();
    if (!user) return 0;
    const notifs = db.getInAppNotifications(user.id);
    return notifs.filter(n => !n.isRead).length;
  });

  useEffect(() => {
    db.init();
    const user = db.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      updateUnread(user.id);
    }
  }, []);

  const updateUnread = (userId: string) => {
    const notifs = db.getInAppNotifications(userId);
    setUnreadCount(notifs.filter(n => !n.isRead).length);
  };

  const login = (email: string, pass: string) => {
    const res = db.login(email, pass);
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

  const register = (userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>) => {
    const user = db.registerUser(userData);
    setCurrentUser(user);
    updateUnread(user.id);
    return user;
  };

  const switchRole = (role: Role) => {
    const users = db.getUsers();
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      db.setCurrentUser(targetUser);
      setCurrentUser(targetUser);
      updateUnread(targetUser.id);
    }
  };

  const refreshUserData = () => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    if (user) updateUnread(user.id);
  };

  return (
    <AuthContext.Provider value={{ currentUser, unreadCount, login, logout, register, switchRole, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
