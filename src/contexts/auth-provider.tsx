
// src/contexts/auth-provider.tsx
"use client";

import type { UserProfile, Role } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, type User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginUser: (email: string, pass: string) => Promise<void>;
  signupUser: (email: string, pass: string, name: string, role: Role, prn?: string) => Promise<void>;
  logout: () => void;
  role: Role | null;
}

const ADMIN_EMAIL = "admin@pescoe.com"; // Defined admin email

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
            const userData = userDocSnap.data();
            // Special check for the main login page if a non-admin tries to use it
            if (pathname === '/' && userData.email !== ADMIN_EMAIL && firebaseUser.email !== ADMIN_EMAIL) {
              // No toast here, rely on query param message on LoginPage
              await signOut(auth); 
              setUser(null);
              setLoading(false); 
              router.push('/?auth_message=admin_only_logout', { scroll: false }); // Add query param
              return; // IMPORTANT: return here to prevent further processing
            }
            setUser({ uid: firebaseUser.uid, ...userData } as UserProfile);
          } else {
            toast({ title: "Profile Error", description: "User profile not found. Logging out.", variant: "destructive"});
            await signOut(auth);
            setUser(null);
            setLoading(false); // Ensure loading is set to false
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({ title: "Authentication Error", description: "Could not load user data. Logging out.", variant: "destructive"});
          await signOut(auth);
          setUser(null);
          setLoading(false); // Ensure loading is set to false
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // Removed toast from deps as it's stable

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/' || pathname === '/signup';
      if (!user && !isAuthPage) {
        router.push('/');
      } else if (user && isAuthPage) {
        // If user is already logged in and is on an auth page (e.g. /signup),
        // redirect to dashboard.
        // The case for non-admin on '/' is handled by onAuthStateChanged.
        if (pathname !== '/' || user.email === ADMIN_EMAIL) { // Allow admin to be on '/' briefly if needed
          router.push('/dashboard');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, pathname, router]);

  const loginUser = async (email: string, pass: string) => {
    setLoading(true);
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast({ title: "Login Failed", description: "This login portal is for admin users only.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user.
      // Successful login will redirect to dashboard via the useEffect above.
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Invalid admin email or password.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid admin credentials. Please check email and password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access temporarily disabled due to too many failed login attempts. Please try again later.";
      } else {
        errorMessage = error.message || "An unexpected error occurred during login.";
      }
      toast({ title: "Admin Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false);
    }
  };

  const signupUser = async (email: string, pass: string, name: string, role: Role, prn?: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userProfileData: Omit<UserProfile, 'uid' | 'avatarUrl'> & { email: string; createdAt: any } = {
        name,
        email: firebaseUser.email!,
        role,
        createdAt: serverTimestamp(),
      };
      if (role === 'student' && prn) {
        userProfileData.prn = prn;
      }
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfileData);
      toast({ title: "Account Created", description: "Welcome! Redirecting to dashboard..."});
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Could not create account.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use. Please try a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please use a stronger password (at least 6 characters).";
      } else {
        errorMessage = error.message || "An unexpected error occurred during signup.";
      }
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) is handled by onAuthStateChanged or error catch
  };

  const logout = async () => {
    const wasUserLoggedIn = !!user; // Check if user was logged in before calling signOut
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      if (wasUserLoggedIn) { // Only show toast if a user was actually logged in and initiated logout
         toast({ title: "Logged Out", description: "You have been successfully logged out."});
      }
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    } finally {
       setLoading(false);
    }
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
