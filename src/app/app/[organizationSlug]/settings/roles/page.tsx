import { getRoles } from "@/lib/actions/role.actions";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateRoleDialog } from "./_components/create-role-dialog";
import { RoleCard } from "./_components/role-card";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const roles = await getRoles(organizationSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage custom roles and permissions for your organization.
          </p>
        </div>
        <CreateRoleDialog slug={organizationSlug} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} slug={organizationSlug} />
        ))}
      </div>

      {roles.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No custom roles yet</CardTitle>
            <CardDescription>
              Create your first custom role to define specific permissions for team members.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
