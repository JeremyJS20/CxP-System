import { createContext, useEffect, useState, ReactNode } from 'react';

function decodeJwtPayload(token: string) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(atob(padded));
}

function isTokenValid(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    return payload.exp * 1000 >= Date.now();
  } catch {
    return false;
  }
}

function readStoredToken(): string | null {
  const t = localStorage.getItem('token');
  return t && isTokenValid(t) ? t : null;
}

function readStoredUser(token: string | null): User | null {
  const u = localStorage.getItem('user');
  if (!u || !token) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<User | null>(() => readStoredUser(readStoredToken()));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = localStorage.getItem('token');
      if (t && !isTokenValid(t)) logout();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: token !== null }}>
      {children}
    </AuthContext.Provider>
  );
}