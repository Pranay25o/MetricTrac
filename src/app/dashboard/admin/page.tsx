// src/app/dashboard/admin/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';

export default function AdminRootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/dashboard'); // Or login page if preferred
      } else {
        router.replace('/dashboard/admin/students'); // Default page for admin
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p>Loading admin section...</p>
    </div>
  );
}
