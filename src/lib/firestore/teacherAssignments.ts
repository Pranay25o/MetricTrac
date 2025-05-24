
// src/lib/firestore/teacherAssignments.ts
import { db } from '@/lib/firebase';
import type { TeacherSubjectAssignment } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';

const assignmentsCollection = collection(db, 'teacherAssignments');

export async function addTeacherAssignment(assignmentData: Omit<TeacherSubjectAssignment, 'id'>): Promise<string> {
  const docRef = await addDoc(assignmentsCollection, {
    ...assignmentData,
    createdAt: serverTimestamp(),
  });
  console.log("Assignment added in Firestore with ID:", docRef.id);
  return docRef.id;
}

export async function getTeacherAssignments(filters?: { teacherUid?: string, subjectId?: string, semesterId?: string }): Promise<TeacherSubjectAssignment[]> {
  let q;
  const conditions = [];

  if (filters) {
    if (filters.teacherUid) conditions.push(where('teacherUid', '==', filters.teacherUid));
    if (filters.subjectId) conditions.push(where('subjectId', '==', filters.subjectId));
    if (filters.semesterId) conditions.push(where('semesterId', '==', filters.semesterId));
  }
  
  if (conditions.length > 0) {
    // If specific ID filters are applied, fetch based on those.
    // Sorting by denormalized names here can create many complex index requirements.
    // Consider client-side sorting or specific indexes if server-side sort is vital for these filtered views.
    // A default sort by teacherName is still applied for consistency within the filtered set if not further specified.
    // This means an index on (e.g.) teacherUid, teacherName, subjectName would be optimal.
    q = query(assignmentsCollection, ...conditions, orderBy('teacherName', 'asc'), orderBy('subjectName', 'asc'));
  } else {
    // Default sort when no filters are applied. Requires an index on teacherName (asc), subjectName (asc).
    q = query(assignmentsCollection, orderBy('teacherName', 'asc'), orderBy('subjectName', 'asc'));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSubjectAssignment));
}


export async function getAssignmentsByTeacher(teacherUid: string): Promise<TeacherSubjectAssignment[]> {
  // Requires an index on teacherUid (asc), and likely sub-sorted if needed.
  // For now, just fetching by teacherUid without additional sorting.
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
