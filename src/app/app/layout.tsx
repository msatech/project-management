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

  // This check should only run if the user is at the root of the app section
  if (pathname === '/app' || pathname === '/app/') {
    const firstOrgMember = await db.organizationMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        organization: true
      }
    });
    
    if (firstOrgMember) {
       // If user has orgs and is at the root /app, redirect them to their first org.
       return redirect(`/app/${firstOrgMember.organization.slug}`);
    } else {
      // If user has no orgs, redirect them to create one.
      return redirect('/app/create-organization');
    }
  }

  // For any other path under /app that isn't create-organization, check for org membership.
  if (pathname.startsWith('/app/') && pathname !== '/app/create-organization') {
    const orgMemberCount = await db.organizationMember.count({
        where: { userId: session.user.id }
    });

    if (orgMemberCount === 0) {
        return redirect('/app/create-organization');
    }
  }


  return <>{children}</>;
}
