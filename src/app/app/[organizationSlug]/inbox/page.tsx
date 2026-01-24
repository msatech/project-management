import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation, declineInvitation } from "@/lib/actions/invitation.actions";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // Get invitations for this user
  const invitations = await db.invitation.findMany({
    where: {
      email: session.user.email!,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      inviter: true,
      organization: true,
      project: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">
          Invitations and notifications for you.
        </p>
      </div>

      {/* Invitations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Pending Invitations</CardTitle>
          </div>
          <CardDescription>
            You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">
                        {invitation.organizationId
                          ? `Join ${invitation.organization?.name}`
                          : `Join project ${invitation.project?.name}`}
                      </h4>
                      {invitation.role && (
                        <Badge variant="secondary" className="text-xs">
                          as {invitation.role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invitation.inviter.name || invitation.inviter.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={async () => {
                      'use server';
                      await acceptInvitation(invitation.id);
                    }}>
                      <Button size="sm" className="gap-2">
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                    </form>
                    <form action={async () => {
                      'use server';
                      await declineInvitation(invitation.id);
                    }}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
