
// src/app/dashboard/admin/students/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers, deleteUserFromFirestore } from "@/lib/firestore/users";
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, Trash2, Eye, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as UiDialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ManageStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    console.log("ManageStudentsPage: fetchStudents triggered");
    setIsLoading(true);
    try {
      const fetchedStudents = await getUsers("student");
      setStudents(fetchedStudents);
      console.log("ManageStudentsPage: Fetched students:", fetchedStudents.length);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({ title: "Error Fetching Students", description: "Could not fetch student records. Check console for Firestore index or permission errors.", variant: "destructive" });
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    console.log("ManageStudentsPage: useEffect for fetching students. User:", !!user, "Role:", user?.role, "AuthLoading:", authLoading);
    if (user && user.role === 'admin' && !authLoading) {
      fetchStudents();
    }
  }, [user, authLoading, fetchStudents]);

  const openDeleteDialog = (student: UserProfile) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    console.log("ManageStudentsPage: Attempting to delete student:", studentToDelete.uid, studentToDelete.name);
    setIsDeleting(true);
    try {
      await deleteUserFromFirestore(studentToDelete.uid);
      toast({ title: "Student Deleted", description: `${studentToDelete.name} has been removed from the database. Remember to delete from Firebase Authentication manually if needed.` });
      fetchStudents(); 
      console.log("ManageStudentsPage: Student deleted successfully from Firestore:", studentToDelete.uid);
    } catch (error: any) {
      console.error("Error deleting student from Firestore:", error);
      toast({ title: "Error Deleting Student", description: `Could not delete ${studentToDelete.name}. Check console for Firestore errors (e.g., permissions or function issues). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };
  
  const filteredStudents = useMemo(() => students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.prn && student.prn.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [students, searchTerm]);

  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Students</h1>
          <p className="text-muted-foreground">View student records. New students are added via the Signup page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Student data export feature is under development."})}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => router.push("/signup")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

       {/* Delete Student Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
        setIsDeleteDialogOpen(isOpen);
        if (!isOpen) setStudentToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <UiDialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This will remove their record from Firestore.
              You may also need to manually delete their account from Firebase Authentication. This action cannot be undone.
            </UiDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteStudent} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>A list of all registered students in the system.</CardDescription>
           <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students by name, email, or PRN..." 
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-lg">Loading students...</p>
            </div>
          ) : (
            students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>PRN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: UserProfile) => (
                    <TableRow key={student.uid}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.prn || "N/A"}</TableCell>
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
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/student/performance-analysis?studentId=${student.uid}&studentName=${encodeURIComponent(student.name)}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Performance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(student)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert variant="default" className="mt-4 border-blue-500 bg-blue-50">
                <AlertTriangle className="h-5 w-5 text-blue-700" />
                <AlertTitle className="font-semibold text-blue-800">No Students Found</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  {searchTerm ? "No students match your search criteria." : "No students have been registered in the system yet. Use the 'Add Student' button or the Signup page."}
                  <br />
                  <strong>If data is expected but not showing, please check your browser's developer console (F12) for Firestore index errors or permission issues.</strong>
                </UiAlertDescription>
              </Alert>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
