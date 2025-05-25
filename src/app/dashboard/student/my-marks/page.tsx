
// src/app/dashboard/student/my-marks/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label"; 
import { useAuth } from "@/contexts/auth-provider";
import { getMarksByStudent } from "@/lib/firestore/marks";
import { getSemesters } from "@/lib/firestore/semesters"; 
import type { Mark, Semester } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function MyMarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allStudentMarks, setAllStudentMarks] = useState<Mark[]>([]);
  const [allSystemSemesters, setAllSystemSemesters] = useState<Semester[]>([]); 
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  
  const [isLoadingMarks, setIsLoadingMarks] = useState(true);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(true);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchStudentMarks = useCallback(async () => {
    if (!user) return;
    console.log("MyMarksPage: fetchStudentMarks triggered for student:", user.uid);
    setIsLoadingMarks(true);
    try {
      const marks = await getMarksByStudent(user.uid);
      setAllStudentMarks(marks);
      console.log("MyMarksPage: Fetched marks:", marks.length);
    } catch (error) {
      console.error("Error fetching student marks:", error);
      toast({ title: "Error Fetching Marks", description: "Could not fetch your marks. Check console for Firestore index or permission errors.", variant: "destructive" });
      setAllStudentMarks([]);
    } finally {
      setIsLoadingMarks(false);
    }
  }, [user, toast]);

  const fetchAllSystemSemesters = useCallback(async () => {
    console.log("MyMarksPage: fetchAllSystemSemesters triggered");
    setIsLoadingSemesters(true);
    try {
      const semesters = await getSemesters();
      setAllSystemSemesters(semesters);
      console.log("MyMarksPage: Fetched all system semesters:", semesters.length);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast({ title: "Error Loading Semesters", description: "Could not load semester list. Check console for Firestore index or permission errors.", variant: "destructive" });
      setAllSystemSemesters([]);
    } finally {
      setIsLoadingSemesters(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === "student" && !authLoading) {
      fetchStudentMarks();
      fetchAllSystemSemesters();
    }
  }, [user, authLoading, fetchStudentMarks, fetchAllSystemSemesters]);

  const availableSemestersForStudent = useMemo(() => {
    if (isLoadingMarks || isLoadingSemesters || allStudentMarks.length === 0 || allSystemSemesters.length === 0) return [];
    const semesterIdsInMarks = new Set(allStudentMarks.map(mark => mark.semesterId));
    return allSystemSemesters
      .filter(semester => semesterIdsInMarks.has(semester.id))
      .sort((a,b) => b.year - a.year || (a.name.localeCompare(b.name))); 
  }, [allStudentMarks, allSystemSemesters, isLoadingMarks, isLoadingSemesters]);

  useEffect(() => {
    if (availableSemestersForStudent.length > 0 && !selectedSemesterId) {
      setSelectedSemesterId(availableSemestersForStudent[0].id);
    }
  }, [availableSemestersForStudent, selectedSemesterId]);

  const marksForSelectedSemester = useMemo(() => {
    if (!selectedSemesterId || isLoadingMarks) return [];
    return allStudentMarks
      .filter(mark => mark.semesterId === selectedSemesterId)
      .sort((a,b) => (a.subjectName || "").localeCompare(b.subjectName || "")); // Sort by subject name client-side
  }, [allStudentMarks, selectedSemesterId, isLoadingMarks]);

  const overallSemesterPerformance = useMemo(() => {
    if (marksForSelectedSemester.length === 0) return null;
    const totalMarksObtained = marksForSelectedSemester.reduce((sum, mark) => sum + (mark.total || 0), 0);
    const totalMaxMarks = marksForSelectedSemester.length * 100; 
    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    
    let gpaEquivalent = "N/A"; 
    if (percentage >= 90) gpaEquivalent = "4.0 (A+)";
    else if (percentage >= 80) gpaEquivalent = "3.5 (A)";
    else if (percentage >= 70) gpaEquivalent = "3.0 (B)";
    else if (percentage >= 60) gpaEquivalent = "2.5 (C)";
    else if (percentage >= 50) gpaEquivalent = "2.0 (D)";
    else gpaEquivalent = "1.0 (F)";

    return {
      totalSubjects: marksForSelectedSemester.length,
      averagePercentage: percentage.toFixed(2),
      gpaEquivalent,
    };
  }, [marksForSelectedSemester]);
  
  if (authLoading || !user || user.role !== "student") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  const isLoadingPageData = isLoadingMarks || isLoadingSemesters;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">My Academic Marks</CardTitle>
          <CardDescription>View your subject-wise marks for each semester.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPageData ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading your marks data...</div>
          ) : (
            <>
              {availableSemestersForStudent.length > 0 ? (
                <div className="mb-6">
                  <Label htmlFor="semesterStudentView" className="text-sm font-medium">Select Semester</Label>
                  <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                    <SelectTrigger id="semesterStudentView" className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select a semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSemestersForStudent.map(semester => (
                        <SelectItem key={semester.id} value={semester.id}>{semester.name} ({semester.year})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                !isLoadingPageData && allStudentMarks.length === 0 && (
                  <Alert variant="default" className="mt-4 border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-5 w-5 text-yellow-700" />
                    <AlertTitle className="font-semibold text-yellow-800">No Marks Data Found</AlertTitle>
                    <UiAlertDescription className="text-yellow-700">
                      It seems no marks have been recorded for your account yet. Please check back later or contact your teacher.
                      <br />
                      <strong>If you believe this is an error, please check your browser's developer console (F12) for Firestore index errors or permission issues.</strong>
                    </UiAlertDescription>
                  </Alert>
                )
              )}

              {selectedSemesterId && (
                <>
                {overallSemesterPerformance && (
                    <Card className="mb-6 bg-accent/10 border-accent">
                    <CardHeader>
                        <CardTitle className="text-xl text-accent">Semester Performance Summary</CardTitle>
                        <UiAlertDescription>{allSystemSemesters.find(s => s.id === selectedSemesterId)?.name} ({allSystemSemesters.find(s => s.id === selectedSemesterId)?.year})</UiAlertDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><span className="font-semibold">Total Subjects:</span> {overallSemesterPerformance.totalSubjects}</div>
                        <div><span className="font-semibold">Average Percentage:</span> {overallSemesterPerformance.averagePercentage}%</div>
                        <div><span className="font-semibold">GPA Equivalent:</span> {overallSemesterPerformance.gpaEquivalent}</div>
                    </CardContent>
                    </Card>
                )}
                {marksForSelectedSemester.length > 0 ? (
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>CA1 (10)</TableHead>
                          <TableHead>CA2 (10)</TableHead>
                          <TableHead>MidTerm (20)</TableHead>
                          <TableHead>EndTerm (60)</TableHead>
                          <TableHead>Total (100)</TableHead>
                          <TableHead>Grade</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {marksForSelectedSemester.map(mark => (
                          <TableRow key={mark.id}>
                          <TableCell className="font-medium">{mark.subjectName || "N/A"}</TableCell>
                          <TableCell>{mark.ca1 ?? '-'}</TableCell>
                          <TableCell>{mark.ca2 ?? '-'}</TableCell>
                          <TableCell>{mark.midTerm ?? '-'}</TableCell>
                          <TableCell>{mark.endTerm ?? '-'}</TableCell>
                          <TableCell className="font-semibold">{mark.total ?? '-'}</TableCell>
                          <TableCell>
                              <Badge variant={ (mark.grade?.startsWith("A") || mark.grade?.startsWith("B")) ? "default" : (mark.grade?.startsWith("C") || mark.grade?.startsWith("D")) ? "secondary" : "destructive"}>
                              {mark.grade ?? '-'}
                              </Badge>
                          </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
                ) : (
                  selectedSemesterId && !isLoadingMarks && ( // Only show if semester is selected and not loading
                     <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                      <AlertTriangle className="h-5 w-5 text-blue-700" />
                      <AlertTitle className="font-semibold text-blue-800">No Marks for this Semester</AlertTitle>
                      <UiAlertDescription className="text-blue-700">
                        No marks are available for the selected semester.
                        <br />
                        <strong>If data is expected, check your browser's developer console (F12) for Firestore index errors or permission issues.</strong>
                      </UiAlertDescription>
                    </Alert>
                  )
                )}
                </>
              )}
              {!selectedSemesterId && availableSemestersForStudent.length > 0 && !isLoadingPageData && (
                <p className="text-center text-muted-foreground mt-8">Please select a semester to view your marks.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
