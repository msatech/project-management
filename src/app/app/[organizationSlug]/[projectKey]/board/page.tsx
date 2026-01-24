import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { BoardView } from './_components/board-view';
import { getSession } from '@/lib/session';
import { ProjectMembers } from './_components/project-members';
import { InviteToProjectDialog } from './_components/invite-to-project-dialog';
import { CreateIssueButton } from './_components/create-issue-button';
import { Suspense } from 'react';

export const revalidate = 0;

export default async function BoardPage({ params }: { params: Promise<{ organizationSlug: string; projectKey: string }> }) {
    const { organizationSlug, projectKey } = await params;
    const session = await getSession();
    const project = await db.project.findFirst({
        where: {
            key: projectKey,
            organization: { slug: organizationSlug }
        },
        include: {
            statuses: {
                orderBy: { order: 'asc' }
            },
            issues: {
                include: {
                    assignee: true,
                    reporter: true,
                    sprints: {
                        include: {
                            sprint: true,
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                            attachments: true,
                        }
                    },
                },
                orderBy: { order: 'asc' }
            },
            sprints: {
                where: { status: { in: ['ACTIVE', 'FUTURE'] } },
                orderBy: { createdAt: 'desc' }
            },
            organization: {
                include: {
                    members: {
                        include: {
                            user: true,
                            role: true,
                        }
                    }
                }
            }
        }
    });

    if (!project || !session) {
        notFound();
    }
    

    // Get members with roles
    const members = project.organization.members;
    
    // Derived users list for other components
    const users = members.map(m => m.user);

    return (
        <>
            <div className="flex justify-end mb-4 gap-2 items-center">
                <ProjectMembers members={members} />
                <InviteToProjectDialog projectId={project.id} />
                <CreateIssueButton 
                    projectId={project.id}
                    projectKey={project.key}
                    statuses={project.statuses}
                    users={users}
                />
            </div>
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading board...</div>}>
                <BoardView 
                    project={project} 
                    initialIssues={project.issues} 
                    statuses={project.statuses} 
                    users={users}
                    sprints={project.sprints}
                />
            </Suspense>
        </>
    );
}
