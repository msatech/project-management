import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    return redirect('/login');
  }

  const hasOrgs = session.user.organizations && session.user.organizations.length > 0;

  if (!hasOrgs) {
    return redirect('/app/create-organization');
  }

  return <>{children}</>;
}
