
// src/app/dashboard/student/performance-analysis/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { analyzeStudentPerformance, type AnalyzeStudentPerformanceInput, type AnalyzeStudentPerformanceOutput } from "@/ai/flows/analyze-student-performance";
import { getMarksByStudent } from "@/lib/firestore/marks"; // Fetch marks from Firestore
import type { Mark, StudentMarksDataForAI } from "@/lib/types";
import { Loader2, Brain, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function PerformanceAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [analysisResult, setAnalysisResult] = useState<AnalyzeStudentPerformanceOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentMarks, setStudentMarks] = useState<Mark[]>([]);
  const [isLoadingMarks, setIsLoadingMarks] = useState(true);


  useEffect(() => {
    if (!authLoading && (!user || user.role !== "student")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchStudentMarksForAI = useCallback(async () => {
    if (!user) return;
    setIsLoadingMarks(true);
    try {
      const marks = await getMarksByStudent(user.uid); // Fetch all marks for the student
      setStudentMarks(marks);
    } catch (e) {
      console.error("Error fetching marks for AI analysis:", e);
      setError("Failed to fetch your marks data. Analysis may be incomplete or unavailable.");
      toast({ title: "Data Error", description: "Could not fetch your marks for analysis.", variant: "destructive"});
    } finally {
      setIsLoadingMarks(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchStudentMarksForAI();
    }
  }, [user, fetchStudentMarksForAI]);

  const handleGenerateAnalysis = async () => {
    if (!user) return;
    if (isLoadingMarks) {
        toast({title: "Please wait", description: "Still loading your marks data."});
        return;
    }

    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (studentMarks.length === 0) {
        setError("No marks data found to analyze. Please ensure your marks are updated and available.");
        setIsLoadingAnalysis(false);
        return;
      }
      
      const studentMarksDataForAI: StudentMarksDataForAI[] = studentMarks.map(mark => ({
          // Ensure semesterName and subjectName are present on the mark object
          semester: mark.semesterName || 'Unknown Semester', 
          subject: mark.subjectName || 'Unknown Subject', 
          ca1: mark.ca1 ?? 0,
          ca2: mark.ca2 ?? 0,
          midTerm: mark.midTerm ?? 0,
          endTerm: mark.endTerm ?? 0,
        }));

      const input: AnalyzeStudentPerformanceInput = {
        studentName: user.name,
        studentId: user.uid,
        marksData: studentMarksDataForAI,
      };
      
      const result = await analyzeStudentPerformance(input);
      setAnalysisResult(result);
    } catch (e) {
      console.error("Error generating performance analysis:", e);
      setError("Failed to generate performance analysis. Please try again later.");
      toast({ title: "Analysis Error", description: "An error occurred while generating insights.", variant: "destructive"});
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  if (authLoading || !user || user.role !== "student") {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading or unauthorized...</p></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold text-primary">AI Performance Analysis</CardTitle>
              <CardDescription>Get personalized insights and recommendations based on your academic performance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <Button onClick={handleGenerateAnalysis} disabled={isLoadingAnalysis || isLoadingMarks} size="lg">
              {isLoadingAnalysis || isLoadingMarks ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoadingMarks ? "Loading Marks..." : isLoadingAnalysis ? "Generating..." : "Generate My Performance Insights"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoadingAnalysis && (
            <div className="text-center py-10">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Analyzing your performance data... This may take a moment.</p>
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
          {!analysisResult && !isLoadingAnalysis && !error && !isLoadingMarks && (
             <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Click the button above to generate your personalized performance insights.</p>
                <p className="text-sm text-muted-foreground mt-2">The AI will analyze your marks across subjects and semesters to provide feedback.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
