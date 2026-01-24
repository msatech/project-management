'use server'

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export async function getProjectAnalytics(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      issues: {
        include: {
          assignee: true,
          status: true,
        },
      },
      sprints: {
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
      },
    },
  });

  if (!project) return null;

  // Issue type distribution
  const typeDistribution = project.issues.reduce((acc: any, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  // Priority distribution
  const priorityDistribution = project.issues.reduce((acc: any, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {});

  // Status distribution
  const statusDistribution = project.issues.reduce((acc: any, issue) => {
    const category = issue.status.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Team workload (issues per assignee)
  const teamWorkload = project.issues.reduce((acc: any, issue) => {
    if (issue.assignee) {
      const name = issue.assignee.name || issue.assignee.email || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
    } else {
      acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
    }
    return acc;
  }, {});

  // Burn-down data (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
  const burnDownData = days.map(day => {
    const completed = project.issues.filter(issue => {
      const updatedAt = new Date(issue.updatedAt);
      return issue.status.category === 'DONE' && updatedAt <= day;
    }).length;

    const total = project.issues.filter(issue => {
      const createdAt = new Date(issue.createdAt);
      return createdAt <= day;
    }).length;

    return {
      date: format(day, 'MMM dd'),
      completed,
      remaining: total - completed,
      total,
    };
  });

  // Velocity (issues completed per sprint)
  const velocityData = project.sprints.map(sprint => ({
    name: sprint.name,
    completed: sprint.issues.filter((si: any) => si.issue.status.category === 'DONE').length,
    total: sprint.issues.length,
  }));

  return {
    typeDistribution: Object.entries(typeDistribution).map(([name, value]) => ({
      name,
      value,
    })),
    priorityDistribution: Object.entries(priorityDistribution).map(([name, value]) => ({
      name,
      value,
    })),
    statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value,
    })),
    teamWorkload: Object.entries(teamWorkload).map(([name, value]) => ({
      name,
      value,
    })),
    burnDownData,
    velocityData,
    summary: {
      totalIssues: project.issues.length,
      completedIssues: project.issues.filter(i => i.status.category === 'DONE').length,
      inProgressIssues: project.issues.filter(i => i.status.category === 'IN_PROGRESS').length,
      todoIssues: project.issues.filter(i => i.status.category === 'TODO').length,
    },
  };
}
