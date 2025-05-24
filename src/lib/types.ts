export type Role = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
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
  studentId: string;
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
  teacherId?: string; // ID of teacher who entered/last updated marks
  lastUpdated?: string; // ISO date string
}

export interface TeacherSubjectAssignment {
  id: string;
  teacherId: string;
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
