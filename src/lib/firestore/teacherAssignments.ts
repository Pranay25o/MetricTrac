
// src/lib/firestore/teacherAssignments.ts
import { db } from '@/lib/firebase';
import type { TeacherSubjectAssignment } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';

const assignmentsCollection = collection(db, 'teacherAssignments');

export async function addTeacherAssignment(assignmentData: Omit<TeacherSubjectAssignment, 'id'>): Promise<string> {
  console.log("Firestore: addTeacherAssignment called with data:", assignmentData);
  const docRef = await addDoc(assignmentsCollection, {
    ...assignmentData,
    createdAt: serverTimestamp(),
  });
  console.log("Firestore: Assignment added with ID:", docRef.id);
  return docRef.id;
}

export async function getTeacherAssignments(filters?: { teacherUid?: string }): Promise<TeacherSubjectAssignment[]> {
  console.log("Firestore: getTeacherAssignments called with filters:", filters);
  let q;
  const conditions = [];
  let queryDescription = "teacherAssignments";
  let orderByClauses = [];

  if (filters && filters.teacherUid) {
    conditions.push(where('teacherUid', '==', filters.teacherUid));
    queryDescription += ` where teacherUid == ${filters.teacherUid}`;
    // When filtering by a specific teacher, order by semester then subject
    orderByClauses = [orderBy('semesterName', 'asc'), orderBy('subjectName', 'asc')];
    queryDescription += " orderBy semesterName asc, subjectName asc";
  } else {
    // Default view: order by teacher, then semester, then subject
    orderByClauses = [orderBy('teacherName', 'asc'), orderBy('semesterName', 'asc'), orderBy('subjectName', 'asc')];
    queryDescription += " orderBy teacherName asc, semesterName asc, subjectName asc";
  }
  
  if (conditions.length > 0) {
    q = query(assignmentsCollection, ...conditions, ...orderByClauses);
  } else {
    q = query(assignmentsCollection, ...orderByClauses);
  }
  
  console.log("Firestore: Executing query:", queryDescription);
  const querySnapshot = await getDocs(q);
  const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSubjectAssignment));
  console.log(`Firestore: getTeacherAssignments successfully fetched ${assignments.length} assignments.`);
  return assignments;
}


export async function getAssignmentsByTeacher(teacherUid: string): Promise<TeacherSubjectAssignment[]> {
  console.log("Firestore: getAssignmentsByTeacher called for teacherUid:", teacherUid);
  // Order by semester then subject for a specific teacher's view
  const q = query(assignmentsCollection, where('teacherUid', '==', teacherUid), orderBy('semesterName', 'asc'), orderBy('subjectName', 'asc'));
  console.log("Firestore: Executing query: teacherAssignments where teacherUid == ", teacherUid, "orderBy semesterName asc, subjectName asc");
  const querySnapshot = await getDocs(q);
  const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherSubjectAssignment));
  console.log(`Firestore: getAssignmentsByTeacher successfully fetched ${assignments.length} assignments for teacher ${teacherUid}.`);
  return assignments;
}


export async function updateTeacherAssignment(id: string, updates: Partial<TeacherSubjectAssignment>): Promise<void> {
  console.log("Firestore: updateTeacherAssignment called for ID:", id, "with updates:", updates);
  const assignmentDoc = doc(db, 'teacherAssignments', id);
  await updateDoc(assignmentDoc, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log("Firestore: Assignment updated successfully, ID:", id);
}

export async function deleteTeacherAssignment(id: string): Promise<void> {
  console.log("Firestore: deleteTeacherAssignment called for ID:", id);
  const assignmentDoc = doc(db, 'teacherAssignments', id);
  await deleteDoc(assignmentDoc);
  console.log("Firestore: Assignment deleted successfully, ID:", id);
}
