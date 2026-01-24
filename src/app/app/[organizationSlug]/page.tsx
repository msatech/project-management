import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { CreateProjectForm } from './_components/create-project-form';

export default async function OrganizationDashboardPage({ 
  params 
}: { 
  params: Promise<{ organizationSlug: string }> 
}) {
  const { organizationSlug } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const org = await db.organization.findUnique({
    where: { slug: organizationSlug },
    include: {
      projects: {
        orderBy: {
          createdAt: 'asc',
        },
        take: 1,
      },
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!org || org.members.length === 0) {
    notFound();
  }

  // If the org has a project, redirect to the first one.
  if (org.projects.length > 0) {
    const firstProject = org.projects[0];
    redirect(`/app/${org.slug}/${firstProject.key}`);
  }

  // If the org has no projects, show the create project form.
  return <CreateProjectForm organization={org} />;
}
