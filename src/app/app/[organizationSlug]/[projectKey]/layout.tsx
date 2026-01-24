import { ProjectNav } from '@/components/layout/project-nav';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string; projectKey: string }>;
}) {
  const { organizationSlug, projectKey } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const project = await db.project.findFirst({
    where: {
      key: projectKey,
      organization: {
        slug: organizationSlug,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b">
            <div className="px-6">
                <h1 className="text-2xl font-bold tracking-tight py-4">{project.name}</h1>
                <ProjectNav projectKey={project.key} orgSlug={organizationSlug} />
            </div>
        </div>
        <div className="flex-1 p-6 pt-4">
            {children}
        </div>
    </div>
  );
}
