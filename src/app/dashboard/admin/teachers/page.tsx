
// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers, deleteUserFromFirestore, updateUserFirestoreDetails } from "@/lib/firestore/users"; 
import { getAssignmentsByTeacher } from "@/lib/firestore/teacherAssignments"; 
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription as UiDialogDescription } from "@/components/ui/dialog";
import { Alert, AlertTitle as UiAlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";


export default function ManageTeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeachersAndCounts = useCallback(async () => {
    console.log("ManageTeachersPage: fetchTeachersAndCounts triggered");
    setIsLoading(true);
    try {
      const fetchedTeachers = await getUsers("teacher");
      setTeachers(fetchedTeachers);
      console.log("ManageTeachersPage: Fetched teachers:", fetchedTeachers.length);

      const counts: Record<string, number> = {};
      if (fetchedTeachers.length > 0) {
        for (const teacher of fetchedTeachers) {
          try {
              const assignments = await getAssignmentsByTeacher(teacher.uid);
              counts[teacher.uid] = assignments.length;
          } catch (assignmentError: any) {
              console.error(`ManageTeachersPage: Error fetching assignments for teacher ${teacher.uid} (${teacher.name}):`, assignmentError);
              counts[teacher.uid] = 0; 
              toast({
                  title: "Assignment Count Error",
                  description: `Could not fetch assignment count for ${teacher.name}. Check console for index or permission errors. ${assignmentError.message}`,
                  variant: "destructive",
                  duration: 5000,
              });
          }
        }
      }
      setAssignedCounts(counts);
      console.log("ManageTeachersPage: Fetched assignment counts:", counts);

    } catch (error: any) {
      console.error("ManageTeachersPage: Error fetching teachers:", error);
      toast({ title: "Error Fetching Teachers", description: `Could not fetch teacher records. Check console for Firestore index or permission errors. Error: ${error.message}`, variant: "destructive" });
      setTeachers([]);
      setAssignedCounts({});
    } finally {
      setIsLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    console.log("ManageTeachersPage: useEffect for fetching teachers. User:", !!user, "Role:", user?.role, "AuthLoading:", authLoading);
    if (user && user.role === 'admin' && !authLoading) {
      fetchTeachersAndCounts();
    }
  }, [user, authLoading, fetchTeachersAndCounts]);

  const openEditDialog = (teacher: UserProfile) => {
    console.log("ManageTeachersPage: Opening edit dialog for teacher:", teacher);
    setEditingTeacher(teacher);
    setEditTeacherName(teacher.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher || !editTeacherName.trim()) {
      toast({ title: "Validation Error", description: "Teacher name cannot be empty.", variant: "destructive" });
      return;
    }
    console.log("ManageTeachersPage: Attempting to update teacher ID:", editingTeacher.uid, "to Name:", editTeacherName);
    setIsUpdating(true);
    try {
      await updateUserFirestoreDetails(editingTeacher.uid, { name: editTeacherName.trim() });
      toast({ title: "Success", description: "Teacher details updated successfully." });
      fetchTeachersAndCounts(); 
    } catch (error: any) {
      console.error("ManageTeachersPage: Error updating teacher:", error);
      toast({ title: "Error Updating Teacher", description: `Could not update teacher details. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUpdating(false);
      setIsEditDialogOpen(false);
      setEditingTeacher(null);
    }
  };


  const openDeleteDialog = (teacher: UserProfile) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    console.log("ManageTeachersPage: Attempting to delete teacher from Firestore:", teacherToDelete.uid, teacherToDelete.name);
    setIsDeleting(true);
    try {
      await deleteUserFromFirestore(teacherToDelete.uid);
      toast({ title: "Teacher Deleted from Database", description: `${teacherToDelete.name} has been removed from the database. Remember to delete from Firebase Authentication manually if needed.` });
      fetchTeachersAndCounts(); 
      console.log("ManageTeachersPage: Teacher document deleted successfully from Firestore:", teacherToDelete.uid);
    } catch (error: any) {
      console.error("ManageTeachersPage: Error deleting teacher from Firestore:", error);
      toast({ 
        title: "Error Deleting Teacher Record", 
        description: `Could not delete ${teacherToDelete.name}'s record. Check console for Firestore errors (e.g., permissions or function errors). Error: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    }
  };
  
  const filteredTeachers = useMemo(() => teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [teachers, searchTerm]);

  if (authLoading || !user || user.role !== "admin") {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Teachers</h1>
          <p className="text-muted-foreground">View and manage teacher records. New teachers are added via the Signup page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Teacher data export feature is under development."})}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => router.push("/signup")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingTeacher(null); 
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher Details</DialogTitle>
            <UiDialogDescription>
              Modify the teacher's name. Email and role changes are not supported here.
            </UiDialogDescription>
          </DialogHeader>
          {editingTeacher && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="editTeacherName">Teacher Name</Label>
                <Input 
                  id="editTeacherName" 
                  value={editTeacherName} 
                  onChange={(e) => setEditTeacherName(e.target.value)} 
                  placeholder="Enter teacher's full name"
                />
              </div>
               <p className="text-xs text-muted-foreground">Email: {editingTeacher.email} (Cannot be changed)</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => {setEditingTeacher(null); setIsEditDialogOpen(false);}}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdateTeacher} disabled={isUpdating || !editingTeacher || !editTeacherName.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Teacher Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
        setIsDeleteDialogOpen(isOpen);
        if(!isOpen) setTeacherToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher Record</DialogTitle>
            <UiDialogDescription>
              Are you sure you want to delete the database record for {teacherToDelete?.name}? <br/>
              This action cannot be undone from here. <br />
              <strong>Important: This only deletes the teacher's record from the database. You must manually delete their account from Firebase Authentication.</strong>
            </UiDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteTeacher} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Teacher Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>A list of all registered teachers in the system. If data isn't showing, check console (F12) for errors.</CardDescription>
           <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search teachers by name or email..." 
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex flex-col justify-center items-center h-60"> {/* Added flex-col for better centering */}
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-lg mt-2">Loading teachers...</p> {/* Added margin-top */}
            </div>
          ) : (
            teachers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Subjects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher: UserProfile) => (
                    <TableRow key={teacher.uid}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{assignedCounts[teacher.uid] ?? <Loader2 className="h-3 w-3 animate-spin" />}</Badge>
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => openEditDialog(teacher)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Teacher
                            </DropdownMenuItem>
                             <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(teacher)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Teacher
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50"> {/* Using blue for informational */}
                <AlertTriangle className="h-5 w-5 text-blue-700" />
                <UiAlertTitle className="font-semibold text-blue-800">No Teachers Found</UiAlertTitle>
                <UiAlertDescription className="text-blue-700">
                  {searchTerm ? "No teachers match your search criteria." : "No teachers have been registered in the system yet. Use the 'Add Teacher' button or the Signup page."}
                  <br/><strong>If data is expected but not showing, please check your browser's developer console (F12) for Firestore index errors or permission issues.</strong>
                </UiAlertDescription>
              </Alert>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

