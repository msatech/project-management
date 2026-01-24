import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { CreateProjectForm } from '../_components/create-project-form';

export default async function CreateProjectPage({ 
  params 
}: { 
  params: Promise<{ organizationSlug: string }> 
}) {
  const { organizationSlug } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const org = await db.organization.findUnique({
    where: { slug: organizationSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!org || org.members.length === 0) {
    redirect('/app');
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
      <CreateProjectForm organization={org} />
    </div>
  );
}
