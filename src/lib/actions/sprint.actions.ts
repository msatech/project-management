"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createSprint({
  projectId,
  name,
  goal,
  startDate,
  endDate,
}: {
  projectId: string;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.create({
    data: {
      projectId,
      name,
      goal,
      startDate,
      endDate,
    },
  });

  revalidatePath(`/app/${session.user.id}`); // Broad revalidate or specific?
  // We can't easily guess the full path without org slug/key, but usually we just return data.
  // Or we try to revalidate the project pages.
  // Actually, we should probably pass the path to revalidate or just return.
  
  return sprint;
}

export async function updateSprint({
  sprintId,
  name,
  goal,
  startDate,
  endDate,
  status,
}: {
  sprintId: string;
  name?: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.update({
    where: { id: sprintId },
    data: {
      name,
      goal,
      startDate,
      endDate,
      status,
    },
  });

  return sprint;
}

export async function deleteSprint(sprintId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.sprint.delete({
    where: { id: sprintId },
  });

  return true;
}

export async function assignIssueToSprint({
  issueId,
  sprintId,
}: {
  issueId: string;
  sprintId: string;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.issueSprint.create({
    data: {
      issueId,
      sprintId,
    },
  });

  return true;
}

export async function removeIssueFromSprint({
  issueId,
  sprintId,
}: {
  issueId: string;
  sprintId: string;
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.issueSprint.delete({
    where: {
      issueId_sprintId: {
        issueId,
        sprintId,
      },
    },
  });

  return true;
}

export async function getSprintDetails(sprintId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        include: {
          statuses: {
            orderBy: { order: 'asc' },
          },
        },
      },
      issues: {
        include: {
          issue: {
            include: {
              status: true,
              assignee: true,
              reporter: true,
            },
          },
        },
      },
    },
  });

  return sprint;
}

export async function getSprintMetrics(sprintId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      issues: {
        include: {
          issue: {
            include: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  const totalIssues = sprint.issues.length;
  const completedIssues = sprint.issues.filter(
    (issueSprint) => issueSprint.issue.status.category === "DONE"
  ).length;
  
  const totalPoints = sprint.issues.reduce(
    (sum, issueSprint) => sum + (issueSprint.issue.estimatePoints || 0),
    0
  );
  
  const completedPoints = sprint.issues
    .filter((issueSprint) => issueSprint.issue.status.category === "DONE")
    .reduce((sum, issueSprint) => sum + (issueSprint.issue.estimatePoints || 0), 0);

  const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
  const pointsCompletionRate = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  return {
    totalIssues,
    completedIssues,
    inProgressIssues: sprint.issues.filter(
      (issueSprint) => issueSprint.issue.status.category === "IN_PROGRESS"
    ).length,
    todoIssues: sprint.issues.filter(
      (issueSprint) => issueSprint.issue.status.category === "TODO"
    ).length,
    totalPoints,
    completedPoints,
    completionRate,
    pointsCompletionRate,
  };
}
