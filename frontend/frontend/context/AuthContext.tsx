'use client';

import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import authService from '@/lib/authService';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // ✅ خليها false على طول
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ✅ مؤقتاً: شيل التحقق من /auth/me
    // const checkAuth = async () => {
    //   try {
    //     const { data } = await authService.getCurrentUser();
    //     setUser(data.data);
    //   } catch {
    //     setUser(null);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authService.login({ email, password });
    setUser(data.data);
  };

  const register = async (name: string, email: string, password: string) => {
    await authService.register({ name, email, password });
    await login(email, password);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};