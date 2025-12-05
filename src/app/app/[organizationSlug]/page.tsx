import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';

export default async function OrganizationDashboardPage({ params }: { params: { organizationSlug: string } }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const org = await db.organization.findUnique({
    where: { slug: params.organizationSlug },
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

  if (org.projects.length > 0) {
    const firstProject = org.projects[0];
    redirect(`/app/${org.slug}/${firstProject.key}`);
  }

  // TODO: Add a page to create a new project if none exist.
  return (
    <div>
      <h1>Welcome to {org.name}</h1>
      <p>You don&apos;t have any projects yet. Create one to get started.</p>
    </div>
  );
}
