// src/app/dashboard/teacher/manage-marks/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { mockStudents, mockSubjects, mockSemesters, mockMarks, mockTeacherAssignments } from "@/lib/mock-data";
import type { Mark } from "@/lib/types";
import { Save, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

export default function ManageMarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [studentMarks, setStudentMarks] = useState<Partial<Mark>[]>([]); // Using Partial<Mark> for editable fields

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Filter subjects and semesters assigned to this teacher
  const teacherAssignments = useMemo(() => {
    if (!user) return [];
    return mockTeacherAssignments.filter(ta => ta.teacherId === user.id);
  }, [user]);

  const availableSemesters = useMemo(() => {
    const semesterIds = new Set(teacherAssignments.map(ta => ta.semesterId));
    return mockSemesters.filter(s => semesterIds.has(s.id));
  }, [teacherAssignments]);

  const availableSubjects = useMemo(() => {
    if (!selectedSemester) return [];
    const subjectIds = new Set(teacherAssignments.filter(ta => ta.semesterId === selectedSemester).map(ta => ta.subjectId));
    return mockSubjects.filter(s => subjectIds.has(s.id));
  }, [teacherAssignments, selectedSemester]);
  
  useEffect(() => {
    if (selectedSemester && selectedSubject) {
      // Fetch or filter marks for students in this subject & semester
      // For mock: find students (all for now) and their marks for this subject/semester
      const marksForDisplay: Partial<Mark>[] = mockStudents.map(student => {
        const existingMark = mockMarks.find(
          m => m.studentId === student.id && m.subjectId === selectedSubject && m.semesterId === selectedSemester
        );
        return existingMark ? 
          { ...existingMark } : 
          { 
            studentId: student.id, 
            studentName: student.name,
            subjectId: selectedSubject,
            semesterId: selectedSemester,
            ca1: undefined, ca2: undefined, midTerm: undefined, endTerm: undefined
          };
      });
      setStudentMarks(marksForDisplay);
    } else {
      setStudentMarks([]);
    }
  }, [selectedSemester, selectedSubject]);

  const handleMarkChange = (studentId: string, field: keyof Mark, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    // Basic validation (more robust validation would be needed)
    if (value !== "" && (isNaN(numericValue!) || numericValue! < 0)) return;
    if (field === "ca1" || field === "ca2") { if (numericValue! > 10) return; }
    if (field === "midTerm") { if (numericValue! > 20) return; }
    if (field === "endTerm") { if (numericValue! > 60) return; }


    setStudentMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId ? { ...mark, [field]: numericValue } : mark
      )
    );
  };

  const calculateTotal = (mark: Partial<Mark>): number | undefined => {
    const ca1 = mark.ca1 ?? 0;
    const ca2 = mark.ca2 ?? 0;
    const midTerm = mark.midTerm ?? 0;
    const endTerm = mark.endTerm ?? 0;
    if (mark.ca1 === undefined && mark.ca2 === undefined && mark.midTerm === undefined && mark.endTerm === undefined) return undefined;
    return ca1 + ca2 + midTerm + endTerm;
  }

  const handleSaveChanges = () => {
    // Logic to save changes to Firestore
    console.log("Saving marks:", studentMarks.map(m => ({...m, total: calculateTotal(m) })));
    alert("Marks saved successfully (mock)!");
  };

  if (loading || !user || user.role !== "teacher") {
    return <p>Loading or unauthorized...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Manage Student Marks</CardTitle>
          <CardDescription>Select a semester and subject to enter or update marks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="semesterSelect">Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semesterSelect">
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
              <Label htmlFor="subjectSelect">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedSemester}>
                <SelectTrigger id="subjectSelect">
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
                Entering Marks for: {mockSubjects.find(s => s.id === selectedSubject)?.name} - {mockSemesters.find(s => s.id === selectedSemester)?.name}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-[100px]">CA1 (10)</TableHead>
                    <TableHead className="w-[100px]">CA2 (10)</TableHead>
                    <TableHead className="w-[120px]">MidTerm (20)</TableHead>
                    <TableHead className="w-[120px]">EndTerm (60)</TableHead>
                    <TableHead className="w-[100px]">Total (100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentMarks.length > 0 ? studentMarks.map(mark => (
                    <TableRow key={mark.studentId}>
                      <TableCell className="font-medium">{mark.studentName}</TableCell>
                      <TableCell>
                        <Input type="number" min="0" max="10" value={mark.ca1 ?? ""} onChange={e => handleMarkChange(mark.studentId!, 'ca1', e.target.value)} className="h-8"/>
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" max="10" value={mark.ca2 ?? ""} onChange={e => handleMarkChange(mark.studentId!, 'ca2', e.target.value)} className="h-8"/>
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" max="20" value={mark.midTerm ?? ""} onChange={e => handleMarkChange(mark.studentId!, 'midTerm', e.target.value)} className="h-8"/>
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" max="60" value={mark.endTerm ?? ""} onChange={e => handleMarkChange(mark.studentId!, 'endTerm', e.target.value)} className="h-8"/>
                      </TableCell>
                       <TableCell>{calculateTotal(mark) ?? '-'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No students found or select semester/subject to load students.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {studentMarks.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
