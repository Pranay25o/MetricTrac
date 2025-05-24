// src/app/dashboard/student/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';

export default function StudentRootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'student') {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard/student/my-marks');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p>Loading student section...</p>
    </div>
  );
}
