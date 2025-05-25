
// src/app/dashboard/admin/subjects/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription as UiDialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { addSubject, getSubjects, deleteSubject as deleteSubjectFromDb, updateSubject } from "@/lib/firestore/subjects";
import type { Subject } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ManageSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectCode, setEditSubjectCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchSubjects = useCallback(async () => {
    console.log("ManageSubjectsPage: fetchSubjects triggered");
    setIsLoading(true);
    try {
      const fetchedSubjects = await getSubjects();
      setSubjects(fetchedSubjects);
      console.log("ManageSubjectsPage: Fetched subjects:", fetchedSubjects.length);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      toast({ title: "Error Fetching Subjects", description: `Could not fetch subjects. Check console for Firestore index or permission errors. Error: ${error.message}`, variant: "destructive" });
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === "admin" && !authLoading) {
      fetchSubjects();
    }
  }, [user, authLoading, fetchSubjects]);

  const handleAddSubject = async () => {
    if (!newSubjectName || !newSubjectCode) {
      toast({ title: "Validation Error", description: "Subject Name and Code are required.", variant: "destructive" });
      return;
    }
    console.log("ManageSubjectsPage: Adding subject:", { name: newSubjectName, code: newSubjectCode });
    setIsSubmitting(true);
    try {
      await addSubject({ name: newSubjectName, code: newSubjectCode });
      toast({ title: "Success", description: "Subject added successfully." });
      setNewSubjectName("");
      setNewSubjectCode("");
      setIsAddDialogOpen(false);
      fetchSubjects(); 
    } catch (error: any) {
      console.error("Error adding subject:", error);
      toast({ title: "Error Adding Subject", description: `Could not add subject. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    console.log("ManageSubjectsPage: Opening edit dialog for subject:", subject);
    setEditingSubject(subject);
    setEditSubjectName(subject.name);
    setEditSubjectCode(subject.code);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !editSubjectName || !editSubjectCode) {
      toast({ title: "Validation Error", description: "Subject Name and Code are required for update.", variant: "destructive" });
      return;
    }
    console.log("ManageSubjectsPage: Updating subject ID:", editingSubject.id, "to Name:", editSubjectName, "Code:", editSubjectCode);
    setIsUpdating(true);
    try {
      await updateSubject(editingSubject.id, { name: editSubjectName, code: editSubjectCode });
      toast({ title: "Success", description: "Subject updated successfully." });
      fetchSubjects();
    } catch (error: any) {
      console.error("Error updating subject:", error);
      toast({ title: "Error Updating Subject", description: `Could not update subject. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUpdating(false);
      setIsEditDialogOpen(false);
      setEditingSubject(null);
    }
  };

  const openDeleteDialog = (subject: Subject) => {
    setSubjectToDelete(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    console.log("ManageSubjectsPage: Attempting to delete subject:", subjectToDelete.id, subjectToDelete.name);
    setIsDeleting(true);
    try {
      await deleteSubjectFromDb(subjectToDelete.id);
      toast({ title: "Success", description: "Subject deleted successfully." });
      fetchSubjects(); 
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast({ title: "Error Deleting Subject", description: `Could not delete subject. It might be assigned or have marks recorded. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSubjectToDelete(null);
    }
  };
  
  const filteredSubjects = useMemo(() => subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  ), [subjects, searchTerm]);

  if (authLoading || !user || user.role !== "admin") {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Subjects</h1>
          <p className="text-muted-foreground">Define and manage academic subjects.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) {
                setNewSubjectName("");
                setNewSubjectCode("");
            }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjectNameAdd" className="text-right">Name</Label>
                <Input id="subjectNameAdd" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="col-span-3" placeholder="e.g., Data Structures" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjectCodeAdd" className="text-right">Code</Label>
                <Input id="subjectCodeAdd" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="col-span-3" placeholder="e.g., CS201"/>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddSubject} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Subject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingSubject(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <UiDialogDescription>Modify the name or code for this subject.</UiDialogDescription>
          </DialogHeader>
          {editingSubject && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjectNameEdit" className="text-right">Name</Label>
                <Input id="subjectNameEdit" value={editSubjectName} onChange={(e) => setEditSubjectName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjectCodeEdit" className="text-right">Code</Label>
                <Input id="subjectCodeEdit" value={editSubjectCode} onChange={(e) => setEditSubjectCode(e.target.value)} className="col-span-3" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => {setIsEditDialogOpen(false); setEditingSubject(null);}}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdateSubject} disabled={isUpdating || !editingSubject}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
        setIsDeleteDialogOpen(isOpen);
        if(!isOpen) setSubjectToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <UiDialogDescription>
              Are you sure you want to delete {subjectToDelete?.name} ({subjectToDelete?.code})? This action cannot be undone.
            </UiDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteSubject} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>All available subjects in the system. Both Name and Code are displayed.</CardDescription>
           <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search subjects by name or code..." 
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
                <p className="ml-3 text-lg">Loading subjects...</p>
            </div>
          ) : (
            subjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject: Subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.code}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditDialog(subject)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Subject
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(subject)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Subject
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
                <AlertTitle className="font-semibold text-blue-800">No Subjects Found</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  {searchTerm ? "No subjects match your search criteria." : "No subjects have been added yet. Click 'Add Subject' to create one."}
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
