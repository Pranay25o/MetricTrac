
export type Role = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string; // Changed from id to uid to match Firebase Auth
  email: string;
  name: string;
  role: Role;
  prn?: string; // For students
  avatarUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Semester {
  id: string;
  name: string; // e.g., "Semester 1", "Semester 2"
  year: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface Mark {
  id: string; 
  studentUid: string; // Changed from studentId to studentUid
  studentName?: string; // For easier display
  subjectId: string;
  subjectName?: string; // For easier display
  semesterId: string;
  semesterName?: string; // For easier display
  ca1?: number; // out of 10
  ca2?: number; // out of 10
  midTerm?: number; // out of 20
  endTerm?: number; // out of 60
  total?: number; // Calculated: ca1 + ca2 + midTerm + endTerm (out of 100)
  grade?: string; // Calculated based on total
  teacherUid?: string; // Changed from teacherId to teacherUid
  lastUpdated?: string; // ISO date string
}

export interface TeacherSubjectAssignment {
  id: string;
  teacherUid: string; // Changed from teacherId to teacherUid
  teacherName?: string;
  subjectId: string;
  subjectName?: string;
  semesterId: string;
  semesterName?: string;
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
