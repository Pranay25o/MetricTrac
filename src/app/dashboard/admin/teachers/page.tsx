
// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { getUsers } from "@/lib/firestore/users";
import { getAssignmentsByTeacher } from "@/lib/firestore/teacherAssignments"; 
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, Edit2, Trash2, Eye, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ManageTeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchTeachersAndCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTeachers = await getUsers("teacher");
      setTeachers(fetchedTeachers);

      const counts: Record<string, number> = {};
      for (const teacher of fetchedTeachers) {
        const assignments = await getAssignmentsByTeacher(teacher.uid);
        counts[teacher.uid] = assignments.length;
      }
      setAssignedCounts(counts);

    } catch (error) {
      console.error("Error fetching teachers or assignments:", error);
      toast({ title: "Error", description: "Could not fetch teacher records or assignment counts.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchTeachersAndCounts();
    }
  }, [user, fetchTeachersAndCounts]);

  if (authLoading || !user || user.role !== "admin") {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }
  
  const filteredTeachers = useMemo(() => teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [teachers, searchTerm]);

  // TODO: Implement Add Teacher Dialog
  // TODO: Implement Edit Teacher Dialog
  // TODO: Implement Delete Teacher

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Teachers</h1>
          <p className="text-muted-foreground">View, add, edit, or delete teacher records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log("Export teachers") /* TODO */}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => console.log("Add teacher") /* TODO */}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>A list of all registered teachers in the system.</CardDescription>
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
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading teachers...</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Subjects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? filteredTeachers.map((teacher: UserProfile) => (
                <TableRow key={teacher.uid}>
                  <TableCell>
                    <Image 
                      src={teacher.avatarUrl || "https://placehold.co/40x40.png"} 
                      alt={teacher.name} 
                      width={40} 
                      height={40} 
                      className="rounded-full"
                      data-ai-hint="teacher avatar"
                    />
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => console.log("View teacher details", teacher.uid) /* TODO: Link to a teacher detail page if any */}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Edit teacher", teacher.uid) /* TODO */}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Teacher
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/assign-subjects?teacherId=${teacher.uid}`)}>
                          <BookOpen className="mr-2 h-4 w-4" /> Manage Subjects
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => console.log("Delete teacher", teacher.uid) /* TODO */}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No teachers found. {teachers.length === 0 && !searchTerm ? "No teachers registered yet. Please add teachers to the system." : "Clear search or add teachers."}
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
