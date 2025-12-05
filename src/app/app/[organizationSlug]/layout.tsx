import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import React from 'react';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { organizationSlug: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const org = await db.organization.findUnique({
    where: { slug: params.organizationSlug },
    include: {
      projects: {
        orderBy: {
            name: 'asc'
        }
      },
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!org || org.members.length === 0) {
    // If the user is not a member, maybe they are trying to access a different org
    // Let's find their first org and redirect them there.
    const firstUserOrg = await db.organization.findFirst({
      where: { members: { some: { userId: session.user.id } } },
      orderBy: { createdAt: 'asc' },
    });
    if (firstUserOrg) {
      redirect(`/app/${firstUserOrg.slug}`);
    }
    // If they have no orgs, something is wrong, redirect to create one
    redirect('/app/create-organization');
  }

  const userOrgs = await db.organization.findMany({
    where: { members: { some: { userId: session.user.id } } },
  });


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar user={session.user} currentOrg={org} userOrgs={userOrgs} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader />
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-0">
            {children}
        </main>
      </div>
    </div>
  );
}
