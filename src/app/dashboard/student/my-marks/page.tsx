
// src/app/dashboard/student/my-marks/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label"; // Added import
import { useAuth } from "@/contexts/auth-provider";
import { getMarksByStudent } from "@/lib/firestore/marks";
import { getSemesters } from "@/lib/firestore/semesters"; // To get all semester names for filtering
import type { Mark, Semester } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MyMarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allStudentMarks, setAllStudentMarks] = useState<Mark[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]); // All semesters in the system
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
    setIsLoadingMarks(true);
    try {
      const marks = await getMarksByStudent(user.uid);
      setAllStudentMarks(marks);
    } catch (error) {
      console.error("Error fetching student marks:", error);
      toast({ title: "Error", description: "Could not fetch your marks.", variant: "destructive" });
    } finally {
      setIsLoadingMarks(false);
    }
  }, [user, toast]);

  const fetchAllSemesters = useCallback(async () => {
    setIsLoadingSemesters(true);
    try {
      const semesters = await getSemesters();
      setAllSemesters(semesters);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast({ title: "Error", description: "Could not load semester list.", variant: "destructive" });
    } finally {
      setIsLoadingSemesters(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchStudentMarks();
      fetchAllSemesters();
    }
  }, [user, fetchStudentMarks, fetchAllSemesters]);

  const availableSemestersForStudent = useMemo(() => {
    if (isLoadingMarks || isLoadingSemesters) return [];
    const semesterIdsInMarks = new Set(allStudentMarks.map(mark => mark.semesterId));
    return allSemesters
      .filter(semester => semesterIdsInMarks.has(semester.id))
      .sort((a,b) => b.year - a.year || (b.name > a.name ? 1 : -1)); 
  }, [allStudentMarks, allSemesters, isLoadingMarks, isLoadingSemesters]);

  useEffect(() => {
    // Auto-select the most recent semester if not already selected
    if (availableSemestersForStudent.length > 0 && !selectedSemesterId) {
      setSelectedSemesterId(availableSemestersForStudent[0].id);
    }
  }, [availableSemestersForStudent, selectedSemesterId]);

  const marksForSelectedSemester = useMemo(() => {
    if (!selectedSemesterId || isLoadingMarks) return [];
    return allStudentMarks
      .filter(mark => mark.semesterId === selectedSemesterId);
  }, [allStudentMarks, selectedSemesterId, isLoadingMarks]);

  const overallSemesterPerformance = useMemo(() => {
    if (marksForSelectedSemester.length === 0) return null;
    const totalMarksObtained = marksForSelectedSemester.reduce((sum, mark) => sum + (mark.total || 0), 0);
    // Assume each subject is out of 100 for percentage calculation.
    // A more robust way would be to sum max marks if they vary per subject, but 100 is standard here.
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

  const isLoading = isLoadingMarks || isLoadingSemesters;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">My Academic Marks</CardTitle>
          <CardDescription>View your subject-wise marks for each semester.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading your data...</div>
          ) : (
            <>
              <div className="mb-6">
                <Label htmlFor="semesterStudentView" className="text-sm font-medium">Select Semester</Label>
                <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId} disabled={availableSemestersForStudent.length === 0}>
                  <SelectTrigger id="semesterStudentView" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemestersForStudent.map(semester => (
                      <SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSemesterId && (
                <>
                {overallSemesterPerformance && (
                    <Card className="mb-6 bg-accent/10 border-accent">
                    <CardHeader>
                        <CardTitle className="text-xl text-accent">Semester Performance Summary</CardTitle>
                        <CardDescription>{allSemesters.find(s => s.id === selectedSemesterId)?.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><span className="font-semibold">Total Subjects:</span> {overallSemesterPerformance.totalSubjects}</div>
                        <div><span className="font-semibold">Average Percentage:</span> {overallSemesterPerformance.averagePercentage}%</div>
                        <div><span className="font-semibold">GPA Equivalent:</span> {overallSemesterPerformance.gpaEquivalent}</div>
                    </CardContent>
                    </Card>
                )}
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
                    {marksForSelectedSemester.length > 0 ? marksForSelectedSemester.map(mark => (
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
                    )) : (
                        <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            No marks available for this semester.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </>
              )}
              {!selectedSemesterId && availableSemestersForStudent.length > 0 && (
                <p className="text-center text-muted-foreground mt-8">Please select a semester to view your marks.</p>
              )}
              {availableSemestersForStudent.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground mt-8">No marks data found for your account.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
