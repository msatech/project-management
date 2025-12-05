'use client'

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { IssueCard } from './issue-card';
import { Skeleton } from '@/components/ui/skeleton';

export function BoardColumn({ status, issues, users }: any) {
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
            className={columnStyle}
        >
            <div className="bg-muted text-sm font-semibold p-2 rounded-t-lg flex justify-between items-center">
                <span>{status.name}</span>
                <span className="text-muted-foreground">{issues.length}</span>
            </div>
            <div className="flex flex-grow flex-col gap-2 p-2 overflow-y-auto bg-muted/50 rounded-b-lg">
                <SortableContext items={issuesIds}>
                    {issues.map((issue: any) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            users={users}
                        />
                    ))}
                </SortableContext>
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
