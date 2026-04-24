import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { setAuthToken } from '@/services/api';
import { loginApi, registerApi } from '@/services/storeApi';
import type { User } from '@/types/domain';

type AuthContextType = {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (identifier: string, password: string) => {
    const res = await loginApi(identifier, password);
    setUser(res.user);
    setAuthToken(res.token ?? null);
  };

  const signup = async (username: string, email: string, password: string) => {
    const res = await registerApi(username, email, password);
    setUser(res.user);
    setAuthToken(res.token ?? null);
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
