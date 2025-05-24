
// src/contexts/auth-provider.tsx
"use client";

import type { UserProfile, Role } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginUser: (email: string, pass: string) => Promise<void>;
  signupUser: (email: string, pass: string, name: string, role: Role, prn?: string) => Promise<void>;
  logout: () => void;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDocSnap.data() } as UserProfile);
          } else {
            // This case might happen if user exists in Auth but not Firestore.
            // Potentially log them out or prompt to complete profile.
            toast({ title: "Profile Error", description: "User profile not found. Please contact support.", variant: "destructive"});
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({ title: "Authentication Error", description: "Could not load user data.", variant: "destructive"});
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/' || pathname === '/signup';
      if (!user && !isAuthPage) {
        router.push('/');
      } else if (user && isAuthPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const loginUser = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user and redirecting
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) is handled by onAuthStateChanged or error case
  };

  const signupUser = async (email: string, pass: string, name: string, role: Role, prn?: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userProfileData: Omit<UserProfile, 'uid' | 'avatarUrl'> & { email: string } = {
        name,
        email: firebaseUser.email!, // Firebase provides email
        role,
      };
      if (role === 'student' && prn) {
        userProfileData.prn = prn;
      }
      // Add avatarUrl later if needed, e.g. default placeholder
      // userProfileData.avatarUrl = 'https://placehold.co/100x100.png';

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfileData);
      // onAuthStateChanged will handle setting user and redirecting
       toast({ title: "Account Created", description: "Welcome! You are now being redirected."});
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      setLoading(false);
    }
     // setLoading(false) is handled by onAuthStateChanged or error case
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, loginUser, signupUser, logout, role: user?.role ?? null }}>
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
