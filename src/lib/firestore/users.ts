
// src/lib/firestore/users.ts
import { db } from '@/lib/firebase';
import type { UserProfile, Role } from '@/lib/types';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';

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

export async function deleteUserFromFirestore(uid: string): Promise<void> {
  if (!uid) {
    const errorMessage = "UID is required to delete a user document.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  const userDocRef = doc(db, 'users', uid);
  try {
    await deleteDoc(userDocRef);
    console.log(`User document with UID ${uid} deleted successfully from Firestore.`);
  } catch (error) {
    console.error(`Error deleting user document ${uid} from Firestore:`, error);
    // Re-throw the error so it can be caught by the calling function and displayed to the user (e.g., via a toast)
    throw error; 
  }
}

// Individual user fetching is typically handled by AuthProvider or by UID directly.
// Example: export async function getUserById(uid: string): Promise<UserProfile | null> { ... }

