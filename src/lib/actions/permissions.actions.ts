'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function getUserPermissions(orgSlug: string): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      owner: true,
      members: {
        where: { userId: session.user.id },
        include: {
          role: {
            include: { permissions: true }
          }
        }
      }
    }
  });

  if (!org) return [];

  // Owner has all permissions
  if (org.ownerId === session.user.id) {
    return ['*']; // Wildcard for all permissions
  }

  const member = org.members[0];
  if (!member) return [];

  // Get permissions from role
  if (member.role) {
    return member.role.permissions.map((p: any) => p.action);
  }

  // Default permissions based on orgRole (backwards compatibility)
  if (member.orgRole === 'ADMIN') {
    return ['*'];
  }

  // Default member permissions
  return ['CREATE_ISSUES', 'EDIT_OWN_ISSUES'];
}
