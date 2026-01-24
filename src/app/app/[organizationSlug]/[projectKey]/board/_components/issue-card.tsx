'use client'

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { getIssueTypeIcon, getPriorityIcon } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Bot, MessageSquare, Paperclip, Calendar } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { IssueDetailSheet } from './issue-detail-sheet';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
  

export function IssueCard({ issue, users, statuses, sprints = [] }: any) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    
    // Check if this issue is selected in URL
    const isOpen = searchParams.get('issue') === issue.key;

    const onOpenChange = (open: boolean) => {
        if (open) {
            router.push(`${pathname}?issue=${issue.key}`, { scroll: false });
        } else {
            router.push(pathname, { scroll: false });
        }
    };

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
    
    // Format Date
    const date = new Date(issue.createdAt);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const cardContent = (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-3 touch-manipulation hover:shadow-lg cursor-grab bg-card/80 backdrop-blur-sm border border-border/50 hover:border-border transition-all group flex flex-col min-h-[100px]"
        >
            {/* Title */}
            <p className="text-sm font-medium text-foreground mb-4 line-clamp-2 leading-snug">
                {issue.title}
            </p>
            
            {/* Bottom Section */}
            <div className="flex justify-between items-center gap-2 mt-auto pt-2 border-t border-border/10">
                {/* Left: Type, Priority, and Key */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        {(() => {
                            const TypeIcon = getIssueTypeIcon(issue.type);
                            return <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />;
                        })()}
                        {(() => {
                            const PriorityIcon = getPriorityIcon(issue.priority);
                            return <PriorityIcon className="h-3.5 w-3.5" />;
                        })()}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {issue.key}
                    </span>
                </div>
                
                {/* Right: Metadata (Attachments, Comments) & Assignee */}
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        {/* Attachments Count */}
                        {(issue._count?.attachments || 0) > 0 && (
                            <div className="flex items-center gap-1" title="Attachments">
                                <Paperclip className="h-3 w-3" />
                                <span className="text-[10px]">{issue._count.attachments}</span>
                            </div>
                        )}
                        
                        {/* Comments Count */}
                        {(issue._count?.comments || 0) > 0 && (
                            <div className="flex items-center gap-1" title="Comments">
                                <MessageSquare className="h-3 w-3" />
                                <span className="text-[10px]">{issue._count.comments}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Assignee Avatar */}
                    {assignee ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-5 w-5 border border-border">
                                        <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                        <AvatarFallback className="text-[8px]">{assignee.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{assignee.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <span className="sr-only">Unassigned</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="p-3 bg-card rounded-lg shadow-2xl opacity-90 scale-105 rotate-1 cursor-grabbing border border-primary/50 flex flex-col min-h-[100px]"
            >
                <p className="text-sm font-medium text-foreground mb-4 line-clamp-2">{issue.title}</p>
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/10">
                     <span className="text-[11px] font-medium text-muted-foreground">{issue.key}</span>
                     {assignee && (
                         <Avatar className="h-5 w-5 border border-border">
                             <AvatarImage src={assignee.avatarUrl} />
                             <AvatarFallback className="text-[8px]">{assignee.name?.[0]}</AvatarFallback>
                         </Avatar>
                     )}
                </div>
            </div>
        );
    }
    

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{cardContent}</DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] h-[90vh] flex flex-col">
                <DialogTitle className="sr-only">Issue Details</DialogTitle>
                <IssueDetailSheet issueId={issue.id} users={users} statuses={statuses} sprints={sprints} />
            </DialogContent>
        </Dialog>
    );
}
