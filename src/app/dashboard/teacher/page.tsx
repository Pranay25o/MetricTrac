// src/app/dashboard/teacher/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';

export default function TeacherRootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
     if (!loading) {
      if (!user || user.role !== 'teacher') {
        router.replace('/dashboard'); 
      } else {
        router.replace('/dashboard/teacher/manage-marks');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p>Loading teacher section...</p>
    </div>
  );
}
