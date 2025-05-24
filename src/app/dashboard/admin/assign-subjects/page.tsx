// src/app/dashboard/admin/assign-subjects/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-provider";
import { mockTeacherAssignments, mockTeachers, mockSubjects, mockSemesters } from "@/lib/mock-data";
import type { TeacherSubjectAssignment } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, Edit2, Trash2, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

export default function AssignSubjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>(mockTeacherAssignments);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => 
      (!selectedTeacher || assignment.teacherId === selectedTeacher) &&
      (!selectedSubject || assignment.subjectId === selectedSubject) &&
      (!selectedSemester || assignment.semesterId === selectedSemester)
    );
  }, [assignments, selectedTeacher, selectedSubject, selectedSemester]);

  if (loading || !user || user.role !== "admin") {
    return <p>Loading or unauthorized...</p>;
  }

  const handleAddAssignment = () => {
    // Logic to add a new assignment (would typically open a dialog or navigate to a form)
    console.log("Add new assignment");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assign Subjects to Teachers</h1>
          <p className="text-muted-foreground">Manage teacher-subject assignments for each semester.</p>
        </div>
        <Button onClick={handleAddAssignment}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>List of subjects assigned to teachers for various semesters.</CardDescription>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="teacherFilter" className="text-sm font-medium">Filter by Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger id="teacherFilter">
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Teachers</SelectItem>
                  {mockTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
             <label htmlFor="subjectFilter" className="text-sm font-medium">Filter by Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subjectFilter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {mockSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
            <label htmlFor="semesterFilter" className="text-sm font-medium">Filter by Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semesterFilter">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Semesters</SelectItem>
                  {mockSemesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="md:col-span-1" onClick={() => {setSelectedTeacher(""); setSelectedSubject(""); setSelectedSemester("")}}>
                <Filter className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.length > 0 ? filteredAssignments.map((assignment: TeacherSubjectAssignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.teacherName || mockTeachers.find(t=>t.id === assignment.teacherId)?.name}</TableCell>
                  <TableCell>{assignment.subjectName || mockSubjects.find(s=>s.id === assignment.subjectId)?.name}</TableCell>
                  <TableCell>{assignment.semesterName || mockSemesters.find(sem=>sem.id === assignment.semesterId)?.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Assignment
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Assignment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No assignments found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
