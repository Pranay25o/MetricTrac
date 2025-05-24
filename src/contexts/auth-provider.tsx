// src/contexts/auth-provider.tsx
"use client";

import type { UserProfile, Role } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (role: Role) => void;
  logout: () => void;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUsers: Record<Role, UserProfile> = {
  admin: { id: 'admin001', email: 'admin@merittrac.com', name: 'Admin User', role: 'admin', avatarUrl: 'https://placehold.co/100x100.png' },
  teacher: { id: 'teacher001', email: 'teacher@merittrac.com', name: 'Teacher User', role: 'teacher', avatarUrl: 'https://placehold.co/100x100.png' },
  student: { id: 'student001', email: 'student@merittrac.com', name: 'Student User', role: 'student', prn: 'S12345', avatarUrl: 'https://placehold.co/100x100.png' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking auth status on load
    const storedRole = typeof window !== "undefined" ? localStorage.getItem('mockUserRole') as Role : null;
    if (storedRole && mockUsers[storedRole]) {
      setUser(mockUsers[storedRole]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/') {
        router.push('/');
      } else if (user && pathname === '/') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);


  const login = (role: Role) => {
    setLoading(true);
    const mockUser = mockUsers[role];
    if (mockUser) {
      setUser(mockUser);
      if (typeof window !== "undefined") localStorage.setItem('mockUserRole', role);
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const logout = () => {
    setLoading(true);
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem('mockUserRole');
    router.push('/');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, role: user?.role ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
