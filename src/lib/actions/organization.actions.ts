'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function getOrganizationMembers(slug: string) {
  const session = await getSession();
  if (!session) return [];

  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!org) return [];
  // Ensure current user is a member
  const isMember = org.members.some((m) => m.userId === session.user.id);
  if (!isMember) return [];

  return org.members;
}

export async function inviteUserToOrganization(slug: string, email: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const org = await db.organization.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!org) throw new Error("Organization not found");

  // Check permission (only owner or maybe admin can invite)
  // For now, anyone in the org can invite? Or check role.
  const currentMember = org.members.find((m) => m.userId === session.user.id);
  if (!currentMember) throw new Error("Not a member");

  // Check if user is already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const isAlreadyMember = org.members.some(
      (m) => m.userId === existingUser.id
    );
    if (isAlreadyMember) throw new Error("User is already a member");
  }

  // Check if invitation already exists
  const existingInvite = await db.invitation.findFirst({
    where: {
      email,
      organizationId: org.id,
      status: "PENDING",
    },
  });

  if (existingInvite) throw new Error("Invitation already sent");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  await db.invitation.create({
    data: {
      email,
      organizationId: org.id,
      inviterId: session.user.id,
      token,
      expiresAt,
    },
  });

  // TODO: Send email with link /invite/{token}
  // For now we just create the record.
  
  // Notify the inviter success? Or return token for debug?
  return { success: true, token }; 
}

export async function getPendingInvitations(slug: string) {
  const session = await getSession();
  if (!session) return [];

  const org = await db.organization.findUnique({
    where: { slug },
  });

  if (!org) return [];

  const invitations = await db.invitation.findMany({
    where: {
      organizationId: org.id,
      status: "PENDING",
    },
    include: {
      inviter: true
    },
    orderBy: {
        createdAt: 'desc'
    }
  });

  return invitations;
}

export async function removeMember(memberId: string, slug: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Logic to remove member
    await db.organizationMember.delete({
        where: { id: memberId }
    });
    
    revalidatePath(`/app/${slug}/settings/members`);
}

export async function updateMemberRole(memberId: string, slug: string, newRole: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  // Verify permissions (only owner/admin can change roles)
  // ... (simplified for now)

  await db.organizationMember.update({
    where: { id: memberId },
    data: { orgRole: newRole }
  });

  revalidatePath(`/app/${slug}/settings/members`);
}

export async function cancelInvitation(invitationId: string, slug: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    
    await db.invitation.delete({
        where: { id: invitationId }
    });

    revalidatePath(`/app/${slug}/settings/members`);
}
