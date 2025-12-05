'use server';

import { db } from "../db";
import { getSession } from "../session";
import { revalidatePath } from "next/cache";

export async function createOrganization(name: string) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existingOrg = await db.organization.findUnique({ where: { slug } });
    if (existingOrg) {
        throw new Error("Organization with this name already exists, please choose another.");
    }

    const newOrg = await db.organization.create({
        data: {
            name,
            slug,
            ownerId: session.user.id,
            members: {
                create: {
                    userId: session.user.id,
                    orgRole: 'OWNER',
                }
            }
        }
    });

    revalidatePath('/app');

    return newOrg;
}
