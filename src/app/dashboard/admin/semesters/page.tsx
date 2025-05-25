
// src/app/dashboard/admin/semesters/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription as UiDialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { addSemester, getSemesters, deleteSemester as deleteSemesterFromDb, updateSemester } from "@/lib/firestore/semesters";
import type { Semester } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, Edit2, Trash2, CalendarDays, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from "@/components/ui/alert";


export default function ManageSemestersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterYear, setNewSemesterYear] = useState<number>(new Date().getFullYear());
  const [newSemesterStartDate, setNewSemesterStartDate] = useState("");
  const [newSemesterEndDate, setNewSemesterEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [editSemesterName, setEditSemesterName] = useState("");
  const [editSemesterYear, setEditSemesterYear] = useState<number>(new Date().getFullYear());
  const [editSemesterStartDate, setEditSemesterStartDate] = useState("");
  const [editSemesterEndDate, setEditSemesterEndDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchSemesters = useCallback(async () => {
    console.log("ManageSemestersPage: fetchSemesters triggered");
    setIsLoading(true);
    try {
      const fetchedSemesters = await getSemesters();
      setSemesters(fetchedSemesters);
      console.log("ManageSemestersPage: Fetched semesters:", fetchedSemesters.length);
    } catch (error: any) {
      console.error("Error fetching semesters:", error);
      toast({ title: "Error Fetching Semesters", description: `Could not fetch semesters. Check console for Firestore index or permission errors. Error: ${error.message}`, variant: "destructive" });
      setSemesters([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && user.role === "admin" && !authLoading) {
      fetchSemesters();
    }
  }, [user, authLoading, fetchSemesters]);


  const handleAddSemester = async () => {
    if (!newSemesterName || !newSemesterYear) {
      toast({ title: "Validation Error", description: "Semester Name and Year are required.", variant: "destructive" });
      return;
    }
    console.log("ManageSemestersPage: Adding semester:", { name: newSemesterName, year: newSemesterYear, startDate: newSemesterStartDate, endDate: newSemesterEndDate });
    setIsSubmitting(true);
    try {
      await addSemester({ 
        name: newSemesterName, 
        year: newSemesterYear,
        startDate: newSemesterStartDate || undefined, 
        endDate: newSemesterEndDate || undefined,   
      });
      toast({ title: "Success", description: "Semester added successfully." });
      setNewSemesterName("");
      setNewSemesterYear(new Date().getFullYear());
      setNewSemesterStartDate("");
      setNewSemesterEndDate("");
      setIsAddDialogOpen(false);
      fetchSemesters(); 
    } catch (error: any) {
      console.error("Error adding semester:", error);
      toast({ title: "Error Adding Semester", description: `Could not add semester. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (semester: Semester) => {
    console.log("ManageSemestersPage: Opening edit dialog for semester:", semester);
    setEditingSemester(semester);
    setEditSemesterName(semester.name);
    setEditSemesterYear(semester.year);
    setEditSemesterStartDate(formatDateForInput(semester.startDate));
    setEditSemesterEndDate(formatDateForInput(semester.endDate));
    setIsEditDialogOpen(true);
  };

  const handleUpdateSemester = async () => {
    if (!editingSemester || !editSemesterName || !editSemesterYear) {
        toast({ title: "Validation Error", description: "Semester Name and Year are required for update.", variant: "destructive" });
        return;
    }
    console.log("ManageSemestersPage: Updating semester ID:", editingSemester.id, "to Name:", editSemesterName, "Year:", editSemesterYear, "Start:", editSemesterStartDate, "End:", editSemesterEndDate);
    setIsUpdating(true);
    try {
        await updateSemester(editingSemester.id, {
            name: editSemesterName,
            year: editSemesterYear,
            startDate: editSemesterStartDate || undefined,
            endDate: editSemesterEndDate || undefined,
        });
        toast({ title: "Success", description: "Semester updated successfully." });
        fetchSemesters();
    } catch (error: any) {
        console.error("Error updating semester:", error);
        toast({ title: "Error Updating Semester", description: `Could not update semester. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
        setIsUpdating(false);
        setIsEditDialogOpen(false);
        setEditingSemester(null);
    }
  };

  const openDeleteDialog = (semester: Semester) => {
    setSemesterToDelete(semester);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSemester = async () => {
    if(!semesterToDelete) return;
    console.log("ManageSemestersPage: Attempting to delete semester:", semesterToDelete.id, semesterToDelete.name);
    setIsDeleting(true);
    try {
      await deleteSemesterFromDb(semesterToDelete.id);
      toast({ title: "Success", description: "Semester deleted successfully." });
      fetchSemesters(); 
    } catch (error: any) {
      console.error("Error deleting semester:", error);
      toast({ title: "Error Deleting Semester", description: `Could not delete semester. It might be in use or there was a server error. Check console for Firestore errors (e.g., permissions). Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSemesterToDelete(null);
    }
  };
  
  const filteredSemesters = useMemo(() => semesters.filter(semester => 
    semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.year.toString().includes(searchTerm)
  ), [semesters, searchTerm]);

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return "N/A";
    // Try parsing as ISO string first (common Firestore Timestamp toDate().toISOString() format)
    const dateObj = parseISO(dateString);
    if (isValid(dateObj)) {
        return format(dateObj, "MMM dd, yyyy");
    }
    // Fallback for direct yyyy-MM-dd input from date picker
    const directDateObj = new Date(dateString);
     if (isValid(directDateObj) && dateString.includes("-")) { // Check if it looks like a date string
        // Need to adjust for timezone if directDateObj is used, as it parses as local.
        // For yyyy-MM-dd, it's safer to re-parse ensuring UTC interpretation if that's the source.
        const [year, month, day] = dateString.split('-').map(Number);
        if (year && month && day) {
            return format(new Date(Date.UTC(year, month - 1, day)), "MMM dd, yyyy");
        }
    }
    console.warn("formatDateForDisplay encountered an invalid or ambiguous date string:", dateString);
    return "Invalid Date";
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    const isoDate = parseISO(dateString); // Handles full ISO strings from Firestore
    if (isValid(isoDate)) {
      return format(isoDate, "yyyy-MM-dd");
    }
    // If it's already in yyyy-MM-dd, just return it (less ideal for consistency)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const directDate = new Date(dateString); // This will parse as local midnight
        if (isValid(directDate)){
             // To avoid timezone shift issues with native Date, re-format from parts
            const [year, month, day] = dateString.split('-').map(Number);
            if(year && month && day) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }
    console.warn("formatDateForInput encountered an invalid or ambiguous date string:", dateString);
    return ""; 
  };


  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Semesters</h1>
          <p className="text-muted-foreground">Define and manage academic semesters.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) { 
                setNewSemesterName("");
                setNewSemesterYear(new Date().getFullYear());
                setNewSemesterStartDate("");
                setNewSemesterEndDate("");
            }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Semester
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Semester</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterNameAdd" className="text-right">Name</Label>
                <Input id="semesterNameAdd" value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} className="col-span-3" placeholder="e.g., Fall, Spring" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterYearAdd" className="text-right">Year</Label>
                <Input id="semesterYearAdd" type="number" value={newSemesterYear} onChange={(e) => setNewSemesterYear(parseInt(e.target.value))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterStartDateAdd" className="text-right">Start Date</Label>
                <Input id="semesterStartDateAdd" type="date" value={newSemesterStartDate} onChange={(e) => setNewSemesterStartDate(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterEndDateAdd" className="text-right">End Date</Label>
                <Input id="semesterEndDateAdd" type="date" value={newSemesterEndDate} onChange={(e) => setNewSemesterEndDate(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddSemester} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Semester
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Semester Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingSemester(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
            <UiDialogDescription>Modify the details for this semester.</UiDialogDescription>
          </DialogHeader>
          {editingSemester && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterNameEdit" className="text-right">Name</Label>
                <Input id="semesterNameEdit" value={editSemesterName} onChange={(e) => setEditSemesterName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterYearEdit" className="text-right">Year</Label>
                <Input id="semesterYearEdit" type="number" value={editSemesterYear} onChange={(e) => setEditSemesterYear(parseInt(e.target.value))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterStartDateEdit" className="text-right">Start Date</Label>
                <Input id="semesterStartDateEdit" type="date" value={editSemesterStartDate} onChange={(e) => setEditSemesterStartDate(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterEndDateEdit" className="text-right">End Date</Label>
                <Input id="semesterEndDateEdit" type="date" value={editSemesterEndDate} onChange={(e) => setEditSemesterEndDate(e.target.value)} className="col-span-3" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => {setIsEditDialogOpen(false); setEditingSemester(null);}}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdateSemester} disabled={isUpdating || !editingSemester}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Semester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Semester Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
        setIsDeleteDialogOpen(isOpen);
        if(!isOpen) setSemesterToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Semester</DialogTitle>
            <UiDialogDescription>
              Are you sure you want to delete {semesterToDelete?.name} ({semesterToDelete?.year})? This action cannot be undone.
            </UiDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteSemester} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Semester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Semester List</CardTitle>
          <CardDescription>All academic semesters in the system.</CardDescription>
           <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search semesters by name or year..." 
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
                <p className="ml-3 text-lg">Loading semesters...</p>
            </div>
          ) : (
            semesters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semester Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSemesters.map((semester: Semester) => (
                    <TableRow key={semester.id}>
                      <TableCell className="font-medium">{semester.name}</TableCell>
                      <TableCell>{semester.year}</TableCell>
                      <TableCell>{formatDateForDisplay(semester.startDate)}</TableCell>
                      <TableCell>{formatDateForDisplay(semester.endDate)}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditDialog(semester)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Semester
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Academic calendar feature is under development."}) }>
                              <CalendarDays className="mr-2 h-4 w-4" /> Set Academic Calendar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(semester)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Semester
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
                <AlertTitle className="font-semibold text-blue-800">No Semesters Found</AlertTitle>
                <UiAlertDescription className="text-blue-700">
                  {searchTerm ? "No semesters match your search criteria." : "No semesters have been added yet. Click 'Add Semester' to create one."}
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
