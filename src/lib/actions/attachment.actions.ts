'use server'

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { put } from '@vercel/blob';

export async function uploadAttachment({
  issueId,
  fileName,
  fileUrl,
  fileSize,
  fileType,
}: {
  issueId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const attachment = await db.attachment.create({
    data: {
      name: fileName,
      url: fileUrl,
      size: fileSize,
      type: fileType,
      issueId,
      uploaderId: session.user.id,
    },
  });

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: { project: { include: { organization: true } } }
  });

  if (issue) {
    revalidatePath(`/app/${issue.project.organization.slug}/${issue.project.key}/board`);
  }

  return attachment;
}

export async function deleteAttachment(attachmentId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      issue: {
        include: { project: { include: { organization: true } } }
      }
    }
  });

  if (!attachment) throw new Error('Attachment not found');

  // Only uploader can delete
  if (attachment.uploaderId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  await db.attachment.delete({ where: { id: attachmentId } });

  revalidatePath(`/app/${attachment.issue.project.organization.slug}/${attachment.issue.project.key}/board`);
}

export async function getAttachments(issueId: string) {
  return await db.attachment.findMany({
    where: { issueId },
    include: {
      uploader: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
