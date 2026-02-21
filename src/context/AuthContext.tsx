import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (codigo: string) => boolean;
  isAdmin: boolean;
  isBodega: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await auth.me();
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await auth.login(email, password);
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (codigo: string): boolean => {
    if (!user) return false;
    if (user.rol === 'administrador') return true;
    return Boolean(user.permisos?.includes(codigo));
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    hasPermission,
    isAdmin: user?.rol === 'administrador',
    isBodega: user?.rol === 'encargado_bodega' || user?.rol === 'administrador',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
