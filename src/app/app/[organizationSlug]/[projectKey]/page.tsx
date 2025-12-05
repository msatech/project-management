import { redirect } from 'next/navigation';

// The root of a project will redirect to the board.
export default function ProjectDashboardPage({ params }: { params: { organizationSlug: string, projectKey: string } }) {
    redirect(`/app/${params.organizationSlug}/${params.projectKey}/board`);
}