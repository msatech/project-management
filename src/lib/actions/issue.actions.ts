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
  const updatedIssue = await db.issue.update({
    where: { id: issueId },
    data: { statusId },
    include: {
      project: { include: { organization: true } },
      assignee: true,
      status: true
    }
  });

  const session = await getSession();
  
  // Notify Assignee of status change
  if (updatedIssue.assigneeId && updatedIssue.assigneeId !== session?.user.id) {
      await (db as any).notification.create({
          data: {
              userId: updatedIssue.assigneeId,
              type: 'ISSUE_STATUS_CHANGE',
              title: `Issue status updated`,
              message: `${session?.user.name} moved ${updatedIssue.key} to ${updatedIssue.status.name}`,
              link: `/app/${updatedIssue.project.organization.slug}/${updatedIssue.project.key}/board?issue=${updatedIssue.key}`,
          }
      });
  }

  if(updatedIssue.project) {
    revalidatePath(`/app/${updatedIssue.project.organization.slug}/${updatedIssue.project.key}/board`);
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
    const issue = await db.issue.findFirst({
        where: { 
            OR: [
                { id: issueId },
                { key: issueId }
            ]
        },
        include: {
            status: true,
            reporter: true,
            assignee: true,
            parent: true,
            children: {
                include: {
                    assignee: true,
                    status: true,
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            checklist: {
                orderBy: {
                    createdAt: 'asc'
                }
            },
            attachments: {
                include: {
                    uploader: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            comments: {
                include: {
                    author: true,
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            sprints: {
                include: {
                    sprint: true,
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

    // Get project to check permissions
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    // Check ASSIGN_ISSUES permission
    const { requireCurrentUserPermission } = await import('../permissions');
    await requireCurrentUserPermission(project.organizationId, 'ASSIGN_ISSUES');
    
    const updatedIssue = await db.issue.update({
      where: { id: issueId },
      data: { assigneeId },
      include: {
        project: { include: { organization: true } }
      }
    });
  
    if (assigneeId && assigneeId !== session.user.id) {
         await (db as any).notification.create({
            data: {
                userId: assigneeId,
                type: 'ISSUE_ASSIGNMENT',
                title: `You were assigned to ${updatedIssue.key}`,
                message: `${session.user.name} assigned you to ${updatedIssue.title}`,
                link: `/app/${updatedIssue.project.organization.slug}/${updatedIssue.project.key}/board?issue=${updatedIssue.key}`,
            }
        });
    }

    if (updatedIssue.project) {
      revalidatePath(`/app/${updatedIssue.project.organization.slug}/${updatedIssue.project.key}/board`);
    }
    if (updatedIssue.project) {
      revalidatePath(`/app/${updatedIssue.project.organization.slug}/${updatedIssue.project.key}/board`);
    }
}

export async function updateIssueDescription({
    issueId,
    description,
    projectId,
}: {
    issueId: string;
    description: string;
    projectId: string;
}) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await db.issue.update({
        where: { id: issueId },
        data: { description },
    });

    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
    if (project) {
        revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
        // We might not need to revalidate the board for description changes, but good to be safe if we show preview
    }
}

export async function addComment({ issueId, body, projectId }: { issueId: string, body: string, projectId: string }) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const comment = await db.comment.create({
        data: {
            body,
            issueId,
            authorId: session.user.id
        },
        include: {
          issue: {
            include: {
              project: {
                include: {
                  organization: true
                }
              },
              reporter: true,
              assignee: true,
            }
          }
        }
    });

    const issueUrl = `/app/${comment.issue.project.organization.slug}/${comment.issue.project.key}/board?issue=${comment.issue.key}`;

    // Notify Assignee if not author
    if (comment.issue.assigneeId && comment.issue.assigneeId !== session.user.id) {
        await (db as any).notification.create({
            data: {
                userId: comment.issue.assigneeId,
                type: 'COMMENT',
                title: `New comment on ${comment.issue.key}`,
                message: `${session.user.name} commented: "${body.substring(0, 50)}..."`,
                link: issueUrl,
            }
        });
    }

    // Notify Reporter if not author and not assignee (avoid double notify)
    if (comment.issue.reporterId && comment.issue.reporterId !== session.user.id && comment.issue.reporterId !== comment.issue.assigneeId) {
         await (db as any).notification.create({
            data: {
                userId: comment.issue.reporterId,
                type: 'COMMENT',
                title: `New comment on ${comment.issue.key}`,
                message: `${session.user.name} commented: "${body.substring(0, 50)}..."`,
                link: issueUrl,
            }
        });
    }

    // Handle @mentions (Simple implementation)
    // Regex to find @Word
    const mentionRegex = /@(\w+)/g;
    const matches = body.match(mentionRegex);
    
    if (matches) {
        for (const match of matches) {
            const username = match.substring(1); // Remove @
            // Find user by name (case insensitive first match)
            const mentionedUser = await db.user.findFirst({
                where: {
                    name: {
                        contains: username
                    }
                }
            });

            if (mentionedUser && mentionedUser.id !== session.user.id) {
                 await (db as any).notification.create({
                    data: {
                        userId: mentionedUser.id,
                        type: 'MENTION',
                        title: `You were mentioned in ${comment.issue.key}`,
                        message: `${session.user.name} mentioned you: "${body.substring(0, 50)}..."`,
                        link: issueUrl,
                    }
                });
            }
        }
    }

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

    const project = await db.project.findUnique({ where: { id: projectId }, include: { statuses: true, organization: true }});
    if (!project) throw new Error('Project not found');

    // Check CREATE_ISSUES permission
    const { requireCurrentUserPermission } = await import('../permissions');
    await requireCurrentUserPermission(project.organizationId, 'CREATE_ISSUES');

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
    
    // Notify Assignee
    if (newIssue.assigneeId && newIssue.assigneeId !== session.user.id) {
         await (db as any).notification.create({
            data: {
                userId: newIssue.assigneeId,
                type: 'ISSUE_ASSIGNMENT',
                title: `You were assigned to ${newIssue.key}`,
                message: `${session.user.name} assigned you to ${newIssue.title}`,
                link: org ? `/app/${org.slug}/${projectKey}/board?issue=${newIssue.key}` : '#',
            }
        });
    }

    if (org) {
        revalidatePath(`/app/${org.slug}/${project.key}/board`);
        revalidatePath(`/app/${org.slug}/${project.key}/backlog`);
        revalidatePath(`/app/${org.slug}/${project.key}`);
    }

    return newIssue;
  }

export async function updateIssueDetails({
    issueId,
    startDate,
    dueDate,
    estimatedHours,
    statusId,
    priority,
    projectId,
}: {
    issueId: string;
    startDate?: Date | null;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    statusId?: string;
    priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    projectId: string;
}) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    // Get project to check permissions
    const project = await db.project.findUnique({ where: { id: projectId }, include: { organization: true } });
    if (!project) throw new Error('Project not found');

    // Check EDIT_ALL_ISSUES permission
    const { requireCurrentUserPermission } = await import('../permissions');
    await requireCurrentUserPermission(project.organizationId, 'EDIT_ALL_ISSUES');

    const data: any = {};
    if (startDate !== undefined) data.startDate = startDate;
    if (dueDate !== undefined) data.dueDate = dueDate;
    if (estimatedHours !== undefined) data.estimatedHours = estimatedHours;
    if (statusId !== undefined) data.statusId = statusId;
    if (priority !== undefined) data.priority = priority;

    await db.issue.update({
        where: { id: issueId },
        data,
    });

    if (project) {
        revalidatePath(`/app/${project.organization.slug}/${project.key}/board`);
    }
}
