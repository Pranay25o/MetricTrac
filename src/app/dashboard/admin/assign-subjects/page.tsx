
// src/app/dashboard/admin/assign-subjects/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { getSemesters } from "@/lib/firestore/semesters";
import { getSubjects } from "@/lib/firestore/subjects";
import { getUsers } from "@/lib/firestore/users";
import { addTeacherAssignment, getTeacherAssignments, deleteTeacherAssignment as deleteAssignmentFromDb } from "@/lib/firestore/teacherAssignments";
import type { TeacherSubjectAssignment, UserProfile, Subject, Semester } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Filter, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AssignSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [allTeachers, setAllTeachers] = useState<UserProfile[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Filters
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("");

  // Add Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAssignmentTeacherUid, setNewAssignmentTeacherUid] = useState<string>("");
  const [newAssignmentSubjectId, setNewAssignmentSubjectId] = useState<string>("");
  const [newAssignmentSemesterId, setNewAssignmentSemesterId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const teacherIdFromQuery = searchParams.get("teacherId");
    if (teacherIdFromQuery) {
      setFilterTeacher(teacherIdFromQuery);
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachers, subjects, semesters] = await Promise.all([
        getUsers("teacher"),
        getSubjects(),
        getSemesters(),
      ]);
      setAllTeachers(teachers);
      setAllSubjects(subjects);
      setAllSemesters(semesters);
    } catch (error) {
      console.error("Error fetching prerequisite data:", error);
      toast({ title: "Error", description: "Could not load teachers, subjects, or semesters.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const fetchedAssignments = await getTeacherAssignments({
        teacherUid: filterTeacher || undefined,
        subjectId: filterSubject || undefined,
        semesterId: filterSemester || undefined,
      });
      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({ title: "Error", description: "Could not load assignments.", variant: "destructive" });
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [toast, filterTeacher, filterSubject, filterSemester]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user, fetchData]);
  
  useEffect(() => {
    if (user && user.role === "admin") {
     fetchAssignments();
    }
  }, [user, filterTeacher, filterSubject, filterSemester, fetchAssignments]);

  const handleAddAssignment = async () => {
    if (!newAssignmentTeacherUid || !newAssignmentSubjectId || !newAssignmentSemesterId) {
      toast({ title: "Validation Error", description: "Please select a teacher, subject, and semester.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const teacher = allTeachers.find(t => t.uid === newAssignmentTeacherUid);
      const subject = allSubjects.find(s => s.id === newAssignmentSubjectId);
      const semester = allSemesters.find(s => s.id === newAssignmentSemesterId);

      if (!teacher || !subject || !semester) {
        toast({ title: "Error", description: "Selected teacher, subject or semester not found.", variant: "destructive" });
        setIsSubmitting(false); // Ensure button is re-enabled
        return;
      }

      await addTeacherAssignment({ 
        teacherUid: newAssignmentTeacherUid,
        teacherName: teacher.name,
        subjectId: newAssignmentSubjectId,
        subjectName: subject.name,
        semesterId: newAssignmentSemesterId,
        semesterName: semester.name
      });
      toast({ title: "Success", description: "Assignment added successfully." });
      setNewAssignmentTeacherUid("");
      setNewAssignmentSubjectId("");
      setNewAssignmentSemesterId("");
      setIsAddDialogOpen(false);
      fetchAssignments(); // Refresh list
    } catch (error) {
      console.error("Error adding assignment:", error);
      toast({ title: "Error", description: "Could not add assignment. It might already exist.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignmentFromDb(assignmentId);
      toast({ title: "Success", description: "Assignment deleted successfully." });
      fetchAssignments(); // Refresh list
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({ title: "Error", description: "Could not delete assignment.", variant: "destructive" });
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Assign Subjects to Teachers</h1>
          <p className="text-muted-foreground">Manage teacher-subject assignments for each semester.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="newAssignTeacher">Teacher</Label>
                <Select value={newAssignmentTeacherUid} onValueChange={setNewAssignmentTeacherUid} disabled={allTeachers.length === 0}>
                  <SelectTrigger id="newAssignTeacher"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>
                    {allTeachers.map(t => <SelectItem key={t.uid} value={t.uid}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                 {allTeachers.length === 0 && !isLoading && <p className="text-xs text-muted-foreground mt-1">No teachers available. Please add teachers first.</p>}
              </div>
              <div>
                <Label htmlFor="newAssignSubject">Subject</Label>
                <Select value={newAssignmentSubjectId} onValueChange={setNewAssignmentSubjectId} disabled={allSubjects.length === 0}>
                  <SelectTrigger id="newAssignSubject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {allSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                {allSubjects.length === 0 && !isLoading && <p className="text-xs text-muted-foreground mt-1">No subjects available. Please add subjects first.</p>}
              </div>
              <div>
                <Label htmlFor="newAssignSemester">Semester</Label>
                <Select value={newAssignmentSemesterId} onValueChange={setNewAssignmentSemesterId} disabled={allSemesters.length === 0}>
                  <SelectTrigger id="newAssignSemester"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {allSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {allSemesters.length === 0 && !isLoading && <p className="text-xs text-muted-foreground mt-1">No semesters available. Please add semesters first.</p>}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddAssignment} disabled={isSubmitting || isLoading || allTeachers.length === 0 || allSubjects.length === 0 || allSemesters.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>List of subjects assigned to teachers for various semesters.</CardDescription>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <Label htmlFor="teacherFilter" className="text-sm font-medium">Filter by Teacher</Label>
              <Select value={filterTeacher} onValueChange={setFilterTeacher} disabled={isLoading || allTeachers.length === 0}>
                <SelectTrigger id="teacherFilter"><SelectValue placeholder="All Teachers" /></SelectTrigger>
                <SelectContent>
                  {allTeachers.map(teacher => <SelectItem key={teacher.uid} value={teacher.uid}>{teacher.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
             <Label htmlFor="subjectFilter" className="text-sm font-medium">Filter by Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject} disabled={isLoading || allSubjects.length === 0}>
                <SelectTrigger id="subjectFilter"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  {allSubjects.map(subject => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
            <Label htmlFor="semesterFilter" className="text-sm font-medium">Filter by Semester</Label>
              <Select value={filterSemester} onValueChange={setFilterSemester} disabled={isLoading || allSemesters.length === 0}>
                <SelectTrigger id="semesterFilter"><SelectValue placeholder="All Semesters" /></SelectTrigger>
                <SelectContent>
                  {allSemesters.map(semester =><SelectItem key={semester.id} value={semester.id}>{semester.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="md:col-span-1" onClick={() => {setFilterTeacher(""); setFilterSubject(""); setFilterSemester("")}} disabled={isLoadingAssignments || isLoading}>
                <Filter className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments || isLoading ? (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading assignments...</p>
            </div>
          ) : (
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
              {assignments.length > 0 ? assignments.map((assignment: TeacherSubjectAssignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.teacherName}</TableCell>
                  <TableCell>{assignment.subjectName}</TableCell>
                  <TableCell>{assignment.semesterName}</TableCell>
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
                        <DropdownMenuItem onClick={() => console.log("Edit assignment:", assignment.id) /* TODO */}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Assignment
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Assignment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No assignments found. {assignments.length === 0 && !filterTeacher && !filterSubject && !filterSemester && (allTeachers.length === 0 || allSubjects.length === 0 || allSemesters.length === 0) ? "Please ensure teachers, subjects, and semesters are added before creating assignments." : assignments.length === 0 && !filterTeacher && !filterSubject && !filterSemester ? "Try adding an assignment." : "Try clearing filters or adding an assignment."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
