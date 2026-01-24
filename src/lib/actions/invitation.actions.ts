'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function acceptInvitation(invitationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      organization: true,
      project: true,
    },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email !== session.user.email) throw new Error("Unauthorized");
  if (invitation.status !== "PENDING") throw new Error("Invitation already processed");
  if (new Date() > invitation.expiresAt) throw new Error("Invitation expired");

  // Add user to organization or project
  const targetOrganizationId = invitation.organizationId || invitation.project?.organizationId;
  let targetOrgSlug = invitation.organization?.slug;

  if (targetOrganizationId) {
    // Check if member already exists to avoid unique constraint violation errors
    const existingMember = await db.organizationMember.findFirst({
      where: {
        organizationId: targetOrganizationId,
        userId: session.user.id,
      },
    });

    if (!existingMember) {
      await db.organizationMember.create({
        data: {
          organizationId: targetOrganizationId,
          userId: session.user.id,
          orgRole: invitation.role || "MEMBER",
        },
      });
    }

    // If we don't have the slug yet (project invite), fetch it
    if (!targetOrgSlug) {
      const org = await db.organization.findUnique({
        where: { id: targetOrganizationId },
        select: { slug: true }
      });
      targetOrgSlug = org?.slug;
    }
  }

  // Update invitation status
  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });

  // Create notification for inviter
  if (targetOrgSlug) {
      await db.notification.create({
        data: {
          userId: invitation.inviterId,
          type: "INVITATION_ACCEPTED",
          title: "Invitation Accepted",
          message: `${session.user.name || session.user.email} accepted your invitation`,
          link: invitation.organizationId
            ? `/app/${targetOrgSlug}`
            : `/app/${targetOrgSlug}/${invitation.project?.key}`,
        },
      });

      // Revalidate the specific organization layout to update sidebar
      revalidatePath(`/app/${targetOrgSlug}`);
  }

  revalidatePath("/app");
  return { success: true };
}

export async function declineInvitation(invitationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.email !== session.user.email) throw new Error("Unauthorized");

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED" },
  });

  revalidatePath("/app");
  return { success: true };
}

export async function inviteUserToProject(projectId: string, email: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { organization: true },
  });

  if (!project) throw new Error("Project not found");

  // Check permission (only project lead or org owner/admin can invite - simplified to member for now)
  const orgMember = await db.organizationMember.findFirst({
    where: {
      organizationId: project.organizationId,
      userId: session.user.id,
    },
  });

  if (!orgMember) throw new Error("You are not a member of this organization");

  // Check if invitation already exists
  const existingInvite = await db.invitation.findFirst({
    where: {
      email,
      projectId,
      status: "PENDING",
    },
  });

  if (existingInvite) throw new Error("Invitation already sent");

  const token = (await import("crypto")).randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  await db.invitation.create({
    data: {
      email,
      projectId,
      // We don't necessarily set organizationId here, as it's a project invite. 
      // acceptInvitation will handle adding to org if needed.
      inviterId: session.user.id,
      token,
      expiresAt,
    },
  });

  // TODO: Send email
  
  return { success: true, token };
}
