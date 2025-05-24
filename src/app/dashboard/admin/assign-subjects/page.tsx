
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
import { addTeacherAssignment, getTeacherAssignments, deleteTeacherAssignment as deleteAssignmentFromDb, updateTeacherAssignment } from "@/lib/firestore/teacherAssignments";
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
  
  const [isLoading, setIsLoading] = useState(true); // For initial data load (teachers, subjects, semesters)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true); // For loading assignments list

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

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherSubjectAssignment | null>(null);
  const [editAssignmentTeacherUid, setEditAssignmentTeacherUid] = useState<string>("");
  const [editAssignmentSubjectId, setEditAssignmentSubjectId] = useState<string>("");
  const [editAssignmentSemesterId, setEditAssignmentSemesterId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);


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
    console.log("AssignSubjectsPage: fetchData triggered");
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
      console.log("AssignSubjectsPage: Fetched prerequisite data:", { teachersCount: teachers.length, subjectsCount: subjects.length, semestersCount: semesters.length });
    } catch (error) {
      console.error("Error fetching prerequisite data:", error);
      toast({ title: "Error", description: "Could not load teachers, subjects, or semesters.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchAssignments = useCallback(async () => {
    console.log("AssignSubjectsPage: fetchAssignments triggered with filters:", { filterTeacher, filterSubject, filterSemester });
    setIsLoadingAssignments(true);
    try {
      const fetchedAssignments = await getTeacherAssignments({
        teacherUid: filterTeacher || undefined,
        subjectId: filterSubject || undefined,
        semesterId: filterSemester || undefined,
      });
      setAssignments(fetchedAssignments);
      console.log("AssignSubjectsPage: Fetched assignments:", fetchedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({ title: "Error", description: "Could not load assignments.", variant: "destructive" });
      setAssignments([]); // Clear assignments on error
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
  }, [user, filterTeacher, filterSubject, filterSemester, fetchAssignments]); // fetchAssignments is stable due to useCallback

  const handleAddAssignment = async () => {
    if (!newAssignmentTeacherUid || !newAssignmentSubjectId || !newAssignmentSemesterId) {
      toast({ title: "Validation Error", description: "Please select a teacher, subject, and semester.", variant: "destructive" });
      return;
    }
    
    const assignmentPayload = {
      teacherUid: newAssignmentTeacherUid,
      subjectId: newAssignmentSubjectId,
      semesterId: newAssignmentSemesterId,
    };
    console.log("AssignSubjectsPage: Attempting to add assignment with payload:", assignmentPayload);
    setIsSubmitting(true);

    try {
      const teacher = allTeachers.find(t => t.uid === newAssignmentTeacherUid);
      const subject = allSubjects.find(s => s.id === newAssignmentSubjectId);
      const semester = allSemesters.find(s => s.id === newAssignmentSemesterId);

      if (!teacher || !subject || !semester) {
        toast({ title: "Error", description: "Selected teacher, subject or semester not found.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const newAssignmentId = await addTeacherAssignment({ 
        teacherUid: newAssignmentTeacherUid,
        teacherName: teacher.name,
        subjectId: newAssignmentSubjectId,
        subjectName: subject.name,
        semesterId: newAssignmentSemesterId,
        semesterName: semester.name
      });
      console.log("AssignSubjectsPage: Successfully added assignment, new ID:", newAssignmentId);
      toast({ title: "Success", description: "Assignment added successfully." });
      setNewAssignmentTeacherUid("");
      setNewAssignmentSubjectId("");
      setNewAssignmentSemesterId("");
      setIsAddDialogOpen(false);
      fetchAssignments(); 
    } catch (error) {
      console.error("Error adding assignment:", error);
      toast({ title: "Error", description: "Could not add assignment. It might already exist or there was a server error.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (assignment: TeacherSubjectAssignment) => {
    console.log("AssignSubjectsPage: Opening edit dialog for assignment:", assignment);
    setEditingAssignment(assignment);
    setEditAssignmentTeacherUid(assignment.teacherUid);
    setEditAssignmentSubjectId(assignment.subjectId);
    setEditAssignmentSemesterId(assignment.semesterId);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !editAssignmentTeacherUid || !editAssignmentSubjectId || !editAssignmentSemesterId) {
      toast({ title: "Validation Error", description: "Please select a teacher, subject, and semester for the update.", variant: "destructive" });
      return;
    }
    
    const updatedAssignmentData: Partial<TeacherSubjectAssignment> = {
      teacherUid: editAssignmentTeacherUid,
      subjectId: editAssignmentSubjectId,
      semesterId: editAssignmentSemesterId,
    };
    console.log("AssignSubjectsPage: Attempting to update assignment ID:", editingAssignment.id, "with data:", updatedAssignmentData);
    setIsUpdating(true);

    try {
      const teacher = allTeachers.find(t => t.uid === editAssignmentTeacherUid);
      const subject = allSubjects.find(s => s.id === editAssignmentSubjectId);
      const semester = allSemesters.find(s => s.id === editAssignmentSemesterId);

      if (!teacher || !subject || !semester) {
        toast({ title: "Error", description: "Updated teacher, subject or semester not found.", variant: "destructive" });
        setIsUpdating(false);
        return;
      }
      
      const fullUpdatePayload: Partial<TeacherSubjectAssignment> = {
        teacherUid: editAssignmentTeacherUid,
        teacherName: teacher.name,
        subjectId: editAssignmentSubjectId,
        subjectName: subject.name,
        semesterId: editAssignmentSemesterId,
        semesterName: semester.name,
      };

      await updateTeacherAssignment(editingAssignment.id, fullUpdatePayload);
      console.log("AssignSubjectsPage: Successfully updated assignment:", editingAssignment.id);
      toast({ title: "Success", description: "Assignment updated successfully." });
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({ title: "Error", description: "Could not update assignment.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDeleteAssignment = async (assignmentId: string) => {
    console.log("AssignSubjectsPage: Attempting to delete assignment:", assignmentId);
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
        console.log("AssignSubjectsPage: Deletion cancelled by user for assignment:", assignmentId);
        return;
    }
    try {
      await deleteAssignmentFromDb(assignmentId);
      console.log("AssignSubjectsPage: Successfully deleted assignment:", assignmentId);
      toast({ title: "Success", description: "Assignment deleted successfully." });
      fetchAssignments(); 
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({ title: "Error", description: "Could not delete assignment.", variant: "destructive" });
    }
  };

  let noAssignmentsMessage = "No assignments found.";
  if (!isLoadingAssignments && !isLoading && assignments.length === 0) {
    if (filterTeacher || filterSubject || filterSemester) {
      noAssignmentsMessage = "No assignments match your current filters. Try clearing them or adding new assignments.";
    } else if (allTeachers.length === 0 || allSubjects.length === 0 || allSemesters.length === 0) {
      noAssignmentsMessage = "Cannot create assignments yet. Please ensure teachers, subjects, and semesters have been added to the system.";
    } else {
      noAssignmentsMessage = "No assignments have been created yet. Try adding a new assignment using the button above.";
    }
  }


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
                <Select value={newAssignmentTeacherUid} onValueChange={setNewAssignmentTeacherUid} disabled={allTeachers.length === 0 || isLoading}>
                  <SelectTrigger id="newAssignTeacher"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>
                    {allTeachers.map(t => <SelectItem key={t.uid} value={t.uid}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                 {allTeachers.length === 0 && !isLoading && <p className="text-xs text-muted-foreground mt-1">No teachers available. Please add teachers first.</p>}
              </div>
              <div>
                <Label htmlFor="newAssignSubject">Subject</Label>
                <Select value={newAssignmentSubjectId} onValueChange={setNewAssignmentSubjectId} disabled={allSubjects.length === 0 || isLoading}>
                  <SelectTrigger id="newAssignSubject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {allSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
                {allSubjects.length === 0 && !isLoading && <p className="text-xs text-muted-foreground mt-1">No subjects available. Please add subjects first.</p>}
              </div>
              <div>
                <Label htmlFor="newAssignSemester">Semester</Label>
                <Select value={newAssignmentSemesterId} onValueChange={setNewAssignmentSemesterId} disabled={allSemesters.length === 0 || isLoading}>
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

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editingAssignment && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="editAssignTeacher">Teacher</Label>
                <Select value={editAssignmentTeacherUid} onValueChange={setEditAssignmentTeacherUid} disabled={allTeachers.length === 0 || isLoading}>
                  <SelectTrigger id="editAssignTeacher"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>
                    {allTeachers.map(t => <SelectItem key={t.uid} value={t.uid}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editAssignSubject">Subject</Label>
                <Select value={editAssignmentSubjectId} onValueChange={setEditAssignmentSubjectId} disabled={allSubjects.length === 0 || isLoading}>
                  <SelectTrigger id="editAssignSubject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {allSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editAssignSemester">Semester</Label>
                <Select value={editAssignmentSemesterId} onValueChange={setEditAssignmentSemesterId} disabled={allSemesters.length === 0 || isLoading}>
                  <SelectTrigger id="editAssignSemester"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                  <SelectContent>
                    {allSemesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => setEditingAssignment(null)}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdateAssignment} disabled={isUpdating || isLoading || !editingAssignment || allTeachers.length === 0 || allSubjects.length === 0 || allSemesters.length === 0}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="flex justify-center items-center h-60"> {/* Increased height for loader visibility */}
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-lg">Loading assignments...</p>
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
                        <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    {noAssignmentsMessage}
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

