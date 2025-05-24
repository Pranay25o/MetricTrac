
// src/app/dashboard/teacher/manage-marks/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getAssignmentsByTeacher } from "@/lib/firestore/teacherAssignments";
import { getSubjects } from "@/lib/firestore/subjects";
import { getSemesters } from "@/lib/firestore/semesters";
import { getUsers } from "@/lib/firestore/users";
import { getMarks, upsertMarksBatch } from "@/lib/firestore/marks";
import type { Mark, TeacherSubjectAssignment, Subject, Semester, UserProfile } from "@/lib/types";
import { Save, Filter, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ManageMarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [studentsForSubject, setStudentsForSubject] = useState<UserProfile[]>([]); // Students enrolled in the selected subject/semester (mocked for now)
  const [studentMarks, setStudentMarks] = useState<Partial<Mark>[]>([]);

  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(true);
  const [isLoadingStudentsAndMarks, setIsLoadingStudentsAndMarks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchPrerequisites = useCallback(async () => {
    if (!user) return;
    setIsLoadingPrerequisites(true);
    try {
      const [assignments, subjects, semesters] = await Promise.all([
        getAssignmentsByTeacher(user.uid),
        getSubjects(), // Fetch all subjects initially
        getSemesters(), // Fetch all semesters initially
      ]);
      setTeacherAssignments(assignments);
      setAllSubjects(subjects);
      setAllSemesters(semesters);
    } catch (error) {
      console.error("Error fetching prerequisites:", error);
      toast({ title: "Error", description: "Could not load your assignments, subjects, or semesters.", variant: "destructive" });
    } finally {
      setIsLoadingPrerequisites(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchPrerequisites();
    }
  }, [user, fetchPrerequisites]);

  const availableSemestersForTeacher = useMemo(() => {
    const semesterIds = new Set(teacherAssignments.map(ta => ta.semesterId));
    return allSemesters.filter(s => semesterIds.has(s.id));
  }, [teacherAssignments, allSemesters]);

  const availableSubjectsForTeacherInSemester = useMemo(() => {
    if (!selectedSemesterId) return [];
    const subjectIds = new Set(
      teacherAssignments
        .filter(ta => ta.semesterId === selectedSemesterId)
        .map(ta => ta.subjectId)
    );
    return allSubjects.filter(s => subjectIds.has(s.id));
  }, [teacherAssignments, allSubjects, selectedSemesterId]);

  const fetchStudentsAndMarksForSelection = useCallback(async () => {
    if (!user || !selectedSemesterId || !selectedSubjectId) {
      setStudentsForSubject([]);
      setStudentMarks([]);
      return;
    }
    setIsLoadingStudentsAndMarks(true);
    try {
      // For now, assume all students could be in any subject.
      // A real system might have student-subject enrollments.
      // We'll fetch all students and then filter/match their marks.
      const allStudents = await getUsers("student"); 
      setStudentsForSubject(allStudents); // Store all students to pick from

      const existingMarks = await getMarks({ subjectId: selectedSubjectId, semesterId: selectedSemesterId });
      
      const marksForDisplay: Partial<Mark>[] = allStudents.map(student => {
        const mark = existingMarks.find(m => m.studentUid === student.uid);
        const subject = allSubjects.find(s => s.id === selectedSubjectId);
        const semester = allSemesters.find(s => s.id === selectedSemesterId);
        return {
          id: mark?.id, // Important for updates
          studentUid: student.uid,
          studentName: student.name,
          subjectId: selectedSubjectId,
          subjectName: subject?.name,
          semesterId: selectedSemesterId,
          semesterName: semester?.name,
          ca1: mark?.ca1,
          ca2: mark?.ca2,
          midTerm: mark?.midTerm,
          endTerm: mark?.endTerm,
          total: mark?.total,
          grade: mark?.grade,
        };
      });
      setStudentMarks(marksForDisplay);

    } catch (error) {
      console.error("Error fetching students or marks:", error);
      toast({ title: "Error", description: "Could not load student data or marks for this selection.", variant: "destructive" });
      setStudentsForSubject([]);
      setStudentMarks([]);
    } finally {
      setIsLoadingStudentsAndMarks(false);
    }
  }, [user, selectedSemesterId, selectedSubjectId, toast, allSubjects, allSemesters]);

  useEffect(() => {
    fetchStudentsAndMarksForSelection();
  }, [fetchStudentsAndMarksForSelection]);


  const handleMarkChange = (studentUid: string, field: keyof Mark, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    if (value !== "" && (isNaN(numericValue!) || numericValue! < 0)) return;
    
    // Max value checks
    if (field === "ca1" || field === "ca2") { if (numericValue !== undefined && numericValue > 10) return; }
    else if (field === "midTerm") { if (numericValue !== undefined && numericValue > 20) return; }
    else if (field === "endTerm") { if (numericValue !== undefined && numericValue > 60) return; }

    setStudentMarks(prevMarks =>
      prevMarks.map(mark => {
        if (mark.studentUid === studentUid) {
          const updatedMark = { ...mark, [field]: numericValue };
          // Recalculate total and grade
          const ca1 = updatedMark.ca1 ?? 0;
          const ca2 = updatedMark.ca2 ?? 0;
          const midTerm = updatedMark.midTerm ?? 0;
          const endTerm = updatedMark.endTerm ?? 0;
          
          if (updatedMark.ca1 !== undefined || updatedMark.ca2 !== undefined || updatedMark.midTerm !== undefined || updatedMark.endTerm !== undefined) {
            updatedMark.total = ca1 + ca2 + midTerm + endTerm;
            if (updatedMark.total >= 90) updatedMark.grade = "A+";
            else if (updatedMark.total >= 80) updatedMark.grade = "A";
            else if (updatedMark.total >= 70) updatedMark.grade = "B";
            else if (updatedMark.total >= 60) updatedMark.grade = "C";
            else if (updatedMark.total >= 50) updatedMark.grade = "D";
            else updatedMark.grade = "F";
          } else {
            updatedMark.total = undefined;
            updatedMark.grade = undefined;
          }
          return updatedMark;
        }
        return mark;
      })
    );
  };
  
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Filter out marks that haven't been touched (all assessment fields are undefined)
      // unless they already have an ID (meaning they existed before and might be cleared)
      const marksToSave = studentMarks.filter(mark => 
        mark.id || // if it has an id, it's an existing mark we might be updating (even to clear it)
        mark.ca1 !== undefined || 
        mark.ca2 !== undefined || 
        mark.midTerm !== undefined || 
        mark.endTerm !== undefined 
      );

      if (marksToSave.length === 0) {
        toast({ title: "No Changes", description: "No marks were entered or modified." });
        return;
      }
      await upsertMarksBatch(marksToSave, user.uid);
      toast({ title: "Success", description: "Marks saved successfully." });
      fetchStudentsAndMarksForSelection(); // Refresh marks
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({ title: "Error", description: "Could not save marks.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || user.role !== "teacher") {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  const selectedSubjectName = allSubjects.find(s => s.id === selectedSubjectId)?.name;
  const selectedSemesterName = allSemesters.find(s => s.id === selectedSemesterId)?.name;


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Manage Student Marks</CardTitle>
          <CardDescription>Select a semester and subject to enter or update marks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPrerequisites ? (
            <div className="flex justify-center items-center py-4"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading configuration...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="semesterSelect">Semester</Label>
                <Select value={selectedSemesterId} onValueChange={(value) => { setSelectedSemesterId(value); setSelectedSubjectId(""); /* Reset subject */ }}>
                  <SelectTrigger id="semesterSelect"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {availableSemestersForTeacher.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subjectSelect">Subject</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedSemesterId || availableSubjectsForTeacherInSemester.length === 0}>
                  <SelectTrigger id="subjectSelect"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {availableSubjectsForTeacherInSemester.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                  variant="outline" 
                  className="self-end" 
                  onClick={() => { setSelectedSemesterId(""); setSelectedSubjectId(""); }}
                  disabled={!selectedSemesterId && !selectedSubjectId}
                >
                  <Filter className="mr-2 h-4 w-4" /> Clear Selection
              </Button>
            </div>
          )}

          {selectedSemesterId && selectedSubjectId && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Entering Marks for: {selectedSubjectName || "Selected Subject"} - {selectedSemesterName || "Selected Semester"}
              </h3>
              {isLoadingStudentsAndMarks ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading students and marks...</div>
              ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-[100px]">CA1 (10)</TableHead>
                      <TableHead className="w-[100px]">CA2 (10)</TableHead>
                      <TableHead className="w-[120px]">MidTerm (20)</TableHead>
                      <TableHead className="w-[120px]">EndTerm (60)</TableHead>
                      <TableHead className="w-[100px]">Total (100)</TableHead>
                      <TableHead className="w-[80px]">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentMarks.length > 0 ? studentMarks.map(mark => (
                      <TableRow key={mark.studentUid}>
                        <TableCell className="font-medium">{mark.studentName}</TableCell>
                        <TableCell>
                          <Input type="number" min="0" max="10" value={mark.ca1 ?? ""} onChange={e => handleMarkChange(mark.studentUid!, 'ca1', e.target.value)} className="h-8 text-sm"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" max="10" value={mark.ca2 ?? ""} onChange={e => handleMarkChange(mark.studentUid!, 'ca2', e.target.value)} className="h-8 text-sm"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" max="20" value={mark.midTerm ?? ""} onChange={e => handleMarkChange(mark.studentUid!, 'midTerm', e.target.value)} className="h-8 text-sm"/>
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" max="60" value={mark.endTerm ?? ""} onChange={e => handleMarkChange(mark.studentUid!, 'endTerm', e.target.value)} className="h-8 text-sm"/>
                        </TableCell>
                        <TableCell className="text-sm">{mark.total ?? '-'}</TableCell>
                        <TableCell className="text-sm">{mark.grade ?? '-'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          No students found for this subject/semester, or all students loaded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {studentMarks.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                       Save Changes
                    </Button>
                  </div>
                )}
                </>
              )}
            </>
          )}
          {!selectedSemesterId && !selectedSubjectId && !isLoadingPrerequisites && (
             <p className="text-center text-muted-foreground mt-8">Please select a semester and subject to manage marks.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
