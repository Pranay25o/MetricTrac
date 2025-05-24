
// src/app/dashboard/admin/teachers/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-provider";
import { mockTeachers, mockTeacherAssignments } from "@/lib/mock-data"; // Will be replaced
import type { UserProfile } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, FileDown, Edit2, Trash2, Eye, BookOpen } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

// TODO: Replace mockTeachers with actual data fetching from Firestore
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { db } from "@/lib/firebase";

export default function ManageTeachersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<UserProfile[]>(mockTeachers); // Initially use mock

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
    // TODO: Fetch actual teacher data from Firestore
    // const fetchTeachers = async () => {
    //   if (user && user.role === 'admin') {
    //     const q = query(collection(db, "users"), where("role", "==", "teacher"));
    //     const querySnapshot = await getDocs(q);
    //     const teacherList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    //     setTeachers(teacherList);
    //   }
    // };
    // fetchTeachers();
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return <p>Loading or unauthorized...</p>;
  }
  
  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssignedSubjectsCount = (teacherUid: string) => {
    // TODO: This will need to query Firestore or use a more efficient data structure
    // For now, it uses mock data.
    return mockTeacherAssignments.filter(assignment => assignment.teacherUid === teacherUid).length;
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Teachers</h1>
          <p className="text-muted-foreground">View, add, edit, or delete teacher records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button>
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
                    <Badge variant="secondary">{getAssignedSubjectsCount(teacher.uid)}</Badge>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Teacher
                        </DropdownMenuItem>
                         <DropdownMenuItem>
                          <BookOpen className="mr-2 h-4 w-4" /> Manage Subjects
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No teachers found.
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
