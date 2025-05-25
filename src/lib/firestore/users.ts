
// src/lib/firestore/users.ts
import { db } from '@/lib/firebase';
import type { UserProfile, Role } from '@/lib/types';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const usersCollection = collection(db, 'users');

export async function getUsers(role?: Role): Promise<UserProfile[]> {
  let q;
  if (role) {
    console.log("Firestore: getUsers called with role:", role);
    q = query(usersCollection, where('role', '==', role), orderBy('name', 'asc'));
  } else {
    console.log("Firestore: getUsers called (all roles)");
    q = query(usersCollection, orderBy('name', 'asc'));
  }
  console.log("Firestore: Executing query for getUsers:", q.type);
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  console.log(`Firestore: getUsers successfully fetched ${users.length} users.`);
  return users;
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
  if (!uid) {
    const errorMessage = "UID is required to delete a user document.";
    console.error("Firestore: deleteUserFromFirestore error -", errorMessage);
    throw new Error(errorMessage);
  }
  const userDocRef = doc(db, 'users', uid);
  try {
    await deleteDoc(userDocRef);
    console.log(`Firestore: User document with UID ${uid} deleted successfully from Firestore.`);
  } catch (error) {
    console.error(`Firestore: Error deleting user document ${uid} from Firestore:`, error);
    throw error; 
  }
}

export async function updateUserFirestoreDetails(uid: string, updates: Partial<Pick<UserProfile, 'name' | 'prn'>>): Promise<void> {
  if (!uid) {
    const errorMessage = "UID is required to update user details.";
    console.error("Firestore: updateUserFirestoreDetails error -", errorMessage);
    throw new Error(errorMessage);
  }
  if (Object.keys(updates).length === 0) {
    console.warn("Firestore: updateUserFirestoreDetails called with no updates for UID:", uid);
    return; // No actual updates to make
  }
  const userDocRef = doc(db, 'users', uid);
  try {
    const updatePayload: any = { ...updates, updatedAt: serverTimestamp() };
    // Ensure PRN is not accidentally set to undefined if not provided for a role that doesn't use it
    if (updates.prn === undefined && !('prn' in updates)) {
      // If prn is not in updates, don't touch it. 
      // If prn is explicitly set to undefined in updates, it will be set to undefined/removed by Firestore.
    }


    await updateDoc(userDocRef, updatePayload);
    console.log(`Firestore: User document with UID ${uid} updated successfully with:`, updates);
  } catch (error) {
    console.error(`Firestore: Error updating user document ${uid} in Firestore:`, error);
    throw error;
  }
}


// Individual user fetching is typically handled by AuthProvider or by UID directly.
// Example: export async function getUserById(uid: string): Promise<UserProfile | null> { ... }

