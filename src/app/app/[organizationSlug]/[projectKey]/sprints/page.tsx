import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { SprintList } from "./_components/sprint-list";
import { CreateSprintDialog } from "../timeline/_components/create-sprint-dialog";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectKey: string }>;
}) {
  const { organizationSlug, projectKey } = await params;
  const session = await getSession();
  if (!session) return notFound();

  const project = await db.project.findFirst({
    where: {
      key: projectKey,
      organization: { slug: organizationSlug },
    },
    include: {
      sprints: {
        include: {
          issues: {
            include: {
              issue: {
                include: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) return notFound();

  const activeSprints = project.sprints.filter(s => s.status === 'ACTIVE');
  const futureSprints = project.sprints.filter(s => s.status === 'FUTURE');
  const completedSprints = project.sprints.filter(s => s.status === 'COMPLETED');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sprints</h2>
          <p className="text-muted-foreground">
            Plan and manage your team's sprints
          </p>
        </div>
        <CreateSprintDialog projectId={project.id} />
      </div>

      <SprintList
        activeSprints={activeSprints}
        futureSprints={futureSprints}
        completedSprints={completedSprints}
        projectKey={projectKey}
        organizationSlug={organizationSlug}
      />
    </div>
  );
}
