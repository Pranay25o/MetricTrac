
// src/app/dashboard/admin/semesters/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-provider";
import { addSemester, getSemesters, deleteSemester as deleteSemesterFromDb } from "@/lib/firestore/semesters";
import type { Semester } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Search, Edit2, Trash2, CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function ManageSemestersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterYear, setNewSemesterYear] = useState<number>(new Date().getFullYear());
  const [newSemesterStartDate, setNewSemesterStartDate] = useState("");
  const [newSemesterEndDate, setNewSemesterEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchSemesters = async () => {
    setIsLoading(true);
    try {
      const fetchedSemesters = await getSemesters();
      setSemesters(fetchedSemesters);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast({ title: "Error", description: "Could not fetch semesters.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchSemesters();
    }
  }, [user]);


  const handleAddSemester = async () => {
    if (!newSemesterName || !newSemesterYear) {
      toast({ title: "Validation Error", description: "Semester Name and Year are required.", variant: "destructive" });
      return;
    }
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
      fetchSemesters(); // Refresh list
    } catch (error) {
      console.error("Error adding semester:", error);
      toast({ title: "Error", description: "Could not add semester.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (!window.confirm("Are you sure you want to delete this semester? This action cannot be undone.")) return;
    try {
      await deleteSemesterFromDb(semesterId);
      toast({ title: "Success", description: "Semester deleted successfully." });
      fetchSemesters(); // Refresh list
    } catch (error) {
      console.error("Error deleting semester:", error);
      toast({ title: "Error", description: "Could not delete semester. It might be in use.", variant: "destructive" });
    }
  };
  
  const filteredSemesters = useMemo(() => semesters.filter(semester => 
    semester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.year.toString().includes(searchTerm)
  ), [semesters, searchTerm]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (error) {
      // If it's already formatted or not ISO, try direct formatting
      try {
        return format(new Date(dateString), "MMM dd, yyyy");
      } catch (e) {
         return "Invalid Date";
      }
    }
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <Label htmlFor="semesterName" className="text-right">Name</Label>
                <Input id="semesterName" value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} className="col-span-3" placeholder="e.g., Fall, Spring, Summer 1" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterYear" className="text-right">Year</Label>
                <Input id="semesterYear" type="number" value={newSemesterYear} onChange={(e) => setNewSemesterYear(parseInt(e.target.value))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterStartDate" className="text-right">Start Date</Label>
                <Input id="semesterStartDate" type="date" value={newSemesterStartDate} onChange={(e) => setNewSemesterStartDate(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semesterEndDate" className="text-right">End Date</Label>
                <Input id="semesterEndDate" type="date" value={newSemesterEndDate} onChange={(e) => setNewSemesterEndDate(e.target.value)} className="col-span-3" />
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
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading semesters...</p>
            </div>
          ) : (
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
              {filteredSemesters.length > 0 ? filteredSemesters.map((semester: Semester) => (
                <TableRow key={semester.id}>
                  <TableCell className="font-medium">{semester.name}</TableCell>
                  <TableCell>{semester.year}</TableCell>
                  <TableCell>{formatDate(semester.startDate)}</TableCell>
                  <TableCell>{formatDate(semester.endDate)}</TableCell>
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
                        <DropdownMenuItem onClick={() => console.log("Edit semester:", semester.id)/* TODO: Implement Edit Dialog */}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Semester
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("Set academic calendar for:", semester.id) /* TODO: Implement Calendar setting */}>
                          <CalendarDays className="mr-2 h-4 w-4" /> Set Academic Calendar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleDeleteSemester(semester.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Semester
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No semesters found. {semesters.length === 0 && !searchTerm ? "Try adding a new semester." : ""}
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
