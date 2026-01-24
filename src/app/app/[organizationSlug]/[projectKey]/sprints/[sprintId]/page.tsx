import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { SprintBoard } from "../_components/sprint-board";
import { SprintMetrics } from "../_components/sprint-metrics";
import { SprintActions } from "../../timeline/_components/sprint-actions";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ organizationSlug: string; projectKey: string; sprintId: string }>;
}) {
  const { organizationSlug, projectKey, sprintId } = await params;
  const session = await getSession();
  if (!session) return notFound();

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        include: {
          statuses: {
            orderBy: { order: 'asc' },
          },
          organization: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
      issues: {
        include: {
          issue: {
            include: {
              status: true,
              assignee: true,
              reporter: true,
            },
          },
        },
      },
    },
  });

  if (!sprint) return notFound();

  const issues = sprint.issues.map(is => is.issue);
  const users = sprint.project.organization.members.map(m => m.user);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/app/${organizationSlug}/${projectKey}/sprints`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Sprints
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{sprint.name}</h1>
            <Badge variant={
              sprint.status === 'ACTIVE' ? 'default' :
              sprint.status === 'COMPLETED' ? 'secondary' :
              'outline'
            }>
              {sprint.status}
            </Badge>
          </div>
          {sprint.goal && (
            <p className="text-muted-foreground">{sprint.goal}</p>
          )}
          {(sprint.startDate || sprint.endDate) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {sprint.startDate && format(new Date(sprint.startDate), "MMM d, yyyy")}
              {sprint.startDate && sprint.endDate && " - "}
              {sprint.endDate && format(new Date(sprint.endDate), "MMM d, yyyy")}
            </div>
          )}
        </div>
        <SprintActions sprint={sprint} />
      </div>

      {/* Metrics */}
      <SprintMetrics sprint={sprint} />

      {/* Sprint Board */}
      <SprintBoard
        issues={issues}
        statuses={sprint.project.statuses}
        users={users}
        sprintId={sprint.id}
        projectId={sprint.project.id}
      />
    </div>
  );
}
