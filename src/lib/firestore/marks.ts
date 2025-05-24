
// src/lib/firestore/marks.ts
import { db } from '@/lib/firebase';
import type { Mark } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, Timestamp, writeBatch } from 'firebase/firestore';

const marksCollection = collection(db, 'marks');

export async function addMark(markData: Omit<Mark, 'id' | 'lastUpdated'> & { lastUpdated?: string }): Promise<string> {
  const docRef = await addDoc(marksCollection, {
    ...markData,
    lastUpdated: serverTimestamp(),
  });
  return docRef.id;
}

export async function getMarks(filters: { studentUid?: string; subjectId?: string; semesterId?: string }): Promise<Mark[]> {
  const conditions = [];
  if (filters.studentUid) conditions.push(where('studentUid', '==', filters.studentUid));
  if (filters.subjectId) conditions.push(where('subjectId', '==', filters.subjectId));
  if (filters.semesterId) conditions.push(where('semesterId', '==', filters.semesterId));

  if (conditions.length === 0) {
    // Avoid fetching all marks without any filter, or define a default limited query
    // For now, returning empty if no specific student/subject/semester is provided
    // Or, if fetching for a teacher, we might query by teacherUid if stored on marks
    return []; 
  }
  
  const q = query(marksCollection, ...conditions, orderBy('subjectName', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      // Ensure lastUpdated is a string if it's a Timestamp
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
    } as Mark;
  });
}

export async function getMarksByStudent(studentUid: string, semesterId?: string): Promise<Mark[]> {
  const conditions = [where('studentUid', '==', studentUid)];
  if (semesterId) {
    conditions.push(where('semesterId', '==', semesterId));
  }
  const q = query(marksCollection, ...conditions, orderBy('semesterName', 'desc'), orderBy('subjectName', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
    } as Mark;
  });
}

export async function updateMark(id: string, updates: Partial<Omit<Mark, 'id' | 'lastUpdated'>>): Promise<void> {
  const markDoc = doc(db, 'marks', id);
  await updateDoc(markDoc, {
    ...updates,
    lastUpdated: serverTimestamp(),
  });
}

export async function upsertMarksBatch(marksToSave: Partial<Mark>[], teacherUid: string): Promise<void> {
  const batch = writeBatch(db);

  marksToSave.forEach(markEntry => {
    // Determine total and grade
    const ca1 = markEntry.ca1 ?? 0;
    const ca2 = markEntry.ca2 ?? 0;
    const midTerm = markEntry.midTerm ?? 0;
    const endTerm = markEntry.endTerm ?? 0;
    const total = ca1 + ca2 + midTerm + endTerm;
    
    let grade = 'N/A';
    if (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    else if (total >= 50) grade = 'D';
    else grade = 'F';

    const markPayload: Partial<Mark> = {
      ...markEntry,
      total,
      grade,
      teacherUid, // Record who is saving/updating
      lastUpdated: Timestamp.now().toDate().toISOString(), // Use client-side timestamp for batch consistency or serverTimestamp() if individual docs
    };

    if (markEntry.id) { // Existing mark, update it
      const markDocRef = doc(db, 'marks', markEntry.id);
      // remove id from payload to avoid writing it into document fields
      const { id, ...payloadWithoutId } = markPayload;
      batch.update(markDocRef, payloadWithoutId);
    } else { // New mark, create it
      const newMarkDocRef = doc(collection(db, 'marks')); // Auto-generate ID
      // studentUid, subjectId, semesterId MUST be present for a new mark
      if (!markEntry.studentUid || !markEntry.subjectId || !markEntry.semesterId) {
          console.warn("Skipping mark due to missing identifiers:", markEntry);
          return; 
      }
      batch.set(newMarkDocRef, markPayload);
    }
  });

  await batch.commit();
}


export async function deleteMark(id: string): Promise<void> {
  const markDoc = doc(db, 'marks', id);
  await deleteDoc(markDoc);
}
