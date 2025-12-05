'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface ProjectNavProps extends React.HTMLAttributes<HTMLElement> {
    projectKey: string;
    orgSlug: string;
}

export function ProjectNav({ className, projectKey, orgSlug, ...props }: ProjectNavProps) {
  const pathname = usePathname()
  const basePath = `/app/${orgSlug}/${projectKey}`

  const links = [
    { name: "Board", href: `${basePath}/board` },
    { name: "Backlog", href: `${basePath}/backlog` },
    { name: "Sprints", href: `${basePath}/sprints` },
    { name: "Reports", href: `${basePath}/reports` },
    { name: "Settings", href: `${basePath}/settings` },
  ];
  
  return (
    <nav
      className={cn("flex space-x-2 lg:flex-row lg:space-x-4 lg:space-y-0", className)}
      {...props}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary pb-2",
            pathname === link.href
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  )
}
