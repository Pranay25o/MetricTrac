
// src/app/dashboard/admin/students/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers } from "@/lib/firestore/users";
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, Edit2, Trash2, Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ManageStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedStudents = await getUsers("student");
      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({ title: "Error", description: "Could not fetch student records.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStudents();
    }
  }, [user, fetchStudents]);


  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }
  
  const filteredStudents = useMemo(() => students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.prn && student.prn.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [students, searchTerm]);

  // TODO: Implement Add Student Dialog (likely involves creating Firebase Auth user then profile in Firestore)
  // TODO: Implement Edit Student Dialog
  // TODO: Implement Delete Student (delete from Auth and Firestore)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Students</h1>
          <p className="text-muted-foreground">View, add, edit, or delete student records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log("Export students") /* TODO */}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => console.log("Add student clicked") /* TODO: Open Add Student Dialog */}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

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
            <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading students...</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>PRN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? filteredStudents.map((student: UserProfile) => (
                <TableRow key={student.uid}>
                  <TableCell>
                    <Image 
                      src={student.avatarUrl || `https://placehold.co/40x40.png`} 
                      alt={student.name} 
                      width={40} 
                      height={40} 
                      className="rounded-full"
                      data-ai-hint="student avatar" 
                    />
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/student/${student.uid}/performance-analysis`)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Edit student:", student.uid) /* TODO */}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => console.log("Delete student:", student.uid) /* TODO */}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No students found. {students.length === 0 && !searchTerm ? "No students registered yet. Please add students to the system." : "Clear search or add students."}
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
