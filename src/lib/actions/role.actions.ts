'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/permissions-constants";

export async function createRole(slug: string, data: {
  name: string;
  description?: string;
  permissions: string[];
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const org = await db.organization.findUnique({
    where: { slug },
    include: { members: { where: { userId: session.user.id } } }
  });

  if (!org || org.members.length === 0) throw new Error("Not a member");

  // Check if user has permission to manage roles
  const hasPermission = await checkPermission(session.user.id, slug, PERMISSIONS.MANAGE_ROLES);
  if (!hasPermission) throw new Error("Insufficient permissions");

  const role = await db.role.create({
    data: {
      name: data.name,
      description: data.description,
      organizationId: org.id,
      permissions: {
        create: data.permissions.map(action => ({ action }))
      }
    },
    include: { permissions: true }
  });

  revalidatePath(`/app/${slug}/settings/roles`);
  return role;
}

export async function getRoles(slug: string) {
  const session = await getSession();
  if (!session) return [];

  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      roles: {
        include: {
          permissions: true,
          _count: { select: { members: true } }
        }
      }
    }
  });

  if (!org) return [];
  return org.roles;
}

export async function updateRole(roleId: string, slug: string, data: {
  name?: string;
  description?: string;
  permissions?: string[];
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // If permissions are being updated, delete old ones and create new
  if (data.permissions) {
    await db.permission.deleteMany({ where: { roleId } });
  }

  const role = await db.role.update({
    where: { id: roleId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permissions && {
        permissions: {
          create: data.permissions.map(action => ({ action }))
        }
      })
    },
    include: { permissions: true }
  });

  revalidatePath(`/app/${slug}/settings/roles`);
  return role;
}

export async function deleteRole(roleId: string, slug: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.role.delete({ where: { id: roleId } });
  revalidatePath(`/app/${slug}/settings/roles`);
}

export async function assignRoleToMember(memberId: string, roleId: string, slug: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const hasPermission = await checkPermission(session.user.id, slug, PERMISSIONS.MANAGE_MEMBERS);
  if (!hasPermission) throw new Error("Insufficient permissions");

  await db.organizationMember.update({
    where: { id: memberId },
    data: { roleId }
  });

  revalidatePath(`/app/${slug}/settings/members`);
}

// Helper function to check if user has a specific permission
export async function checkPermission(userId: string, orgSlug: string, permission: string): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      owner: true,
      members: {
        where: { userId },
        include: {
          role: {
            include: { permissions: true }
          }
        }
      }
    }
  });

  if (!org) return false;
  
  // Owner has all permissions
  if (org.ownerId === userId) return true;

  const member = org.members[0];
  if (!member) return false;

  // Check if user's role has the permission
  if (member.role) {
    return member.role.permissions.some(p => p.action === permission);
  }

  // Default roles based on orgRole string (backwards compatibility)
  if (member.orgRole === 'ADMIN') {
    return true; // Admins have all permissions
  }

  return false;
}
