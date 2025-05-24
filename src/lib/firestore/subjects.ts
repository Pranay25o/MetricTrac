
// src/lib/firestore/subjects.ts
import { db } from '@/lib/firebase';
import type { Subject } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const subjectsCollection = collection(db, 'subjects');

export async function addSubject(subjectData: Omit<Subject, 'id'>): Promise<string> {
  const docRef = await addDoc(subjectsCollection, {
    ...subjectData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSubjects(): Promise<Subject[]> {
  const q = query(subjectsCollection, orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<void> {
  const subjectDoc = doc(db, 'subjects', id);
  await updateDoc(subjectDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSubject(id: string): Promise<void> {
  const subjectDoc = doc(db, 'subjects', id);
  await deleteDoc(subjectDoc);
}
