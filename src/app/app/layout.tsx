import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import React from 'react';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    return redirect('/login');
  }

  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || '';

  const firstOrgMember = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
      organization: true
    }
  });
  
  const hasOrgs = !!firstOrgMember;
  
  if (!hasOrgs) {
    // If user has no orgs and is not already trying to create one, redirect them.
    if (pathname !== '/app/create-organization') {
        return redirect('/app/create-organization');
    }
  } else if (pathname === '/app' || pathname === '/app/') {
     // If user has orgs and is at the root /app, redirect them to their first org.
     return redirect(`/app/${firstOrgMember.organization.slug}`);
  }

  return <>{children}</>;
}
