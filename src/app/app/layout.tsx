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

  const orgCount = await db.organizationMember.count({
    where: {
      userId: session.user.id,
    },
  });

  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') || '';

  if (orgCount === 0 && pathname !== '/app/create-organization') {
    return redirect('/app/create-organization');
  }

  return <>{children}</>;
}
