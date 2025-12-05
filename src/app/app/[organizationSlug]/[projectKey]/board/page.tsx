import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { BoardView } from './_components/board-view';
import { getSession } from '@/lib/session';

export const revalidate = 0;

export default async function BoardPage({ params }: { params: { organizationSlug: string; projectKey: string } }) {
    const session = await getSession();
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: { slug: params.organizationSlug }
        },
        include: {
            statuses: {
                orderBy: { order: 'asc' }
            },
            issues: {
                include: {
                    assignee: true,
                    reporter: true,
                },
                orderBy: { order: 'asc' }
            },
            organization: {
                include: {
                    members: {
                        include: {
                            user: true,
                        }
                    }
                }
            }
        }
    });

    if (!project || !session) {
        notFound();
    }
    
    const users = project.organization.members.map(m => m.user);

    return <BoardView project={project} initialIssues={project.issues} statuses={project.statuses} users={users} currentUser={session.user} />;
}
