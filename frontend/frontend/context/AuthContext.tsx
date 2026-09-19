'use client';

import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import authService from '@/lib/authService';

// ==========================================
// 1. تعريف الـ Types
// ==========================================
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ==========================================
// 2. الـ Provider
// ==========================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // ✅ التحقق من المستخدم عند فتح التطبيق (مرة واحدة بس)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data } = await authService.getCurrentUser();
        if (mounted) setUser(data.data);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ تسجيل الدخول
  const login = async (email: string, password: string) => {
    const { data } = await authService.login({ email, password });
    setUser(data.data);
  };

  // ✅ تسجيل حساب جديد
  const register = async (name: string, email: string, password: string) => {
    await authService.register({ name, email, password });
    await login(email, password);
  };

  // ✅ تسجيل الخروج
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // تجاهلي الخطأ
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};