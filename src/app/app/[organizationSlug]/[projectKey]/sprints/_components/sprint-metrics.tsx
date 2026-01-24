"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, TrendingUp } from "lucide-react";

interface SprintMetricsProps {
  sprint: any;
}

export function SprintMetrics({ sprint }: SprintMetricsProps) {
  const totalIssues = sprint.issues?.length || 0;
  const completedIssues = sprint.issues?.filter(
    (is: any) => is.issue.status.category === "DONE"
  ).length || 0;
  const inProgressIssues = sprint.issues?.filter(
    (is: any) => is.issue.status.category === "IN_PROGRESS"
  ).length || 0;
  const todoIssues = sprint.issues?.filter(
    (is: any) => is.issue.status.category === "TODO"
  ).length || 0;

  const totalPoints = sprint.issues?.reduce(
    (sum: number, is: any) => sum + (is.issue.estimatePoints || 0),
    0
  ) || 0;
  const completedPoints = sprint.issues
    ?.filter((is: any) => is.issue.status.category === "DONE")
    .reduce((sum: number, is: any) => sum + (is.issue.estimatePoints || 0), 0) || 0;

  const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
  const pointsCompletionRate = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          <Circle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalIssues}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {todoIssues} to do · {inProgressIssues} in progress
          </p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedIssues}</div>
          <Progress value={completionRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completionRate.toFixed(0)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Story Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Story Points</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {completedPoints} / {totalPoints}
          </div>
          <Progress value={pointsCompletionRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {pointsCompletionRate.toFixed(0)}% of points done
          </p>
        </CardContent>
      </Card>

      {/* Velocity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Velocity</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedPoints}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Points completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
