'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { getSession } from '../session';

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

  const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
  if(project) {
    revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
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
    
    transactions.push(
      db.issue.update({
        where: { id: issueId },
        data: { statusId: statusId },
      })
    );
  
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
            reporter: true,
            assignee: true,
            comments: {
                include: {
                    author: true,
                },
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
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    
    await db.issue.update({
      where: { id: issueId },
      data: { assigneeId },
    });
  
    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
    if (project) {
      revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
    }
}

export async function addComment({ issueId, body, projectId }: { issueId: string, body: string, projectId: string }) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await db.comment.create({
        data: {
            body,
            issueId,
            authorId: session.user.id
        }
    });

    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
    if (project) {
      revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
      revalidatePath(`/app/${project.organization.slug}/${project.key}/issue/${issueId}`);
    }
}

export async function createIssue({
    title,
    description,
    type,
    priority,
    projectId,
    projectKey,
    assigneeId,
  }: {
    title: string;
    description?: string;
    type: 'STORY' | 'TASK' | 'BUG' | 'EPIC';
    priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    projectId: string;
    projectKey: string;
    assigneeId?: string;
  }) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const project = await db.project.findUnique({ where: { id: projectId }, include: { statuses: true }});
    if (!project) throw new Error('Project not found');

    const firstStatus = project.statuses.find(s => s.order === 0);
    if (!firstStatus) throw new Error('Project has no statuses');
    
    const latestIssue = await db.issue.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    const newIssueNumber = latestIssue ? parseInt(latestIssue.key.split('-')[1]) + 1 : 1;
    
    const newIssue = await db.issue.create({
      data: {
        title,
        description,
        type,
        priority,
        projectId,
        key: `${projectKey}-${newIssueNumber}`,
        statusId: firstStatus.id,
        reporterId: session.user.id,
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
        order: 0, // Will be placed at the top of the column
      },
    });

    const org = await db.organization.findFirst({ where: { projects: { some: { id: projectId } } } });
    if (org) {
        revalidatePath(`/app/${org.slug}/${project.key}/board`);
    }

    return newIssue;
  }
