'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { getSession } from '../session';

export async function updateStatus({
    statusId,
    name,
    projectId,
}: {
    statusId: string;
    name: string;
    projectId: string;
}) {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }

    const updatedStatus = await db.status.update({
        where: { id: statusId },
        data: { name },
        include: { project: { include: { organization: true } } }
    });

    if (updatedStatus.project) {
        revalidatePath(`/app/${updatedStatus.project.organization.slug}/${updatedStatus.project.key}/board`);
    }

    return updatedStatus;
}

export async function deleteStatus({
    statusId,
    projectId,
}: {
    statusId: string;
    projectId: string;
}) {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }

    // Check if issues exist in this status
    const issueCount = await db.issue.count({
        where: { statusId },
    });

    if (issueCount > 0) {
        throw new Error('Cannot delete a column that contains issues. Please move them first.');
    }

    const deletedStatus = await db.status.delete({
        where: { id: statusId },
        include: { project: { include: { organization: true } } }
    });

    if (deletedStatus.project) {
        revalidatePath(`/app/${deletedStatus.project.organization.slug}/${deletedStatus.project.key}/board`);
    }

    return deletedStatus;
}
