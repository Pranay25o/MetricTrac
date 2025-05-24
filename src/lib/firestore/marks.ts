
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
    // Avoid fetching all marks without any filter
    // For the "Manage Marks" or "View Students" page, this function should ideally be called with subjectId and semesterId.
    // If called without any specific filter, it might be an error or require a different, limited query.
    console.warn("getMarks called without specific filters. Returning empty. This might indicate a logic issue if marks were expected.");
    return []; 
  }
  
  // Default sort included in query for consistency, adjust if other sorts are needed for specific use cases
  const q = query(marksCollection, ...conditions, orderBy('subjectName', 'asc')); 
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
    // These values are used for calculation, defaulting to 0 if not present
    const ca1Value = markEntry.ca1 ?? 0;
    const ca2Value = markEntry.ca2 ?? 0;
    const midTermValue = markEntry.midTerm ?? 0;
    const endTermValue = markEntry.endTerm ?? 0;
    
    const calculatedTotal = ca1Value + ca2Value + midTermValue + endTermValue;
    
    let calculatedGrade = 'F'; // Default to F
    if (calculatedTotal >= 90) calculatedGrade = 'A+';
    else if (calculatedTotal >= 80) calculatedGrade = 'A';
    else if (calculatedTotal >= 70) calculatedGrade = 'B';
    else if (calculatedTotal >= 60) calculatedGrade = 'C';
    else if (calculatedTotal >= 50) calculatedGrade = 'D';

    // Destructure to get core details and explicitly handle assessment fields for Firestore
    const { 
      id: markEntryId, 
      studentUid, 
      studentName, 
      subjectId, 
      subjectName, 
      semesterId, 
      semesterName 
    } = markEntry;

    // Ensure core identifiers are present, especially for new marks
    if (!studentUid || !subjectId || !semesterId) {
        console.warn("Skipping mark due to missing studentUid, subjectId, or semesterId:", markEntry);
        return; // Skip this mark entry
    }

    const firestorePayload = {
      studentUid,
      studentName: studentName || "N/A", // Default if undefined
      subjectId,
      subjectName: subjectName || "N/A", // Default if undefined
      semesterId,
      semesterName: semesterName || "N/A", // Default if undefined
      ca1: markEntry.ca1 ?? null, // Store as null in Firestore if undefined
      ca2: markEntry.ca2 ?? null,
      midTerm: markEntry.midTerm ?? null,
      endTerm: markEntry.endTerm ?? null,
      total: calculatedTotal,
      grade: calculatedGrade,
      teacherUid, 
      lastUpdated: serverTimestamp(),
    };

    if (markEntryId) { // Existing mark, update it
      const markDocRef = doc(db, 'marks', markEntryId);
      batch.update(markDocRef, firestorePayload);
    } else { // New mark, create it
      const newMarkDocRef = doc(collection(db, 'marks')); // Auto-generate ID
      batch.set(newMarkDocRef, firestorePayload);
    }
  });

  await batch.commit();
}


export async function deleteMark(id: string): Promise<void> {
  const markDoc = doc(db, 'marks', id);
  await deleteDoc(markDoc);
}
