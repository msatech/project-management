'use client'

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { IssueCard } from './issue-card';
import { Skeleton } from '@/components/ui/skeleton';

import { CreateIssueButton } from './create-issue-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus } from 'lucide-react';

import { RenameColumnDialog } from './rename-column-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteStatus } from '@/lib/actions/status.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function BoardColumn({ project, status, issues, users, statuses, sprints = [] }: any) {
    const issuesIds = useMemo(() => {
        return issues.map((issue: any) => issue.id);
    }, [issues]);

    const { setNodeRef, transform, transition, isDragging } = useSortable({
        id: status.id,
        data: {
            type: 'Column',
            status,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const columnStyle = `
        min-w-[280px] w-[280px]
        h-full
        flex flex-col
    `;

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeletePending, startDeleteTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = () => {
        startDeleteTransition(async () => {
            try {
                await deleteStatus({
                    statusId: status.id,
                    projectId: project.id,
                });
                toast({ title: "Column deleted successfully" });
                router.refresh();
            } catch (error) {
                 toast({
                    title: "Failed to delete column",
                    description: (error as Error).message,
                    variant: "destructive"
                });
            }
        });
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`${columnStyle} opacity-40 border-2 border-primary rounded-lg`}
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${columnStyle} bg-muted/30 rounded-lg border border-border/50`}
        >
            {/* Column Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold text-foreground">{status.name}</span>
                     <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                        {issues.length}
                     </span>
                </div>
                <div className="flex gap-1">
                     <CreateIssueButton 
                        projectId={project.id} 
                        projectKey={project.key} 
                        statuses={statuses} 
                        users={users} 
                        defaultStatusId={status.id}
                     >
                         <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50">
                            <Plus className="h-4 w-4" />
                         </button>
                     </CreateIssueButton>
                     
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>Rename Column</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setIsDeleteOpen(true)}>Delete Column</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
            </div>

            {/* Rename Dialog */}
            <RenameColumnDialog 
                open={isRenameOpen} 
                onOpenChange={setIsRenameOpen} 
                statusId={status.id} 
                currentName={status.name}
                projectId={project.id}
            />

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the column "{status.name}".
                            Issues must be moved out of this column before it can be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeletePending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Issues List */}
            <div className="flex flex-grow flex-col gap-3 p-4 overflow-y-auto">
                <SortableContext items={issuesIds}>
                    {issues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <p className="text-sm text-muted-foreground">No issues</p>
                        </div>
                    ) : (
                        issues.map((issue: any) => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                users={users}
                                statuses={statuses}
                                sprints={sprints}
                            />
                        ))
                    )}
                </SortableContext>
                
                {/* Add Card Button at Bottom */}
                <CreateIssueButton 
                    projectId={project.id} 
                    projectKey={project.key} 
                    statuses={statuses} 
                    users={users} 
                    defaultStatusId={status.id}
                >
                    <div className="rounded-md border border-dashed border-border/50 p-2 flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/30 hover:border-border transition-colors cursor-pointer">
                        + Add New Card
                    </div>
                </CreateIssueButton>
            </div>
        </div>
    );
}

export function BoardColumnSkeleton() {
    return (
        <div className="min-w-[280px] w-[280px] flex flex-col">
            <div className="bg-muted p-2 rounded-t-lg">
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="flex flex-grow flex-col gap-2 p-2 bg-muted/50 rounded-b-lg">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
}
