
// src/lib/firestore/teacherAssignments.ts
import { db } from '@/lib/firebase';
import type { TeacherSubjectAssignment } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';

const assignmentsCollection = collection(db, 'teacherAssignments');

export async function addTeacherAssignment(assignmentData: Omit<TeacherSubjectAssignment, 'id'>): Promise<string> {
  // Ensure names are populated before saving if they are part of the model
  // This might involve fetching teacher, subject, semester names based on their IDs if not provided
  const docRef = await addDoc(assignmentsCollection, {
    ...assignmentData,
    createdAt: serverTimestamp(),
  });
  console.log("Assignment added in Firestore with ID:", docRef.id);
  return docRef.id;
}

export async function getTeacherAssignments(filters?: { teacherUid?: string, subjectId?: string, semesterId?: string }): Promise<TeacherSubjectAssignment[]> {
  let q = query(assignmentsCollection, orderBy('teacherName', 'asc'), orderBy('subjectName', 'asc')); // Default sort

  if (filters) {
    const conditions = [];
    if (filters.teacherUid) conditions.push(where('teacherUid', '==', filters.teacherUid));
    if (filters.subjectId) conditions.push(where('subjectId', '==', filters.subjectId));
    if (filters.semesterId) conditions.push(where('semesterId', '==', filters.semesterId));
    
    if (conditions.length > 0) {
       q = query(assignmentsCollection, ...conditions, orderBy('teacherName', 'asc'), orderBy('subjectName', 'asc'));
    }
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSubjectAssignment));
}


export async function getAssignmentsByTeacher(teacherUid: string): Promise<TeacherSubjectAssignment[]> {
  const q = query(assignmentsCollection, where('teacherUid', '==', teacherUid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSubjectAssignment));
}


export async function updateTeacherAssignment(id: string, updates: Partial<TeacherSubjectAssignment>): Promise<void> {
  const assignmentDoc = doc(db, 'teacherAssignments', id);
  await updateDoc(assignmentDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log("Assignment updated in Firestore, ID:", id);
}

export async function deleteTeacherAssignment(id: string): Promise<void> {
  const assignmentDoc = doc(db, 'teacherAssignments', id);
  await deleteDoc(assignmentDoc);
  console.log("Assignment deleted from Firestore, ID:", id);
}

