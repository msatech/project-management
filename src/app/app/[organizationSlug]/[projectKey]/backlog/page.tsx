import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { BacklogList } from "./_components/backlog-list";

export default async function BacklogPage({
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
          sprints: {
            none: {},
          },
        },
        include: {
          assignee: true,
          status: true,
          sprints: {
            include: {
              sprint: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      sprints: {
        where: {
          status: {
            in: ['ACTIVE', 'FUTURE'],
          },
        },
        orderBy: {
          startDate: 'asc',
        },
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
  });

  if (!project) return notFound();

  const users = project.organization.members.map(m => m.user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backlog</h2>
          <p className="text-muted-foreground">
            Prioritize and plan your work
          </p>
        </div>
      </div>

      <BacklogList
        issues={project.issues}
        sprints={project.sprints}
        users={users}
        projectId={project.id}
      />
    </div>
  );
}
