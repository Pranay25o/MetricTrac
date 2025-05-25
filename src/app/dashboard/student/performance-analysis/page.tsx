
// src/app/dashboard/student/performance-analysis/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { analyzeStudentPerformance, type AnalyzeStudentPerformanceInput, type AnalyzeStudentPerformanceOutput } from "@/ai/flows/analyze-student-performance";
import { getMarksByStudent } from "@/lib/firestore/marks"; 
import type { Mark, StudentMarksDataForAI } from "@/lib/types";
import { Loader2, Brain, Sparkles, UserSquare, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle as UiAlertTitle } from "@/components/ui/alert"; // Renamed to avoid conflict
import { useToast } from "@/hooks/use-toast";

export default function PerformanceAnalysisPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStudentPerformanceOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentMarks, setStudentMarks] = useState<Mark[]>([]);
  const [isLoadingMarks, setIsLoadingMarks] = useState(true);

  const [viewedStudentId, setViewedStudentId] = useState<string | null>(null);
  const [viewedStudentName, setViewedStudentName] = useState<string | null>(null);
  const [isViewingOtherStudent, setIsViewingOtherStudent] = useState(false);
  const [initialParamsProcessed, setInitialParamsProcessed] = useState(false);


  useEffect(() => {
    const studentIdFromQuery = searchParams.get('studentId');
    const studentNameFromQuery = searchParams.get('studentName');
    console.log("PerformanceAnalysisPage: Query Params - studentId:", studentIdFromQuery, "studentName:", studentNameFromQuery);
    if (studentIdFromQuery) {
      setViewedStudentId(studentIdFromQuery);
      setViewedStudentName(studentNameFromQuery || "Selected Student");
      setIsViewingOtherStudent(true);
      console.log("PerformanceAnalysisPage: Viewing specific student - ID:", studentIdFromQuery, "Name:", studentNameFromQuery);
    } else {
      setIsViewingOtherStudent(false);
    }
    setInitialParamsProcessed(true); // Mark that query params have been processed
  }, [searchParams]);

  useEffect(() => {
    // Wait for both auth and query param processing to complete
    if (authLoading || !initialParamsProcessed) {
      console.log("PerformanceAnalysisPage: Auth or params not ready. AuthLoading:", authLoading, "InitialParamsProcessed:", initialParamsProcessed);
      return;
    }

    if (!authUser) {
      console.log("PerformanceAnalysisPage: No authUser, redirecting to dashboard.");
      router.push("/dashboard");
      return;
    }

    console.log("PerformanceAnalysisPage: Auth loaded. User role:", authUser.role, "isViewingOtherStudent:", isViewingOtherStudent);

    if (isViewingOtherStudent) { // Admin/teacher viewing a specific student
      if (authUser.role !== 'admin' && authUser.role !== 'teacher') {
        toast({ title: "Unauthorized", description: "You do not have permission to view this student's analysis.", variant: "destructive" });
        console.log("PerformanceAnalysisPage: Unauthorized access attempt by role:", authUser.role, "to view other student. Redirecting.");
        router.push("/dashboard");
      } else {
        console.log("PerformanceAnalysisPage: Authorized admin/teacher viewing student:", viewedStudentId);
        // Proceed to fetch marks if authorized
      }
    } else { // Student viewing their own
      if (authUser.role !== 'student') {
        toast({ title: "Access Error", description: "This page is for students or authorized staff looking up specific students.", variant: "destructive" });
        console.log("PerformanceAnalysisPage: Role", authUser.role, "attempting to view own analysis (but not student). Redirecting.");
        router.push("/dashboard");
      } else {
         console.log("PerformanceAnalysisPage: Authorized student viewing own analysis.");
         // Proceed to fetch marks if authorized
      }
    }
  }, [authUser, authLoading, router, isViewingOtherStudent, toast, initialParamsProcessed, viewedStudentId]);


  const fetchStudentMarksForAI = useCallback(async () => {
    const studentIdToFetch = isViewingOtherStudent ? viewedStudentId : authUser?.uid;

    if (!studentIdToFetch) {
      console.log("PerformanceAnalysisPage: fetchStudentMarksForAI - No studentIdToFetch available.");
      setIsLoadingMarks(false);
      if (isViewingOtherStudent) setError("Student ID not provided for analysis.");
      else setError("User ID not available for analysis.");
      return;
    }
    
    console.log("PerformanceAnalysisPage: fetchStudentMarksForAI triggered for student:", studentIdToFetch);
    setIsLoadingMarks(true);
    setError(null); 
    try {
      const marks = await getMarksByStudent(studentIdToFetch); 
      setStudentMarks(marks);
      console.log("PerformanceAnalysisPage: Fetched marks for AI:", marks.length);
      if (marks.length === 0) {
        setError("No marks data found for this student. Analysis cannot be generated.");
      }
    } catch (e: any) {
      console.error("PerformanceAnalysisPage: Error fetching marks for AI analysis:", e);
      setError(`Failed to fetch marks data. Analysis may be incomplete or unavailable. Error: ${e.message}. Check console for Firestore index errors.`);
      toast({ title: "Data Error", description: "Could not fetch marks for analysis. Check console for Firestore index errors.", variant: "destructive"});
    } finally {
      setIsLoadingMarks(false);
    }
  }, [authUser, toast, viewedStudentId, isViewingOtherStudent]);

  useEffect(() => {
    if (authLoading || !initialParamsProcessed) return; 

    const shouldFetch = (isViewingOtherStudent && viewedStudentId && (authUser?.role === 'admin' || authUser?.role === 'teacher')) ||
                        (!isViewingOtherStudent && authUser && authUser.role === "student");
    
    if (shouldFetch) {
        console.log("PerformanceAnalysisPage: Conditions met to fetch marks for AI.");
        fetchStudentMarksForAI();
    } else {
        console.log("PerformanceAnalysisPage: Conditions NOT met to fetch marks for AI. isViewingOtherStudent:", isViewingOtherStudent, "viewedStudentId:", viewedStudentId, "authUser role:", authUser?.role);
         if (!viewedStudentId && isViewingOtherStudent) {
            setIsLoadingMarks(false); // Don't show loading if no student ID for lookup
        }
    }
  }, [authLoading, authUser, isViewingOtherStudent, viewedStudentId, fetchStudentMarksForAI, initialParamsProcessed]);

  const handleGenerateAnalysis = async () => {
    const studentIdForAI = isViewingOtherStudent ? viewedStudentId : authUser?.uid;
    const studentNameForAI = isViewingOtherStudent ? viewedStudentName : authUser?.name;

    if (!studentIdForAI || !studentNameForAI) {
      setError("Student information is missing for analysis generation.");
      return;
    }
    if (isLoadingMarks) {
        toast({title: "Please wait", description: "Still loading marks data."});
        return;
    }

    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (studentMarks.length === 0) {
        setError("No marks data found to analyze. Please ensure marks are updated and available for this student.");
        setIsLoadingAnalysis(false);
        return;
      }
      
      const studentMarksDataForAI: StudentMarksDataForAI[] = studentMarks.map(mark => ({
          semester: mark.semesterName || 'Unknown Semester', 
          subject: mark.subjectName || 'Unknown Subject', 
          ca1: mark.ca1 ?? 0,
          ca2: mark.ca2 ?? 0,
          midTerm: mark.midTerm ?? 0,
          endTerm: mark.endTerm ?? 0,
        }));

      const input: AnalyzeStudentPerformanceInput = {
        studentName: studentNameForAI,
        studentId: studentIdForAI,
        marksData: studentMarksDataForAI,
      };
      
      console.log("PerformanceAnalysisPage: Generating analysis with input:", input);
      const result = await analyzeStudentPerformance(input);
      setAnalysisResult(result);
    } catch (e: any) {
      console.error("PerformanceAnalysisPage: Error generating performance analysis:", e);
      setError(`Failed to generate performance analysis. Please try again later. Error: ${e.message}`);
      toast({ title: "Analysis Error", description: "An error occurred while generating insights.", variant: "destructive"});
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  if (authLoading || !initialParamsProcessed || (!authUser && !viewedStudentId) ) { // Adjusted loading condition
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading performance analysis...</p></div>;
  }
  
  const pageTitle = isViewingOtherStudent ? `AI Performance Analysis for ${viewedStudentName || 'Student'}` : "My AI Performance Analysis";
  const pageDescription = isViewingOtherStudent 
    ? `Personalized insights and recommendations based on the academic performance of ${viewedStudentName || 'this student'}.`
    : "Get personalized insights and recommendations based on your academic performance.";


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            {isViewingOtherStudent ? <UserSquare className="h-10 w-10 text-primary" /> : <Brain className="h-10 w-10 text-primary" />}
            <div>
              <CardTitle className="text-3xl font-bold text-primary">{pageTitle}</CardTitle>
              <CardDescription>{pageDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <Button onClick={handleGenerateAnalysis} disabled={isLoadingAnalysis || isLoadingMarks || studentMarks.length === 0} size="lg">
              {isLoadingAnalysis || isLoadingMarks ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoadingMarks ? "Loading Marks..." : isLoadingAnalysis ? "Generating..." : "Generate Performance Insights"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-5 w-5" />
              <UiAlertTitle>Error</UiAlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoadingAnalysis && (
            <div className="text-center py-10">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Analyzing performance data... This may take a moment.</p>
            </div>
          )}

          {analysisResult && !isLoadingAnalysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-accent">Overall Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-line">{analysisResult.overallPerformance}</p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-green-600">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-line">{analysisResult.strengths}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-red-600">Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-line">{analysisResult.weaknesses}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-line">{analysisResult.recommendations}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {!analysisResult && !isLoadingAnalysis && !error && !isLoadingMarks && studentMarks.length > 0 && (
             <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Click the button above to generate personalized performance insights.</p>
                <p className="text-sm text-muted-foreground mt-2">The AI will analyze marks across subjects and semesters to provide feedback.</p>
            </div>
          )}
           {!isLoadingMarks && studentMarks.length === 0 && !error && !isLoadingAnalysis && ( // Message when no marks and not loading/error
             <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No marks data available for this student to generate insights.</p>
                <p className="text-sm text-muted-foreground mt-2">Please ensure marks have been entered.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
