
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

  let q;
  if (conditions.length > 0) {
    // If specific ID filters are applied, fetch based on those.
    // Sorting by denormalized names here can create many complex index requirements.
    // Consider client-side sorting or specific indexes if server-side sort is vital for these filtered views.
    q = query(marksCollection, ...conditions);
  } else {
    // This case (fetching all marks without specific ID filters) is generally not recommended
    // for large datasets. If used, it sorts by subjectName.
    // An index on subjectName (asc) would be needed.
    q = query(marksCollection, orderBy('subjectName', 'asc'));
    console.warn("getMarks called without specific ID filters. This might fetch a large dataset.");
  }
  
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
  // This specific query with ordering requires a composite index:
  // studentUid (asc), semesterName (desc), subjectName (asc)
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
    const { 
      id: markEntryId, 
      studentUid, 
      studentName, 
      subjectId, 
      subjectName, 
      semesterId, 
      semesterName,
      ca1, ca2, midTerm, endTerm, // These could be undefined if not entered
    } = markEntry;

    // Ensure core identifiers are present, especially for new marks
    if (!studentUid || !subjectId || !semesterId) {
        console.warn("Skipping mark upsert due to missing studentUid, subjectId, or semesterId:", markEntry);
        return; 
    }
    
    const ca1Value = ca1 ?? 0;
    const ca2Value = ca2 ?? 0;
    const midTermValue = midTerm ?? 0;
    const endTermValue = endTerm ?? 0;
    
    const calculatedTotal = ca1Value + ca2Value + midTermValue + endTermValue;
    
    let calculatedGrade = 'F'; // Default to F
    if (calculatedTotal >= 90) calculatedGrade = 'A+';
    else if (calculatedTotal >= 80) calculatedGrade = 'A';
    else if (calculatedTotal >= 70) calculatedGrade = 'B';
    else if (calculatedTotal >= 60) calculatedGrade = 'C';
    else if (calculatedTotal >= 50) calculatedGrade = 'D';

    const firestorePayload = {
      studentUid,
      studentName: studentName || "Unknown Student",
      subjectId,
      subjectName: subjectName || "Unknown Subject",
      semesterId,
      semesterName: semesterName || "Unknown Semester",
      ca1: ca1 ?? null, // Store as null in Firestore if undefined
      ca2: ca2 ?? null,
      midTerm: midTerm ?? null,
      endTerm: endTerm ?? null,
      total: calculatedTotal,
      grade: calculatedGrade,
      teacherUid, 
      lastUpdated: serverTimestamp(),
    };

    if (markEntryId) { // Existing mark, update it
      const markDocRef = doc(db, 'marks', markEntryId);
      batch.update(markDocRef, firestorePayload);
    } else { // New mark, create it
      const newMarkDocRef = doc(collection(db, 'marks')); // Auto-generate ID for new mark
      batch.set(newMarkDocRef, firestorePayload);
    }
  });

  await batch.commit();
}


export async function deleteMark(id: string): Promise<void> {
  const markDoc = doc(db, 'marks', id);
  await deleteDoc(markDoc);
}
