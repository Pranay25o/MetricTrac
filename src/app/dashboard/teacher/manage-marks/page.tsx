
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
import { Save, Filter, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ManageMarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [allSystemSubjects, setAllSystemSubjects] = useState<Subject[]>([]); 
  const [allSystemSemesters, setAllSystemSemesters] = useState<Semester[]>([]); 
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]); 
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
    console.log("ManageMarksPage: fetchPrerequisites triggered for teacher:", user.uid);
    setIsLoadingPrerequisites(true);
    try {
      const [assignmentsData, subjectsData, semestersData, studentsData] = await Promise.all([
        getAssignmentsByTeacher(user.uid),
        getSubjects(), 
        getSemesters(),
        getUsers("student"), 
      ]);
      setTeacherAssignments(assignmentsData);
      setAllSystemSubjects(subjectsData);
      setAllSystemSemesters(semestersData);
      setAllStudents(studentsData);
      console.log("ManageMarksPage: Prerequisites fetched - Assignments:", assignmentsData.length, "Subjects:", subjectsData.length, "Semesters:", semestersData.length, "Students:", studentsData.length);
    } catch (error) {
      console.error("Error fetching prerequisites:", error);
      toast({ title: "Error Loading Page Data", description: "Could not load your assignments, subjects, semesters or student list. Check console for Firestore errors.", variant: "destructive" });
    } finally {
      setIsLoadingPrerequisites(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && user.role === 'teacher' && !authLoading) {
      fetchPrerequisites();
    }
  }, [user, authLoading, fetchPrerequisites]);

  const availableSemestersForTeacher = useMemo(() => {
    const semesterIds = new Set(teacherAssignments.map(ta => ta.semesterId));
    return allSystemSemesters.filter(s => semesterIds.has(s.id)).sort((a,b) => b.year - a.year || a.name.localeCompare(b.name));
  }, [teacherAssignments, allSystemSemesters]);

  const availableSubjectsForTeacherInSemester = useMemo(() => {
    if (!selectedSemesterId) return [];
    const subjectIds = new Set(
      teacherAssignments
        .filter(ta => ta.semesterId === selectedSemesterId)
        .map(ta => ta.subjectId)
    );
    return allSystemSubjects.filter(s => subjectIds.has(s.id)).sort((a,b) => a.name.localeCompare(b.name));
  }, [teacherAssignments, allSystemSubjects, selectedSemesterId]);

  const fetchStudentsAndMarksForSelection = useCallback(async () => {
    if (!user || !selectedSemesterId || !selectedSubjectId || allStudents.length === 0) {
      console.log("ManageMarksPage: fetchStudentsAndMarksForSelection - prerequisites not met. Selection:", {selectedSemesterId, selectedSubjectId, allStudentsCount: allStudents.length});
      setStudentMarks([]);
      return;
    }
    console.log("ManageMarksPage: fetchStudentsAndMarksForSelection - Fetching for Sem:",selectedSemesterId, "Subj:", selectedSubjectId);
    setIsLoadingStudentsAndMarks(true);
    try {
      const existingMarks = await getMarks({ subjectId: selectedSubjectId, semesterId: selectedSemesterId });
      console.log("ManageMarksPage: Existing marks fetched:", existingMarks.length);
      
      const subjectDetails = allSystemSubjects.find(s => s.id === selectedSubjectId);
      const semesterDetails = allSystemSemesters.find(s => s.id === selectedSemesterId);

      const marksForDisplay: Partial<Mark>[] = allStudents.map(student => {
        const mark = existingMarks.find(m => m.studentUid === student.uid);
        return {
          id: mark?.id, 
          studentUid: student.uid,
          studentName: student.name, 
          subjectId: selectedSubjectId,
          subjectName: subjectDetails?.name || "Unknown Subject", 
          semesterId: selectedSemesterId,
          semesterName: semesterDetails?.name || "Unknown Semester", 
          ca1: mark?.ca1,
          ca2: mark?.ca2,
          midTerm: mark?.midTerm,
          endTerm: mark?.endTerm,
          total: mark?.total,
          grade: mark?.grade,
        };
      }).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "")); // Sort by student name client-side
      setStudentMarks(marksForDisplay);
      console.log("ManageMarksPage: Marks for display prepared:", marksForDisplay.length);

    } catch (error) {
      console.error("Error fetching students or marks for selection:", error);
      toast({ title: "Error Loading Marks", description: "Could not load student data or marks for this selection. Check console for Firestore index or permission errors.", variant: "destructive" });
      setStudentMarks([]);
    } finally {
      setIsLoadingStudentsAndMarks(false);
    }
  }, [user, selectedSemesterId, selectedSubjectId, toast, allStudents, allSystemSubjects, allSystemSemesters]);

  useEffect(() => {
    console.log("ManageMarksPage: useEffect for fetching marks. SemId:", selectedSemesterId, "SubjId:", selectedSubjectId, "Students:", allStudents.length, "PrereqLoading:", isLoadingPrerequisites);
    if (selectedSemesterId && selectedSubjectId && allStudents.length > 0 && !isLoadingPrerequisites) {
        fetchStudentsAndMarksForSelection();
    } else {
        setStudentMarks([]); 
    }
  }, [selectedSemesterId, selectedSubjectId, allStudents, isLoadingPrerequisites, fetchStudentsAndMarksForSelection]);


  const handleMarkChange = (studentUid: string, field: keyof Mark, value: string) => {
    const numericValue = value === "" ? undefined : parseInt(value, 10);
    
    if (value !== "" && (isNaN(numericValue!) || numericValue! < 0)) return;
    
    let maxValue = Infinity;
    if (field === "ca1" || field === "ca2") maxValue = 10;
    else if (field === "midTerm") maxValue = 20;
    else if (field === "endTerm") maxValue = 60;

    if (numericValue !== undefined && numericValue > maxValue) return;

    setStudentMarks(prevMarks =>
      prevMarks.map(mark => {
        if (mark.studentUid === studentUid) {
          const updatedMark = { ...mark, [field]: numericValue };
          
          const ca1 = updatedMark.ca1 ?? 0;
          const ca2 = updatedMark.ca2 ?? 0;
          const midTerm = updatedMark.midTerm ?? 0;
          const endTerm = updatedMark.endTerm ?? 0;
          
          // Only calculate total and grade if at least one assessment mark is present
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
    if (!user || !selectedSubjectId || !selectedSemesterId) {
        toast({ title: "Cannot Save", description: "Subject or Semester not selected.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    console.log("ManageMarksPage: Attempting to save marks for Subj:", selectedSubjectId, "Sem:", selectedSemesterId);
    try {
      const marksToSave = studentMarks.filter(mark => 
        mark.id || // Existing mark that might be updated
        mark.ca1 !== undefined || 
        mark.ca2 !== undefined || 
        mark.midTerm !== undefined || 
        mark.endTerm !== undefined 
      );

      if (marksToSave.length === 0) {
        toast({ title: "No Changes", description: "No marks were entered or modified." });
        setIsSaving(false);
        return;
      }
      
      const subjectDetails = allSystemSubjects.find(s => s.id === selectedSubjectId);
      const semesterDetails = allSystemSemesters.find(s => s.id === selectedSemesterId);

      const finalMarksToSave = marksToSave.map(m => ({
          ...m,
          subjectName: subjectDetails?.name || m.subjectName || "Unknown Subject",
          semesterName: semesterDetails?.name || m.semesterName || "Unknown Semester",
          studentName: allStudents.find(s => s.uid === m.studentUid)?.name || m.studentName || "Unknown Student",
      }));

      await upsertMarksBatch(finalMarksToSave as Mark[], user.uid); // Cast as Mark[] assuming all required fields for Mark type are present
      toast({ title: "Success", description: "Marks saved successfully." });
      fetchStudentsAndMarksForSelection(); 
      console.log("ManageMarksPage: Marks saved successfully.");
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({ title: "Error Saving Marks", description: "Could not save marks. Check console for details.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || user.role !== "teacher") {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  const selectedSubjectName = allSystemSubjects.find(s => s.id === selectedSubjectId)?.name;
  const selectedSemesterName = allSystemSemesters.find(s => s.id === selectedSemesterId)?.name;


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
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="semesterSelect">Semester</Label>
                <Select value={selectedSemesterId} onValueChange={(value) => { setSelectedSemesterId(value); setSelectedSubjectId(""); }}>
                  <SelectTrigger id="semesterSelect"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {availableSemestersForTeacher.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>{semester.name} ({semester.year})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {availableSemestersForTeacher.length === 0 && <p className="text-xs text-muted-foreground mt-1">No semesters assigned to you.</p>}
              </div>
              <div>
                <Label htmlFor="subjectSelect">Subject</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedSemesterId || availableSubjectsForTeacherInSemester.length === 0}>
                  <SelectTrigger id="subjectSelect"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {availableSubjectsForTeacherInSemester.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name} ({subject.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {selectedSemesterId && availableSubjectsForTeacherInSemester.length === 0 && <p className="text-xs text-muted-foreground mt-1">No subjects assigned to you for this semester.</p>}
              </div>
              <Button 
                  variant="outline" 
                  className="self-end" 
                  onClick={() => { setSelectedSemesterId(""); setSelectedSubjectId(""); setStudentMarks([]); }}
                  disabled={!selectedSemesterId && !selectedSubjectId}
                >
                  <Filter className="mr-2 h-4 w-4" /> Clear Selection
              </Button>
            </div>
            { !selectedSemesterId || !selectedSubjectId && !isLoadingPrerequisites && (
             <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                <AlertTriangle className="h-5 w-5 text-blue-700" />
                <AlertTitle className="font-semibold text-blue-800">Selection Required</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  Please select a semester and a subject to manage marks.
                  {teacherAssignments.length === 0 && " It seems you have no subjects assigned to you. Please contact an administrator."}
                </UiAlertDescription>
              </Alert>
            )}
            </>
          )}

          {selectedSemesterId && selectedSubjectId && (
            <>
              <h3 className="text-xl font-semibold mb-4">
                Entering Marks for: {selectedSubjectName || "Selected Subject"} - {selectedSemesterName || "Selected Semester"}
              </h3>
              {isLoadingStudentsAndMarks ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading students and marks...</div>
              ) : (
                studentMarks.length > 0 ? (
                  <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name (PRN)</TableHead>
                        <TableHead className="w-[100px]">CA1 (10)</TableHead>
                        <TableHead className="w-[100px]">CA2 (10)</TableHead>
                        <TableHead className="w-[120px]">MidTerm (20)</TableHead>
                        <TableHead className="w-[120px]">EndTerm (60)</TableHead>
                        <TableHead className="w-[100px]">Total (100)</TableHead>
                        <TableHead className="w-[80px]">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentMarks.map(mark => {
                        const student = allStudents.find(s => s.uid === mark.studentUid);
                        return (
                        <TableRow key={mark.studentUid}>
                          <TableCell className="font-medium">{mark.studentName} ({student?.prn || 'N/A'})</TableCell>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-6 flex justify-end">
                      <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                    <AlertTriangle className="h-5 w-5 text-blue-700" />
                    <AlertTitle className="font-semibold text-blue-800">No Students or Marks</AlertTitle>
                    <UiAlertDescription className="text-blue-700">
                      {allStudents.length === 0 ? "No students found in the system to enter marks for." : "No marks data loaded or no students available for this selection."}
                      <br />
                      <strong>If data is expected but not showing, please check your browser's developer console (F12) for Firestore index errors or permission issues.</strong>
                    </UiAlertDescription>
                  </Alert>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
