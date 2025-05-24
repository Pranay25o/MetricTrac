
// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { MeritTracLogo } from "@/components/icons/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function LoginPage() {
  const { loginUser, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Login Error", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await loginUser(email, password);
      // AuthProvider's onAuthStateChanged will handle redirect
    } catch (error: any) {
      // Error toast is handled by loginUser in AuthProvider
      setIsSubmitting(false);
    }
    // setIsSubmitting(false) will be handled by redirection or error in loginUser
  };
  
  // Show loading spinner if auth state is loading OR if already logged in and redirecting
  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-foreground">Loading MeritTrac...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <MeritTracLogo />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back!</CardTitle>
          <CardDescription>Log in to access your MeritTrac dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              Log In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MeritTrac. All rights reserved.</p>
      </footer>
    </div>
  );
}
