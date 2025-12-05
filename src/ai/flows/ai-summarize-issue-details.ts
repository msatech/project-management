'use server';
/**
 * @fileOverview An AI agent that summarizes issue details, comments, and activity.
 *
 * - summarizeIssueDetails - A function that handles the issue summarization process.
 * - SummarizeIssueDetailsInput - The input type for the summarizeIssueDetails function.
 * - SummarizeIssueDetailsOutput - The return type for the summarizeIssueDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeIssueDetailsInputSchema = z.object({
  issueTitle: z.string().describe('The title of the issue.'),
  issueDescription: z.string().describe('The description of the issue.'),
  comments: z.array(z.string()).describe('A list of comments on the issue.'),
  activityLog: z.array(z.string()).describe('A list of activity log entries for the issue.'),
});
export type SummarizeIssueDetailsInput = z.infer<typeof SummarizeIssueDetailsInputSchema>;

const SummarizeIssueDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the issue details, comments, and activity.'),
});
export type SummarizeIssueDetailsOutput = z.infer<typeof SummarizeIssueDetailsOutputSchema>;

export async function summarizeIssueDetails(input: SummarizeIssueDetailsInput): Promise<SummarizeIssueDetailsOutput> {
  return summarizeIssueDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeIssueDetailsPrompt',
  input: {schema: SummarizeIssueDetailsInputSchema},
  output: {schema: SummarizeIssueDetailsOutputSchema},
  prompt: `You are an AI assistant that summarizes issue details, comments, and activity logs for project management.

  Given the following issue details, comments, and activity log, generate a concise summary of the issue.

  Issue Title: {{{issueTitle}}}
  Issue Description: {{{issueDescription}}}
  Comments:
  {{#each comments}}
  - {{{this}}}
  {{/each}}
  Activity Log:
  {{#each activityLog}}
  - {{{this}}}
  {{/each}}

  Summary: `,
});

const summarizeIssueDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeIssueDetailsFlow',
    inputSchema: SummarizeIssueDetailsInputSchema,
    outputSchema: SummarizeIssueDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
