
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

// const ADMIN_EMAIL = "admin@pescoe.com"; // No longer needed for login restriction here

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthProvider] useEffect for onAuthStateChanged running. Pathname:', pathname);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[AuthProvider] onAuthStateChanged triggered. Firebase user present:', !!firebaseUser);
      if (firebaseUser) {
        console.log('[AuthProvider] Firebase user UID:', firebaseUser.uid, 'Email:', firebaseUser.email);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          console.log('[AuthProvider] Firestore user document exists for UID ' + firebaseUser.uid + '?', userDocSnap.exists());

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as Omit<UserProfile, 'uid'>;
            console.log('[AuthProvider] User data from Firestore:', userData);
            setUser({ uid: firebaseUser.uid, ...userData } as UserProfile);
            console.log('[AuthProvider] User profile set in context:', { uid: firebaseUser.uid, ...userData });
          } else {
            console.log('[AuthProvider] User profile NOT FOUND in Firestore for UID:', firebaseUser.uid, '. Logging out.');
            toast({ title: "Profile Error", description: "User profile not found in database. Please contact support if this persists. Logging out.", variant: "destructive"});
            await signOut(auth);
            setUser(null); 
            // setLoading(false) will be handled by the subsequent onAuthStateChanged(null)
          }
        } catch (error) {
          console.error("[AuthProvider] Error fetching user profile:", error);
          toast({ title: "Authentication Error", description: "Could not load user data. Logging out.", variant: "destructive"});
          await signOut(auth);
          setUser(null);
        } finally {
          if (auth.currentUser) { 
             setLoading(false);
             console.log('[AuthProvider] setLoading(false) in onAuthStateChanged firebaseUser branch (finally).');
          }
        }
      } else { 
        console.log('[AuthProvider] No firebaseUser. Setting user to null and loading to false.');
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('[AuthProvider] Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); 

  useEffect(() => {
    if (!loading) { 
      const isAuthPage = pathname === '/' || pathname === '/signup';
      console.log('[AuthProvider] Redirection check. loading:', loading, 'user:', !!user, 'isAuthPage:', isAuthPage, 'pathname:', pathname);

      if (!user && !isAuthPage) {
        console.log('[AuthProvider] No user and not on auth page. Redirecting to /.');
        router.push('/');
      } else if (user && isAuthPage) {
        console.log('[AuthProvider] User logged in and on auth page. Redirecting to /dashboard.');
        router.push('/dashboard');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, pathname, router]);

  const loginUser = async (email: string, pass: string) => {
    console.log('[AuthProvider] loginUser attempt for email:', email);
    setLoading(true);
    // Removed admin-only email check to make login page general
    // if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    //   toast({ title: "Login Failed", description: "This login portal is for admin users only.", variant: "destructive" });
    //   setLoading(false);
    //   console.log('[AuthProvider] loginUser: Non-admin email attempt.');
    //   return;
    // }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log('[AuthProvider] loginUser: signInWithEmailAndPassword successful. onAuthStateChanged will handle profile.');
      // onAuthStateChanged will handle setting user and setLoading(false) after profile fetch.
    } catch (error: any) {
      console.error("Login error details:", error);
      let errorMessage = "Invalid email or password.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please check email and password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access temporarily disabled due to too many failed login attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
       else {
        errorMessage = error.message || "An unexpected error occurred during login.";
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); 
      console.log('[AuthProvider] loginUser: Error during signInWithEmailAndPassword. setLoading(false).', error.code);
    }
  };

  const signupUser = async (email: string, pass: string, name: string, role: Role, prn?: string) => {
    console.log('[AuthProvider] signupUser attempt for email:', email, 'role:', role);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      console.log('[AuthProvider] signupUser: Firebase user created in Auth:', firebaseUser.uid);
      
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
      console.log('[AuthProvider] signupUser: Firestore user profile created for UID:', firebaseUser.uid);
      toast({ title: "Account Created", description: "Welcome! Redirecting to dashboard..."});
    } catch (error: any) {
      console.error("Signup error details:", error);
      let errorMessage = "Could not create account.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use. Please try a different email or log in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please use a stronger password (at least 6 characters).";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else {
        errorMessage = error.message || "An unexpected error occurred during signup.";
      }
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      setLoading(false); 
      console.log('[AuthProvider] signupUser: Error during signup. setLoading(false).', error.code);
    }
  };

  const logout = async () => {
    const wasUserLoggedIn = !!user;
    console.log('[AuthProvider] logout initiated. Was user logged in:', wasUserLoggedIn);
    try {
      await signOut(auth);
      if (wasUserLoggedIn) {
         toast({ title: "Logged Out", description: "You have been successfully logged out."});
      }
      router.push('/'); 
    } catch (error) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    } finally {
       console.log('[AuthProvider] logout: signOut attempt finished.');
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
