import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { MembersList } from "./_components/members-list";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { slug: organizationSlug },
    include: {
      members: {
        include: {
          user: true,
          role: {
            include: {
              permissions: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      roles: {
        include: {
          permissions: true,
        },
      },
      owner: true,
    },
  });

  if (!org) notFound();

  // Check if current user is a member
  const currentMember = org.members.find((m) => m.userId === session.user.id);
  if (!currentMember) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
        <p className="text-muted-foreground">
          Manage your organization members and their roles
        </p>
      </div>

      <MembersList
        members={org.members}
        roles={org.roles}
        organizationSlug={organizationSlug}
        currentUserId={session.user.id}
        ownerId={org.ownerId}
      />
    </div>
  );
}
