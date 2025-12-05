'use client'

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { getIssueTypeIcon, getPriorityIcon } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Bot } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { IssueDetailSheet } from './issue-detail-sheet';
  

export function IssueCard({ issue, users }: any) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: issue.id,
        data: {
            type: 'Issue',
            issue,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const assignee = users.find((user: any) => user.id === issue.assigneeId);
    const IssueIcon = getIssueTypeIcon(issue.type);
    const PriorityIcon = getPriorityIcon(issue.priority);
    
    const cardContent = (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-3 touch-manipulation hover:bg-secondary/80 cursor-grab"
        >
            <p className="text-sm font-medium leading-none mb-2">{issue.title}</p>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <IssueIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{issue.type}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger>
                                <PriorityIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{issue.priority}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">{issue.key}</span>
                </div>
                {assignee && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Assigned to {assignee.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </Card>
    );

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="p-3 bg-card rounded-lg shadow-md opacity-50 border border-dashed border-primary"
            >
                <p className="text-sm font-medium leading-none mb-2">{issue.title}</p>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <IssueIcon className="h-4 w-4 text-muted-foreground" />
                        <PriorityIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{issue.key}</span>
                    </div>
                </div>
            </div>
        );
    }
    

    return (
        <Dialog>
            <DialogTrigger asChild>{cardContent}</DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] h-[90vh] flex flex-col">
                <IssueDetailSheet issueId={issue.id} users={users} />
            </DialogContent>
        </Dialog>
    );
}
