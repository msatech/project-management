import { getProjectAnalytics } from "@/lib/actions/analytics.actions";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "./_components/analytics-charts";

export default async function AnalyticsPage({
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
  });

  if (!project) return notFound();

  const analytics = await getProjectAnalytics(project.id);

  if (!analytics) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Project insights and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Issues</CardDescription>
            <CardTitle className="text-3xl">{analytics.summary.totalIssues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{analytics.summary.completedIssues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{analytics.summary.inProgressIssues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>To Do</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{analytics.summary.todoIssues}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <AnalyticsCharts analytics={analytics} />
    </div>
  );
}
