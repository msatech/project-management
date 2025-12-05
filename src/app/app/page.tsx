import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AppRootPage() {
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

    if (firstOrgMember) {
        return redirect(`/app/${firstOrgMember.organization.slug}`);
    }

    // This should be caught by the layout, but as a fallback
    return redirect('/app/create-organization');
}
