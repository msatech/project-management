import Link from "next/link"
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Users,
  Plus,
  Shield
} from "lucide-react"
import { OrgSwitcher } from "./org-switcher"
import { Project } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppSidebar({ user, currentOrg, userOrgs, permissions = [] }: any) {
    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background md:flex">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/app" className="flex items-center gap-2 font-semibold">
                        <Briefcase className="h-6 w-6" />
                        <span className="">Project Manager</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <OrgSwitcher user={user} currentOrg={currentOrg} userOrgs={userOrgs} />
                    </nav>
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                        <Link
                            href={`/app/${currentOrg.slug}`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href={`/app/${currentOrg.slug}/inbox`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                            <Inbox className="h-4 w-4" />
                            Inbox
                        </Link>
                    </nav>

                    {/* Projects Section */}
                    <div className="px-3 py-2 mt-4">
                        <div className="flex items-center justify-between mb-2 px-3">
                            <h2 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                Projects
                            </h2>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <Link href={`/app/${currentOrg.slug}/create-project`}>
                                    <Plus className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {currentOrg.projects?.map((project: Project) => (
                                <Link
                                    key={project.id}
                                    href={`/app/${currentOrg.slug}/${project.key}`}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                                >
                                    <Briefcase className="h-4 w-4" />
                                    {project.name}
                                </Link>
                            ))}
                            {(!currentOrg.projects || currentOrg.projects.length === 0) && (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    No projects yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="px-3 py-2 mt-4">
                        <h2 className="mb-2 px-3 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Settings
                        </h2>
                        <div className="space-y-1">
                            <Link
                                href={`/app/${currentOrg.slug}/settings/members`}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                            >
                                <Users className="h-4 w-4" />
                                Members
                            </Link>
                            {(permissions.includes('MANAGE_ROLES') || currentOrg.ownerId === user?.id || currentOrg.ownerId === (user as any)?.userId) && (
                                <Link
                                    href={`/app/${currentOrg.slug}/settings/roles`}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                                >
                                    <Shield className="h-4 w-4" />
                                    Roles & Permissions
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="border-t p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-medium text-primary">
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">{user?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
