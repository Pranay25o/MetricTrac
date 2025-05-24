
// src/lib/firestore/semesters.ts
import { db } from '@/lib/firebase';
import type { Semester } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const semestersCollection = collection(db, 'semesters');

export async function addSemester(semesterData: Omit<Semester, 'id'>): Promise<string> {
  const docRef = await addDoc(semestersCollection, {
    ...semesterData,
    createdAt: serverTimestamp(), // Optional: for tracking creation time
  });
  return docRef.id;
}

export async function getSemesters(): Promise<Semester[]> {
  const q = query(semestersCollection, orderBy('year', 'desc'), orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester));
}

export async function updateSemester(id: string, updates: Partial<Semester>): Promise<void> {
  const semesterDoc = doc(db, 'semesters', id);
  await updateDoc(semesterDoc, {
    ...updates,
    updatedAt: serverTimestamp(), // Optional: for tracking update time
  });
}

export async function deleteSemester(id: string): Promise<void> {
  const semesterDoc = doc(db, 'semesters', id);
  await deleteDoc(semesterDoc);
}
