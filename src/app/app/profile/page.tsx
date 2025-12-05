import { PagePlaceholder } from "@/components/page-placeholder";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    return <PagePlaceholder title="Profile" description={`Hello, ${session.user.name}. This is your profile page.`} />;
}
