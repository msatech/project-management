'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProjectMembersProps {
  members: any[];
  max?: number;
}

export function ProjectMembers({ members, max = 5 }: ProjectMembersProps) {
  const [open, setOpen] = useState(false);

  // Deduplicate users
  const uniqueMembers = Array.from(
    new Map(members.map((m) => [m.userId, m])).values()
  );

  const displayMembers = uniqueMembers.slice(0, max);
  const remaining = uniqueMembers.length - max;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <div className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <TooltipProvider>
                {displayMembers.map((member) => (
                <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-background ring-ring hover:z-10 transition-transform hover:scale-105">
                        <AvatarImage src={member.user.image || member.user.avatarUrl} alt={member.user.name || 'User'} />
                        <AvatarFallback>
                        {member.user.name
                            ? member.user.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>{member.user.name || member.user.email}</p>
                    </TooltipContent>
                </Tooltip>
                ))}
                {remaining > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground ring-ring hover:z-10">
                    +{remaining}
                </div>
                )}
            </TooltipProvider>
            </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Members</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
                {uniqueMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                            <Avatar>
                                <AvatarImage src={member.user.image || member.user.avatarUrl} />
                                <AvatarFallback>
                                    {member.user.name
                                        ? member.user.name.split(' ').map((n:string) => n[0]).join('').toUpperCase().slice(0, 2)
                                        : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium leading-none">{member.user.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{member.user.email}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {member.role?.name || member.orgRole}
                        </Badge>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
