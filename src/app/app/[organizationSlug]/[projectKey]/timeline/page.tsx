import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CreateSprintDialog } from "./_components/create-sprint-dialog";
import { SprintActions } from "./_components/sprint-actions";

export default async function TimelinePage({
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
      issues: {
        where: {
          type: { in: ["EPIC", "STORY"] },
        },
        include: {
          assignee: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
      sprints: {
        orderBy: { startDate: "asc" },
      },
    },
  });

  if (!project) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
        <p className="text-muted-foreground">
          Visualize your project's progress and milestones.
        </p>
      </div>

      {/* Sprints Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Sprints</CardTitle>
          <CardDescription>Active and upcoming sprints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{sprint.name}</h4>
                  <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {sprint.startDate && (
                      <span>Start: {format(new Date(sprint.startDate), "MMM d, yyyy")}</span>
                    )}
                    {sprint.endDate && (
                      <span>End: {format(new Date(sprint.endDate), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium capitalize">{sprint.status.toLowerCase()}</div>
                  <SprintActions sprint={sprint} />
                </div>
              </div>
            ))}
            {project.sprints.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sprints created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issues Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Epics & Stories</CardTitle>
          <CardDescription>Major work items and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{issue.key}</span>
                    <h4 className="font-medium">{issue.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {issue.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{issue.status.name}</span>
                    {issue.assignee && (
                      <span className="text-xs text-muted-foreground">
                        Assigned to {issue.assignee.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(issue.createdAt), "MMM d")}
                </div>
              </div>
            ))}
            {project.issues.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No epics or stories yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
