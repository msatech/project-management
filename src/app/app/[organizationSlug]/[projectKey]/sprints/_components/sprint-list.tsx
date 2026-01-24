"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { SprintActions } from "../../timeline/_components/sprint-actions";

interface SprintListProps {
  activeSprints: any[];
  futureSprints: any[];
  completedSprints: any[];
  projectKey: string;
  organizationSlug: string;
}

export function SprintList({
  activeSprints,
  futureSprints,
  completedSprints,
  projectKey,
  organizationSlug,
}: SprintListProps) {
  const renderSprintCard = (sprint: any) => {
    const totalIssues = sprint.issues?.length || 0;
    const completedIssues = sprint.issues?.filter(
      (is: any) => is.issue.status.category === "DONE"
    ).length || 0;
    const progress = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

    return (
      <Link
        key={sprint.id}
        href={`/app/${organizationSlug}/${projectKey}/sprints/${sprint.id}`}
      >
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <Badge variant={
                    sprint.status === 'ACTIVE' ? 'default' :
                    sprint.status === 'COMPLETED' ? 'secondary' :
                    'outline'
                  }>
                    {sprint.status === 'ACTIVE' && <PlayCircle className="h-3 w-3 mr-1" />}
                    {sprint.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {sprint.status === 'FUTURE' && <Circle className="h-3 w-3 mr-1" />}
                    {sprint.status}
                  </Badge>
                </div>
                {sprint.goal && (
                  <CardDescription className="line-clamp-2">
                    {sprint.goal}
                  </CardDescription>
                )}
              </div>
              <div onClick={(e) => e.preventDefault()}>
                <SprintActions sprint={sprint} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            {(sprint.startDate || sprint.endDate) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {sprint.startDate && format(new Date(sprint.startDate), "MMM d")}
                {sprint.startDate && sprint.endDate && " - "}
                {sprint.endDate && format(new Date(sprint.endDate), "MMM d, yyyy")}
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {completedIssues} / {totalIssues} issues
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalIssues}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalIssues - completedIssues}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedIssues}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* Active Sprints */}
      {activeSprints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Active Sprints
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSprints.map(renderSprintCard)}
          </div>
        </div>
      )}

      {/* Future Sprints */}
      {futureSprints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Circle className="h-5 w-5 text-blue-600" />
            Future Sprints
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {futureSprints.map(renderSprintCard)}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gray-600" />
            Completed Sprints
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedSprints.map(renderSprintCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeSprints.length === 0 && futureSprints.length === 0 && completedSprints.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Circle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sprints yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Create your first sprint to start planning and tracking your team's work.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
