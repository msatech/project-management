import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import React from 'react';
import { db } from '@/lib/db';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    return redirect('/login');
  }

  const firstOrgMember = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      organization: true
    }
  });
  
  const hasOrgs = !!firstOrgMember;
  const currentPath = '/app'; // This is a simplified check
  
  if (!hasOrgs) {
    // If user is not trying to create an org, redirect them.
    if (currentPath !== '/app/create-organization') {
        return redirect('/app/create-organization');
    }
  } else if (currentPath === '/app' || currentPath === '/app/') {
     // If user has orgs and is at the root /app, redirect them.
     return redirect(`/app/${firstOrgMember.organization.slug}`);
  }


  return <>{children}</>;
}
