
// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { MeritTracLogo } from "@/components/icons/logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; 
import { useEffect, useState } from "react";
import { Loader2, LogIn, AlertCircle } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 

export default function LoginPage() {
  const { loginUser, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageAlert, setPageAlert] = useState<{ title: string, description: string, variant?: "default" | "destructive" } | null>(null);

  useEffect(() => {
    const messageCode = searchParams.get('auth_message');
    if (messageCode === 'admin_only_logout') { // This specific message might become obsolete with general login
      setPageAlert({
        title: "Logged Out",
        description: "You have been logged out. Please log in again if you wish to continue."
      });
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

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
    setPageAlert(null); 
    try {
      await loginUser(email, password);
    } catch (error: any) {
      // Errors are typically handled within loginUser and shown as toasts
    } finally {
      setIsSubmitting(false); 
    }
  };
  
  if (loading || (!loading && user && !pageAlert)) { 
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
          {pageAlert && (
            <Alert 
              variant={pageAlert.variant || "default"} 
              className={`mb-4 ${pageAlert.variant === "destructive" ? 
                "border-destructive bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive" : 
                "border-yellow-400 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300"}`}
            >
              <AlertCircle className="h-4 w-4" /> 
              <AlertTitle className="font-semibold">{pageAlert.title}</AlertTitle>
              <AlertDescription>
                {pageAlert.description}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" // Changed placeholder
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isSubmitting || loading}
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
                disabled={isSubmitting || loading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || loading}>
              {(isSubmitting || loading) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
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
