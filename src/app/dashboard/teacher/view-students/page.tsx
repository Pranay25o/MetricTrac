
// src/app/dashboard/teacher/view-students/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getAssignmentsByTeacher } from "@/lib/firestore/teacherAssignments";
import { getSubjects } from "@/lib/firestore/subjects";
import { getSemesters } from "@/lib/firestore/semesters";
import { getUsers } from "@/lib/firestore/users";
import { getMarks } from "@/lib/firestore/marks";
import type { Mark, TeacherSubjectAssignment, Subject, Semester, UserProfile } from "@/lib/types";
import { Eye, Filter, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ViewStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]); 
  
  const [studentMarksData, setStudentMarksData] = useState<Mark[]>([]);

  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(true);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchPrerequisites = useCallback(async () => {
    if (!user) return;
    console.log("ViewStudentsPage: fetchPrerequisites triggered for teacher:", user.uid);
    setIsLoadingPrerequisites(true);
    try {
      const [assignmentsData, subjectsData, semestersData, studentsData] = await Promise.all([
        getAssignmentsByTeacher(user.uid),
        getSubjects(),
        getSemesters(),
        getUsers("student") 
      ]);
      setTeacherAssignments(assignmentsData);
      setAllSubjects(subjectsData);
      setAllSemesters(semestersData);
      setAllStudents(studentsData);
      console.log("ViewStudentsPage: Prerequisites fetched - Assignments:", assignmentsData.length, "Subjects:", subjectsData.length, "Semesters:", semestersData.length, "Students:", studentsData.length);
    } catch (error) {
      console.error("Error fetching prerequisites:", error);
      toast({ title: "Error Loading Page Data", description: "Could not load your assignments, subjects, or semesters. Check console for Firestore errors.", variant: "destructive" });
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
    return allSemesters.filter(s => semesterIds.has(s.id)).sort((a,b) => b.year - a.year || a.name.localeCompare(b.name));
  }, [teacherAssignments, allSemesters]);

  const availableSubjectsForTeacherInSemester = useMemo(() => {
    if (!selectedSemesterId) return [];
    const subjectIds = new Set(
      teacherAssignments
        .filter(ta => ta.semesterId === selectedSemesterId)
        .map(ta => ta.subjectId)
    );
    return allSubjects.filter(s => subjectIds.has(s.id)).sort((a,b) => a.name.localeCompare(b.name));
  }, [teacherAssignments, allSubjects, selectedSemesterId]);

  const fetchMarksForSelection = useCallback(async () => {
    if (!selectedSemesterId || !selectedSubjectId) {
      console.log("ViewStudentsPage: fetchMarksForSelection - prerequisites not met. Selection:", {selectedSemesterId, selectedSubjectId});
      setStudentMarksData([]);
      return;
    }
    console.log("ViewStudentsPage: fetchMarksForSelection - Fetching for Sem:", selectedSemesterId, "Subj:", selectedSubjectId);
    setIsLoadingMarks(true);
    try {
      const marks = await getMarks({ subjectId: selectedSubjectId, semesterId: selectedSemesterId });
      console.log("ViewStudentsPage: Marks fetched for selection:", marks.length);
      
      const enrichedMarks = marks.map(mark => {
        const studentDetail = allStudents.find(s => s.uid === mark.studentUid);
        return {
          ...mark,
          studentName: mark.studentName || studentDetail?.name || "Unknown Student",
          prn: studentDetail?.prn || "N/A" 
        };
      }).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "")); // Sort by student name client-side
      setStudentMarksData(enrichedMarks);
    } catch (error) {
      console.error("Error fetching marks for selection:", error);
      toast({ title: "Error Loading Marks", description: "Could not load marks for this selection. Check console for Firestore index errors or permission issues.", variant: "destructive" });
      setStudentMarksData([]);
    } finally {
      setIsLoadingMarks(false);
    }
  }, [selectedSemesterId, selectedSubjectId, toast, allStudents]);

  useEffect(() => {
     console.log("ViewStudentsPage: useEffect for fetching marks. SemId:", selectedSemesterId, "SubjId:", selectedSubjectId, "PrereqLoading:", isLoadingPrerequisites);
    if (selectedSemesterId && selectedSubjectId && !isLoadingPrerequisites) {
      fetchMarksForSelection();
    } else {
      setStudentMarksData([]);
    }
  }, [selectedSemesterId, selectedSubjectId, isLoadingPrerequisites, fetchMarksForSelection]);

  if (authLoading || !user || user.role !== "teacher") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }
  
  const selectedSubjectName = allSubjects.find(s => s.id === selectedSubjectId)?.name;
  const selectedSemesterName = allSemesters.find(s => s.id === selectedSemesterId)?.name;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">View Student Performance</CardTitle>
          <CardDescription>Select a semester and subject to view student marks and performance.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPrerequisites ? (
            <div className="flex justify-center items-center py-4"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading configuration...</div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="semesterFilterView" className="text-sm font-medium">Semester</Label>
                <Select value={selectedSemesterId} onValueChange={(value) => { setSelectedSemesterId(value); setSelectedSubjectId(""); }}>
                  <SelectTrigger id="semesterFilterView"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {availableSemestersForTeacher.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableSemestersForTeacher.length === 0 && <p className="text-xs text-muted-foreground mt-1">No semesters assigned to you.</p>}
              </div>
              <div>
                <Label htmlFor="subjectFilterView" className="text-sm font-medium">Subject</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedSemesterId || availableSubjectsForTeacherInSemester.length === 0}>
                  <SelectTrigger id="subjectFilterView"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {availableSubjectsForTeacherInSemester.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSemesterId && availableSubjectsForTeacherInSemester.length === 0 && <p className="text-xs text-muted-foreground mt-1">No subjects assigned for this semester.</p>}
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
             { !selectedSemesterId || !selectedSubjectId && !isLoadingPrerequisites && (
             <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                <AlertTriangle className="h-5 w-5 text-blue-700" />
                <AlertTitle className="font-semibold text-blue-800">Selection Required</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  Please select a semester and a subject to view student marks.
                  {teacherAssignments.length === 0 && " It seems you have no subjects assigned to you. Please contact an administrator."}
                </UiAlertDescription>
              </Alert>
            )}
            </>
          )}

          {selectedSemesterId && selectedSubjectId && (
            <>
            <h3 className="text-xl font-semibold mb-4">
                Student Marks for: {selectedSubjectName || "Selected Subject"} - {selectedSemesterName || "Selected Semester"}
            </h3>
            {isLoadingMarks ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading student marks...</div>
            ) : (
              studentMarksData.length > 0 ? (
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
                    {studentMarksData.map(mark => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.studentName}</TableCell><TableCell>{(mark as any).prn || 'N/A'}</TableCell><TableCell>{mark.ca1 ?? '-'}</TableCell><TableCell>{mark.ca2 ?? '-'}</TableCell><TableCell>{mark.midTerm ?? '-'}</TableCell><TableCell>{mark.endTerm ?? '-'}</TableCell><TableCell className="font-semibold">{mark.total ?? '-'}</TableCell><TableCell>
                          <Badge variant={ (mark.grade?.startsWith("A") || mark.grade?.startsWith("B")) ? "default" : (mark.grade?.startsWith("C") || mark.grade?.startsWith("D")) ? "secondary" : "destructive"}>
                            {mark.grade ?? '-'}
                          </Badge>
                        </TableCell><TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/student/${mark.studentUid}/performance-analysis`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                 <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                    <AlertTriangle className="h-5 w-5 text-blue-700" />
                    <AlertTitle className="font-semibold text-blue-800">No Marks Found</AlertTitle>
                    <UiAlertDescription className="text-blue-700">
                      No marks have been entered for this subject and semester, or no students are enrolled.
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
