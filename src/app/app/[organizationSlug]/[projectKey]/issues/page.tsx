
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import { IssueTable } from "./_components/issue-table";
import { IssueFilters } from "./_components/issue-filters";
import { IssueSheetWrapper } from "./_components/issue-sheet-wrapper";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string; projectKey: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { organizationSlug, projectKey } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getSession();
  
  if (!session) return notFound();

  const project = await db.project.findFirst({
    where: {
      key: projectKey,
      organization: { slug: organizationSlug },
    },
    include: {
      statuses: { orderBy: { order: 'asc' } },
      sprints: { 
        where: { status: { in: ['ACTIVE', 'FUTURE'] } },
        orderBy: { createdAt: 'desc' } 
      },
      organization: {
        include: {
            members: {
                include: { user: true }
            }
        }
      }
    },
  });

  if (!project) return notFound();

  // Construct Filter Clause
  const whereClause: Prisma.IssueWhereInput = {
    projectId: project.id,
  };

  const searchText = resolvedSearchParams.search as string;
  if (searchText) {
    whereClause.OR = [
      { title: { contains: searchText } },
      { description: { contains: searchText } },
      { key: { contains: searchText } },
    ];
  }

  const type = resolvedSearchParams.type as string;
  if (type && type !== "ALL") {
    whereClause.type = type;
  }

  const status = resolvedSearchParams.status as string;
  if (status && status !== "ALL") {
    whereClause.statusId = status;
  }

  const priority = resolvedSearchParams.priority as string;
  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }

  const assignee = resolvedSearchParams.assignee as string;
  if (assignee && assignee !== "ALL") {
      if (assignee === 'unassigned') {
          whereClause.assigneeId = null;
      } else {
          whereClause.assigneeId = assignee;
      }
  }

  const sprint = resolvedSearchParams.sprint as string;
  if (sprint && sprint !== "ALL") {
    if (sprint === 'none') {
      whereClause.sprints = { none: {} };
    } else {
      whereClause.sprints = { some: { sprintId: sprint } };
    }
  }

  // Pagination
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [issues, totalCount] = await Promise.all([
    db.issue.findMany({
      where: whereClause,
      include: {
        status: true,
        assignee: true,
        reporter: true,
        sprints: {
          include: {
            sprint: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.issue.count({ where: whereClause }),
  ]);

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        <p className="text-muted-foreground">
            Search and filter issues across the project.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <IssueFilters 
            statuses={project.statuses} 
            members={project.organization.members}
            sprints={project.sprints}
        />
        
        <IssueTable 
            issues={issues} 
            projectKey={projectKey} 
            organizationSlug={organizationSlug} 
            statuses={project.statuses}
            members={project.organization.members}
            sprints={project.sprints}
        />

        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {issues.length > 0 ? skip + 1 : 0} to {Math.min(skip + limit, totalCount)} of {totalCount} issues
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                    {page > 1 ? (
                        <Link href={`?search=${searchText || ''}&type=${type || ''}&status=${status || ''}&priority=${priority || ''}&assignee=${assignee || ''}&page=${page - 1}`}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Link>
                    ) : (
                        <span>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </span>
                    )}
                </Button>
                <Button variant="outline" size="sm" disabled={skip + issues.length >= totalCount} asChild={skip + issues.length < totalCount}>
                     {skip + issues.length < totalCount ? (
                        <Link href={`?search=${searchText || ''}&type=${type || ''}&status=${status || ''}&priority=${priority || ''}&assignee=${assignee || ''}&page=${page + 1}`}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    ) : (
                        <span>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </span>
                    )}
                </Button>
            </div>
        </div>

        <IssueSheetWrapper 
            users={project.organization.members.map(m => m.user)} 
            statuses={project.statuses}
            sprints={project.sprints}
        />
      </div>
    </div>
  );
}
