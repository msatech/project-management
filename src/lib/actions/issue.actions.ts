'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { summarizeIssueDetails } from '@/ai/flows/ai-summarize-issue-details';

export async function updateIssueStatus({
  issueId,
  statusId,
  projectId,
}: {
  issueId: string;
  statusId: string;
  projectId: string;
}) {
  await db.issue.update({
    where: { id: issueId },
    data: { statusId },
  });

  const project = await db.project.findUnique({ where: { id: projectId }});
  if(project) {
    revalidatePath(`/app/${project.organizationId}/${project.key}/board`);
  }
}

export async function updateIssueOrder({
    issueId,
    statusId,
    orderedIds,
    projectId,
  }: {
    issueId: string;
    statusId: string;
    orderedIds: string[];
    projectId: string;
  }) {

    const transactions = [];
    
    // Update the moved issue's status
    transactions.push(
      db.issue.update({
        where: { id: issueId },
        data: { statusId: statusId },
      })
    );
  
    // Update the order of all issues in the new column
    for (let i = 0; i < orderedIds.length; i++) {
        transactions.push(
          db.issue.update({
            where: { id: orderedIds[i] },
            data: { order: i },
          })
        );
      }
  
    await db.$transaction(transactions);

    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true }});
    if(project) {
      revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
    }
  }


export async function getIssueDetails(issueId: string) {
    const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: {
            status: true,
            comments: {
                orderBy: {
                    createdAt: 'asc'
                }
            },
            activityLogs: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });
    return issue;
}

export async function updateIssueAssignee({
    issueId,
    assigneeId,
    projectId,
  }: {
    issueId: string;
    assigneeId: string | null;
    projectId: string;
  }) {
    await db.issue.update({
      where: { id: issueId },
      data: { assigneeId },
    });
  
    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
    if (project) {
      revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
    }
}


export async function summarizeIssue(issueId: string) {
    const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: {
            comments: true,
            activityLogs: true,
        }
    });

    if (!issue) {
        throw new Error('Issue not found');
    }

    const summary = await summarizeIssueDetails({
        issueTitle: issue.title,
        issueDescription: issue.description || '',
        comments: issue.comments.map(c => c.body),
        activityLog: issue.activityLogs.map(a => `${a.type} at ${a.createdAt}`),
    });

    return summary;
}
