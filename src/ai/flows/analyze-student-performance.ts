// 'use server';

/**
 * @fileOverview Analyzes student performance trends and suggests areas for improvement.
 *
 * - analyzeStudentPerformance - A function that analyzes student performance and suggests improvements.
 * - AnalyzeStudentPerformanceInput - The input type for the analyzeStudentPerformance function.
 * - AnalyzeStudentPerformanceOutput - The return type for the analyzeStudentPerformance function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStudentPerformanceInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  studentId: z.string().describe('The unique identifier for the student.'),
  marksData: z
    .array(
      z.object({
        semester: z.string().describe('The semester for the marks.'),
        subject: z.string().describe('The subject for the marks.'),
        ca1: z.number().describe('The marks obtained in CA1.'),
        ca2: z.number().describe('The marks obtained in CA2.'),
        midTerm: z.number().describe('The marks obtained in the mid-term exam.'),
        endTerm: z.number().describe('The marks obtained in the end-term exam.'),
      })
    )
    .describe('An array of marks data for the student.'),
});
export type AnalyzeStudentPerformanceInput = z.infer<
  typeof AnalyzeStudentPerformanceInputSchema
>;

const AnalyzeStudentPerformanceOutputSchema = z.object({
  overallPerformance: z.string().describe('An overall summary of the student\'s academic performance.'),
  strengths: z.string().describe('Areas where the student excels.'),
  weaknesses: z.string().describe('Areas where the student needs improvement.'),
  recommendations: z.string().describe('Specific recommendations for the student to improve.'),
});
export type AnalyzeStudentPerformanceOutput = z.infer<
  typeof AnalyzeStudentPerformanceOutputSchema
>;

export async function analyzeStudentPerformance(
  input: AnalyzeStudentPerformanceInput
): Promise<AnalyzeStudentPerformanceOutput> {
  return analyzeStudentPerformanceFlow(input);
}

const analyzeStudentPerformancePrompt = ai.definePrompt({
  name: 'analyzeStudentPerformancePrompt',
  input: {schema: AnalyzeStudentPerformanceInputSchema},
  output: {schema: AnalyzeStudentPerformanceOutputSchema},
  prompt: `You are an AI assistant that analyzes student performance based on their marks data.

  Analyze the student's performance across different subjects and semesters. Identify their strengths and weaknesses, and provide recommendations for improvement.

  Student Name: {{{studentName}}}
  Student ID: {{{studentId}}}

  Marks Data:
  {{#each marksData}}
  Semester: {{{semester}}}, Subject: {{{subject}}}, CA1: {{{ca1}}}, CA2: {{{ca2}}}, Mid Term: {{{midTerm}}}, End Term: {{{endTerm}}}
  {{/each}}

  Based on the data provided, generate an overall performance summary, identify strengths and weaknesses, and provide actionable recommendations.
  Make sure the recommendations are very specific to the student's data and suggest specific study habits or resources.
  Ensure the overall performance, strengths, weaknesses and recommendations are easy to understand and directly related to the marks data.
  `,
});

const analyzeStudentPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeStudentPerformanceFlow',
    inputSchema: AnalyzeStudentPerformanceInputSchema,
    outputSchema: AnalyzeStudentPerformanceOutputSchema,
  },
  async input => {
    const {output} = await analyzeStudentPerformancePrompt(input);
    return output!;
  }
);
