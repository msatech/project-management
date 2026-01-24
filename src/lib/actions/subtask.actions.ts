'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createSubtask({
  parentId,
  title,
  description,
  type,
  priority,
  projectId,
  projectKey,
}: {
  parentId: string;
  title: string;
  description?: string;
  type: 'TASK' | 'BUG';
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectId: string;
  projectKey: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const parent = await db.issue.findUnique({
    where: { id: parentId },
    include: { status: true, project: { include: { organization: true } } }
  });

  if (!parent) throw new Error('Parent issue not found');

  // Get the latest issue number
  const latestIssue = await db.issue.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });

  const newIssueNumber = latestIssue ? parseInt(latestIssue.key.split('-')[1]) + 1 : 1;

  const subtask = await db.issue.create({
    data: {
      title,
      description,
      type,
      priority,
      projectId,
      key: `${projectKey}-${newIssueNumber}`,
      statusId: parent.statusId, // Inherit parent's status
      reporterId: session.user.id,
      parentId,
      order: 0,
    },
  });

  revalidatePath(`/app/${parent.project.organization.slug}/${parent.project.key}/board`);
  return subtask;
}

export async function getSubtasks(parentId: string) {
  return await db.issue.findMany({
    where: { parentId },
    include: {
      assignee: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' }
  });
}

export async function addChecklistItem(issueId: string, title: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const item = await db.checklistItem.create({
    data: {
      issueId,
      title,
    },
  });

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: { project: { include: { organization: true } } }
  });

  if (issue) {
    revalidatePath(`/app/${issue.project.organization.slug}/${issue.project.key}/board`);
  }

  return item;
}

export async function toggleChecklistItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const item = await db.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');

  const updated = await db.checklistItem.update({
    where: { id: itemId },
    data: { isChecked: !item.isChecked },
  });

  const issue = await db.issue.findUnique({
    where: { id: item.issueId },
    include: { project: { include: { organization: true } } }
  });

  if (issue) {
    revalidatePath(`/app/${issue.project.organization.slug}/${issue.project.key}/board`);
  }

  return updated;
}

export async function deleteChecklistItem(itemId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const item = await db.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');

  await db.checklistItem.delete({ where: { id: itemId } });

  const issue = await db.issue.findUnique({
    where: { id: item.issueId },
    include: { project: { include: { organization: true } } }
  });

  if (issue) {
    revalidatePath(`/app/${issue.project.organization.slug}/${issue.project.key}/board`);
  }
}
