'use client'

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface OrgSwitcherProps extends PopoverTriggerProps {
    user: any;
    currentOrg: any;
    userOrgs: any[];
}

export function OrgSwitcher({ className, user, currentOrg, userOrgs }: OrgSwitcherProps) {
  console.log('[OrgSwitcher] Received userOrgs:', userOrgs);
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const onOrgSelect = (org: any) => {
    setOpen(false)
    router.push(`/app/${org.slug}`)
    router.refresh()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className={cn("w-9 h-9", className)}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={`https://avatar.vercel.sh/${currentOrg.slug}.png`}
              alt={currentOrg.name}
            />
            <AvatarFallback>{currentOrg.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 ml-2">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organization..." />
            <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup key="organizations" heading="Organizations">
                {userOrgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => onOrgSelect(org)}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${org.slug}.png`}
                        alt={org.name}
                      />
                      <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {org.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentOrg.id === org.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push("/app/create-organization")
                }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
