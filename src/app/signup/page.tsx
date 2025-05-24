
// src/app/signup/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-provider";
import type { Role } from "@/lib/types";
import { MeritTracLogo } from "@/components/icons/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const { signupUser, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [prn, setPrn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !role) {
      toast({ title: "Signup Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Signup Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (role === 'student' && !prn) {
      toast({ title: "Signup Error", description: "PRN is required for students.", variant: "destructive" });
      return;
    }
    // Admin role should not be selectable from public signup
    if (role === 'admin') {
        toast({ title: "Signup Error", description: "Cannot create admin account from this page.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      await signupUser(email, password, name, role as Role, role === 'student' ? prn : undefined);
      // AuthProvider's onAuthStateChanged will handle redirect after successful signup
    } catch (error: any) {
      // Error toast is handled by signupUser in AuthProvider
      // setIsSubmitting(false); // This will be set by the effect or if an error isn't caught by signupUser
    } finally {
      // Ensure isSubmitting is reset if signupUser completes (even with an internal error toast)
      // or if redirection doesn't happen immediately.
      setIsSubmitting(false);
    }
  };

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
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <MeritTracLogo />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Join MeritTrac to manage and track academic performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} placeholder="John Doe" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role | "")} required disabled={isSubmitting}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  {/* Admin role intentionally removed from public signup */}
                </SelectContent>
              </Select>
            </div>
            {role === 'student' && (
              <div>
                <Label htmlFor="prn">PRN (Permanent Registration Number)</Label>
                <Input id="prn" value={prn} onChange={(e) => setPrn(e.target.value)} required disabled={isSubmitting} placeholder="S12345" />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Log in
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
