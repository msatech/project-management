import Link from "next/link"
import {
  Home,
  Package,
  Settings,
  GitFork,
  LayoutDashboard,
  KanbanSquare,
  BookCopy,
  BarChart3,
  Mountain
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { OrgSwitcher } from "./org-switcher"
import { Project } from "@prisma/client"

type AppSidebarProps = {
    user: any;
    currentOrg: any & { projects: Project[] };
    userOrgs: any[];
}

export function AppSidebar({ user, currentOrg, userOrgs }: AppSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <OrgSwitcher user={user} currentOrg={currentOrg} userOrgs={userOrgs} />
            <Tooltip>
                <TooltipTrigger asChild>
                <Link
                    href={`/app/${currentOrg.slug}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            {currentOrg.projects.map((project: Project) => (
            <Tooltip key={project.id}>
                <TooltipTrigger asChild>
                <Link
                    href={`/app/${currentOrg.slug}/${project.key}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                    <Package className="h-5 w-5" />
                    <span className="sr-only">{project.name}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{project.name}</TooltipContent>
            </Tooltip>
            ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  )
}
