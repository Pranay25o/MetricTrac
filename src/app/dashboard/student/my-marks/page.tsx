// src/app/dashboard/student/my-marks/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { mockMarks, mockSubjects, mockSemesters } from "@/lib/mock-data";
import type { Mark } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

export default function MyMarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const studentMarks = useMemo(() => {
    if (!user) return [];
    return mockMarks.filter(mark => mark.studentId === user.id);
  }, [user]);

  const availableSemestersForStudent = useMemo(() => {
    const semesterIds = new Set(studentMarks.map(mark => mark.semesterId));
    return mockSemesters.filter(semester => semesterIds.has(semester.id))
      .sort((a,b) => b.year - a.year || (b.name > a.name ? 1 : -1)); // Sort by year then name desc
  }, [studentMarks]);

  useEffect(() => {
    // Auto-select the latest semester if available
    if (availableSemestersForStudent.length > 0 && !selectedSemester) {
      setSelectedSemester(availableSemestersForStudent[0].id);
    }
  }, [availableSemestersForStudent, selectedSemester]);


  const marksForSelectedSemester = useMemo(() => {
    if (!selectedSemester) return [];
    return studentMarks
      .filter(mark => mark.semesterId === selectedSemester)
      .map(mark => ({
        ...mark,
        subjectName: mark.subjectName || mockSubjects.find(s => s.id === mark.subjectId)?.name || "Unknown Subject",
      }));
  }, [studentMarks, selectedSemester]);

  if (loading || !user || user.role !== "student") {
    return <p>Loading or unauthorized...</p>;
  }

  const overallSemesterPerformance = useMemo(() => {
    if (marksForSelectedSemester.length === 0) return null;
    const totalMarksObtained = marksForSelectedSemester.reduce((sum, mark) => sum + (mark.total || 0), 0);
    const totalMaxMarks = marksForSelectedSemester.length * 100; // Assuming each subject is out of 100
    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    
    let gpaEquivalent = "N/A"; // Simplified GPA
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">My Academic Marks</CardTitle>
          <CardDescription>View your subject-wise marks for each semester.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label htmlFor="semesterStudentView" className="text-sm font-medium">Select Semester</label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
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

          {selectedSemester && (
            <>
             {overallSemesterPerformance && (
                <Card className="mb-6 bg-accent/10 border-accent">
                  <CardHeader>
                    <CardTitle className="text-accent">Semester Performance Summary</CardTitle>
                    <CardDescription>{mockSemesters.find(s => s.id === selectedSemester)?.name}</CardDescription>
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
                      <TableCell className="font-medium">{mark.subjectName}</TableCell>
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
          {!selectedSemester && availableSemestersForStudent.length > 0 && (
             <p className="text-center text-muted-foreground mt-8">Please select a semester to view your marks.</p>
          )}
          {availableSemestersForStudent.length === 0 && (
             <p className="text-center text-muted-foreground mt-8">No marks data found for your account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
