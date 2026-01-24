import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectKey: string }> }
) {
    const session = await getSession();
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectKey } = await params;

    const project = await db.project.findUnique({
        where: { key: projectKey },
        include: {
            organization: true,
        }
    });

    if (!project) {
        return new NextResponse("Project not found", { status: 404 });
    }

    // Check membership
    const member = await db.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: project.organization.id,
                userId: session.user.id,
            }
        }
    });

    if (!member) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const [issues, statuses] = await Promise.all([
        db.issue.findMany({
            where: { projectId: project.id },
            include: {
                assignee: true,
                reporter: true,
                status: true,
            },
            orderBy: { order: 'asc' },
        }),
        db.status.findMany({
            where: { projectId: project.id },
            orderBy: { order: 'asc' },
        })
    ]);

    return NextResponse.json({ issues, statuses });
}
