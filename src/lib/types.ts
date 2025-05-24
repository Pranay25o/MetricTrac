
export type Role = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string; 
  email: string;
  name: string;
  role: Role;
  prn?: string; // For students
  avatarUrl?: string;
}

export interface Subject {
  id: string; // Will be document ID in Firestore
  name: string;
  code: string;
  // teacherUids?: string[]; // Future: if multiple teachers can teach a subject directly
}

export interface Semester {
  id: string; // Will be document ID in Firestore
  name: string; 
  year: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface Mark {
  id: string; // Will be document ID in Firestore
  studentUid: string; 
  studentName?: string; // Denormalized for easier display
  subjectId: string;
  subjectName?: string; // Denormalized for easier display
  semesterId: string;
  semesterName?: string; // Denormalized for easier display
  ca1?: number; 
  ca2?: number; 
  midTerm?: number;
  endTerm?: number;
  total?: number; 
  grade?: string; 
  teacherUid?: string; // UID of the teacher who entered/last updated the mark
  lastUpdated: string; // ISO date string
}

export interface TeacherSubjectAssignment {
  id: string; // Will be document ID in Firestore
  teacherUid: string; 
  teacherName?: string; // Denormalized
  subjectId: string;
  subjectName?: string; // Denormalized
  semesterId: string;
  semesterName?: string; // Denormalized
}

// For Performance Insights GenAI feature
export interface StudentMarksDataForAI {
  semester: string;
  subject: string;
  ca1: number;
  ca2: number;
  midTerm: number;
  endTerm: number;
}
