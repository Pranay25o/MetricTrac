
// src/lib/firestore/users.ts
import { db } from '@/lib/firebase';
import type { UserProfile, Role } from '@/lib/types';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const usersCollection = collection(db, 'users');

export async function getUsers(role?: Role): Promise<UserProfile[]> {
  let q;
  if (role) {
    q = query(usersCollection, where('role', '==', role), orderBy('name', 'asc'));
  } else {
    q = query(usersCollection, orderBy('name', 'asc'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

// Individual user fetching is typically handled by AuthProvider or by UID directly.
// Example: export async function getUserById(uid: string): Promise<UserProfile | null> { ... }
