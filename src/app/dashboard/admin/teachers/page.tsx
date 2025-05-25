
// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers } from "@/lib/firestore/users"; // Removed deleteUserFromFirestore 
import { getAssignmentsByTeacher } from "@/lib/firestore/teacherAssignments"; 
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, BookOpen, Edit2, Loader2, AlertTriangle } from "lucide-react"; // Added Edit2, removed Trash2
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
// Removed Dialog related imports as delete is removed
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ManageTeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});

  // Delete functionality removed for now
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // const [teacherToDelete, setTeacherToDelete] = useState<UserProfile | null>(null);
  // const [isDeleting, setIsDeleting] = useState(false);

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
              console.error(`Error fetching assignments for teacher ${teacher.uid} (${teacher.name}):`, assignmentError);
              counts[teacher.uid] = 0; 
              toast({
                  title: "Assignment Count Error",
                  description: `Could not fetch assignment count for ${teacher.name}. Check console for index or permission errors. ${assignmentError.message}`,
                  variant: "destructive"
              });
          }
        }
      }
      setAssignedCounts(counts);
      console.log("ManageTeachersPage: Fetched assignment counts:", counts);

    } catch (error: any) {
      console.error("Error fetching teachers:", error);
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

  // Delete functionality removed for now
  // const openDeleteDialog = (teacher: UserProfile) => {
  //   setTeacherToDelete(teacher);
  //   setIsDeleteDialogOpen(true);
  // };

  // const handleDeleteTeacher = async () => {
  //   if (!teacherToDelete) return;
  //   console.log("ManageTeachersPage: Attempting to delete teacher:", teacherToDelete.uid, teacherToDelete.name);
  //   setIsDeleting(true);
  //   try {
  //     await deleteUserFromFirestore(teacherToDelete.uid);
  //     toast({ title: "Teacher Deleted", description: `${teacherToDelete.name} has been removed from Firestore. Remember to delete from Firebase Authentication manually if needed.` });
  //     fetchTeachersAndCounts(); 
  //     console.log("ManageTeachersPage: Teacher deleted successfully from Firestore:", teacherToDelete.uid);
  //   } catch (error: any) {
  //     console.error("Error deleting teacher from Firestore:", error);
  //     toast({ title: "Error Deleting Teacher", description: `Could not delete ${teacherToDelete.name}. Check console for Firestore errors or permissions. Error: ${error.message}`, variant: "destructive" });
  //   } finally {
  //     setIsDeleting(false);
  //     setIsDeleteDialogOpen(false);
  //     setTeacherToDelete(null);
  //   }
  // };

  const handleEditTeacher = () => {
    toast({ title: "Feature Coming Soon", description: "Editing teacher details will be available in a future update." });
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
          <p className="text-muted-foreground">View teacher records. New teachers are added via the Signup page.</p>
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

      {/* Delete Teacher Confirmation Dialog Removed */}

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
             <div className="flex justify-center items-center h-60">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-lg">Loading teachers...</p>
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
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/assign-subjects?teacherId=${teacher.uid}`)}>
                              <BookOpen className="mr-2 h-4 w-4" /> Manage Subjects
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleEditTeacher}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Teacher
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
                <AlertTitle className="font-semibold text-blue-800">No Teachers Found</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  {searchTerm ? "No teachers match your search criteria." : "No teachers have been registered in the system yet. Use the 'Add Teacher' button or the Signup page."}
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
