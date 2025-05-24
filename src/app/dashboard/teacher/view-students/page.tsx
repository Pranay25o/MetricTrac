
// src/app/dashboard/teacher/view-students/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { mockStudents, mockSubjects, mockSemesters, mockMarks, mockTeacherAssignments } from "@/lib/mock-data"; // Will be replaced
import type { Mark } from "@/lib/types";
import { Eye, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// TODO: Replace mock data with Firestore data fetching
export default function ViewStudentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [studentData, setStudentData] = useState<Mark[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // TODO: Fetch assignments, semesters, subjects, marks from Firestore
  const teacherAssignments = useMemo(() => {
    if (!user) return [];
    return mockTeacherAssignments.filter(ta => ta.teacherUid === user.uid); // Changed to teacherUid
  }, [user]);

  const availableSemesters = useMemo(() => {
    const semesterIds = new Set(teacherAssignments.map(ta => ta.semesterId));
    return mockSemesters.filter(s => semesterIds.has(s.id)); // TODO: Use semesters from Firestore
  }, [teacherAssignments]);

  const availableSubjects = useMemo(() => {
    if (!selectedSemester) return [];
    const subjectIds = new Set(teacherAssignments.filter(ta => ta.semesterId === selectedSemester).map(ta => ta.subjectId));
    return mockSubjects.filter(s => subjectIds.has(s.id)); // TODO: Use subjects from Firestore
  }, [teacherAssignments, selectedSemester]);

  useEffect(() => {
    if (selectedSemester && selectedSubject) {
      // TODO: Fetch marks for this subject/semester from Firestore
      const marksForSubject = mockMarks.filter( // Replace mockMarks
        mark => mark.semesterId === selectedSemester && mark.subjectId === selectedSubject
      );
      const enrichedMarks = marksForSubject.map(mark => ({
        ...mark,
        studentName: mark.studentName || mockStudents.find(s => s.uid === mark.studentUid)?.name || "Unknown Student", // Changed to studentUid
      }));
      setStudentData(enrichedMarks);
    } else {
      setStudentData([]);
    }
  }, [selectedSemester, selectedSubject]);


  if (loading || !user || user.role !== "teacher") {
    return <p>Loading or unauthorized...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">View Student Performance</CardTitle>
          <CardDescription>Select a semester and subject to view student marks and performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="semesterFilterView" className="text-sm font-medium">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semesterFilterView">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="subjectFilterView" className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedSemester}>
                <SelectTrigger id="subjectFilterView">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
                variant="outline" 
                className="self-end" 
                onClick={() => { setSelectedSemester(""); setSelectedSubject(""); }}
                disabled={!selectedSemester && !selectedSubject}
              >
                <Filter className="mr-2 h-4 w-4" /> Clear Selection
            </Button>
          </div>

          {selectedSemester && selectedSubject && (
            <>
            <h3 className="text-xl font-semibold mb-4">
                Student Marks for: {mockSubjects.find(s => s.id === selectedSubject)?.name} - {mockSemesters.find(s => s.id === selectedSemester)?.name}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>PRN</TableHead>
                  <TableHead>CA1</TableHead>
                  <TableHead>CA2</TableHead>
                  <TableHead>MidTerm</TableHead>
                  <TableHead>EndTerm</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentData.length > 0 ? studentData.map(mark => (
                  <TableRow key={mark.id}>
                    <TableCell className="font-medium">{mark.studentName}</TableCell>
                    <TableCell>{mockStudents.find(s => s.uid === mark.studentUid)?.prn}</TableCell> {/* Changed to studentUid */}
                    <TableCell>{mark.ca1 ?? '-'}</TableCell>
                    <TableCell>{mark.ca2 ?? '-'}</TableCell>
                    <TableCell>{mark.midTerm ?? '-'}</TableCell>
                    <TableCell>{mark.endTerm ?? '-'}</TableCell>
                    <TableCell>{mark.total ?? '-'}</TableCell>
                    <TableCell>{mark.grade ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                         {/* Link to a student detail page, potentially /dashboard/student/[studentUid]/performance or similar */}
                        <Link href={`/dashboard/student/${mark.studentUid}/performance-analysis`}>
                           <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
                      No marks found for this selection, or no students enrolled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
