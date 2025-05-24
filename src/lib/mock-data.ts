
// src/lib/mock-data.ts
import type { UserProfile, Subject, Semester, Mark, TeacherSubjectAssignment } from './types';

// Note: UserProfile data will now primarily be managed by Firebase Auth and Firestore.
// This mock data might still be useful for other entities or for fallback during development if Firestore is not yet populated.
// Student UIDs here will not match actual Firebase UIDs.
export const mockStudents: UserProfile[] = [
  { uid: 'student001', email: 'alice.j@example.com', name: 'Alice Johnson', role: 'student', prn: 'S1001', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'student002', email: 'bob.k@example.com', name: 'Bob Kelso', role: 'student', prn: 'S1002', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'student003', email: 'carla.e@example.com', name: 'Carla Espinosa', role: 'student', prn: 'S1003', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'student004', email: 'jd.d@example.com', name: 'John Dorian', role: 'student', prn: 'S1004', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'student005', email: 'elliot.r@example.com', name: 'Elliot Reid', role: 'student', prn: 'S1005', avatarUrl: 'https://placehold.co/100x100.png' },
];

// Teacher UIDs here will not match actual Firebase UIDs.
export const mockTeachers: UserProfile[] = [
  { uid: 'teacher001', email: 'perry.cox@example.com', name: 'Dr. Perry Cox', role: 'teacher', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'teacher002', email: 'doug.m@example.com', name: 'Dr. Doug Murphy', role: 'teacher', avatarUrl: 'https://placehold.co/100x100.png' },
  { uid: 'teacher003', email: 'turk.t@example.com', name: 'Dr. Chris Turk', role: 'teacher', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const mockSubjects: Subject[] = [
  { id: 'subj001', name: 'Data Structures', code: 'CS201' },
  { id: 'subj002', name: 'Algorithms', code: 'CS202' },
  { id: 'subj003', name: 'Operating Systems', code: 'CS301' },
  { id: 'subj004', name: 'Database Management', code: 'CS302' },
  { id: 'subj005', name: 'Calculus I', code: 'MA101' },
];

export const mockSemesters: Semester[] = [
  { id: 'sem001', name: 'Fall 2023', year: 2023, startDate: '2023-09-01', endDate: '2023-12-15' },
  { id: 'sem002', name: 'Spring 2024', year: 2024, startDate: '2024-01-15', endDate: '2024-05-10' },
  { id: 'sem003', name: 'Fall 2024', year: 2024, startDate: '2024-09-01', endDate: '2024-12-15' },
];

// Ensure UIDs in mockMarks align with the change from studentId to studentUid and teacherId to teacherUid
export const mockMarks: Mark[] = [
  { 
    id: 'mark001', 
    studentUid: 'student001', studentName: 'Alice Johnson',
    subjectId: 'subj001', subjectName: 'Data Structures',
    semesterId: 'sem001', semesterName: 'Fall 2023',
    ca1: 8, ca2: 9, midTerm: 18, endTerm: 50, 
    total: 85, grade: 'A',
    teacherUid: 'teacher001', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'mark002', 
    studentUid: 'student001', studentName: 'Alice Johnson',
    subjectId: 'subj002', subjectName: 'Algorithms',
    semesterId: 'sem001', semesterName: 'Fall 2023',
    ca1: 7, ca2: 7, midTerm: 15, endTerm: 45, 
    total: 74, grade: 'B',
    teacherUid: 'teacher001', lastUpdated: new Date().toISOString() 
  },
  { 
    id: 'mark003', 
    studentUid: 'student002', studentName: 'Bob Kelso',
    subjectId: 'subj001', subjectName: 'Data Structures',
    semesterId: 'sem001', semesterName: 'Fall 2023',
    ca1: 9, ca2: 10, midTerm: 19, endTerm: 55, 
    total: 93, grade: 'A+',
    teacherUid: 'teacher001', lastUpdated: new Date().toISOString() 
  },
   { 
    id: 'mark004', 
    studentUid: 'student004', studentName: 'John Dorian',
    subjectId: 'subj005', subjectName: 'Calculus I',
    semesterId: 'sem002', semesterName: 'Spring 2024',
    ca1: 6, ca2: 5, midTerm: 12, endTerm: 30, 
    total: 53, grade: 'C',
    teacherUid: 'teacher002', lastUpdated: new Date().toISOString() 
  },
];

// Ensure UIDs in mockTeacherAssignments align with the change from teacherId to teacherUid
export const mockTeacherAssignments: TeacherSubjectAssignment[] = [
  { 
    id: 'tsa001', 
    teacherUid: 'teacher001', teacherName: 'Dr. Perry Cox',
    subjectId: 'subj001', subjectName: 'Data Structures',
    semesterId: 'sem001', semesterName: 'Fall 2023'
  },
  { 
    id: 'tsa002', 
    teacherUid: 'teacher001', teacherName: 'Dr. Perry Cox',
    subjectId: 'subj002', subjectName: 'Algorithms',
    semesterId: 'sem001', semesterName: 'Fall 2023'
  },
  { 
    id: 'tsa003', 
    teacherUid: 'teacher002', teacherName: 'Dr. Doug Murphy',
    subjectId: 'subj003', subjectName: 'Operating Systems',
    semesterId: 'sem002', semesterName: 'Spring 2024'
  },
  { 
    id: 'tsa004', 
    teacherUid: 'teacher002', teacherName: 'Dr. Doug Murphy',
    subjectId: 'subj005', subjectName: 'Calculus I',
    semesterId: 'sem002', semesterName: 'Spring 2024'
  },
];
