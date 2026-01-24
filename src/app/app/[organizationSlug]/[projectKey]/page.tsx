import { redirect } from 'next/navigation';

// The root of a project will redirect to the board.
export default async function ProjectDashboardPage({ 
  params 
}: { 
  params: Promise<{ organizationSlug: string, projectKey: string }> 
}) {
    const { organizationSlug, projectKey } = await params;
    redirect(`/app/${organizationSlug}/${projectKey}/board`);
}