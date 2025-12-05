'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { getSession } from '../session';
import { ProjectType, StatusCategory } from '@prisma/client';

export async function createProject({
  name,
  type,
  organizationId,
}: {
  name: string;
  type: ProjectType;
  organizationId: string;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  // Check if user is part of the organization
  const orgMember = await db.organizationMember.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
    },
  });

  if (!orgMember) {
    throw new Error('You are not a member of this organization.');
  }

  // Generate a project key (e.g., "My Project" -> "MP")
  const key = name
    .split(' ')
    .slice(0, 3)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  // Ensure key is unique within the organization
  const existingProjectWithKey = await db.project.findFirst({
    where: {
      key,
      organizationId,
    },
  });

  // If key exists, append a number
  const finalKey = existingProjectWithKey ? `${key}${Math.floor(Math.random() * 10)}` : key;

  const project = await db.project.create({
    data: {
      name,
      key: finalKey,
      type,
      organizationId,
      leadId: session.user.id,
    },
    include: {
      organization: true,
    },
  });

  // Create default statuses for the project
  const statusesData = [
    { name: 'Backlog', category: StatusCategory.TODO, order: 0, projectId: project.id },
    { name: 'To Do', category: StatusCategory.TODO, order: 1, projectId: project.id },
    { name: 'In Progress', category: StatusCategory.IN_PROGRESS, order: 2, projectId: project.id },
    { name: 'Done', category: StatusCategory.DONE, order: 3, projectId: project.id },
  ];

  await db.status.createMany({
    data: statusesData,
  });

  revalidatePath(`/app/${project.organization.slug}`);

  return project;
}
