'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { BoardColumn } from './board-column';
import { IssueCard } from './issue-card';
import { updateIssueOrder } from '@/lib/actions/issue.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function BoardView({ project, initialIssues, statuses: initialStatuses, users, currentUser, sprints = [] }: any) {
    const [issues, setIssues] = useState(initialIssues);
    const [statuses, setStatuses] = useState(initialStatuses);
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const [isPollingPaused, setIsPollingPaused] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fast Polling for Realtime Updates
    useEffect(() => {
        if (isPollingPaused) return;

        const interval = setInterval(async () => {
            if (document.hidden) return; // Don't poll if tab is backgrounded
            
            try {
                const res = await fetch(`/api/board/${project.key}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    setIssues((prev: any[]) => {
                        const isDifferent = JSON.stringify(prev) !== JSON.stringify(data.issues);
                        return isDifferent ? data.issues : prev;
                    });
                    
                    setStatuses((prev: any[]) => {
                        const isDifferent = JSON.stringify(prev) !== JSON.stringify(data.statuses);
                        return isDifferent ? data.statuses : prev;
                    });
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [project.key, isPollingPaused]);


    const issuesById = useMemo(() => {
        const map = new Map();
        issues.forEach((issue: any) => map.set(issue.id, issue));
        return map;
    }, [issues]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setIsPollingPaused(true);
        const { active } = event;
        const activeId = active.id;
        const activeIssue = issuesById.get(activeId);
        setActiveIssue(activeIssue);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAnIssue = active.data.current?.type === 'Issue';
        const isOverAnIssue = over.data.current?.type === 'Issue';
        
        // Dropping an Issue over another Issue
        if (isActiveAnIssue && isOverAnIssue) {
            setIssues((issues: any) => {
                const activeIndex = issues.findIndex((i: any) => i.id === activeId);
                const overIndex = issues.findIndex((i: any) => i.id === overId);

                if (issues[activeIndex].statusId !== issues[overIndex].statusId) {
                    issues[activeIndex].statusId = issues[overIndex].statusId;
                    return arrayMove(issues, activeIndex, overIndex - 1);
                }

                return arrayMove(issues, activeIndex, overIndex);
            });
        }

        // Dropping an Issue over a column
        const isOverAColumn = over.data.current?.type === 'Column';
        if (isActiveAnIssue && isOverAColumn) {
            setIssues((issues: any) => {
                const activeIndex = issues.findIndex((i: any) => i.id === activeId);
                issues[activeIndex].statusId = overId;
                return arrayMove(issues, activeIndex, activeIndex);
            });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveIssue(null);
        setIsPollingPaused(false);
        const { active, over } = event;
        if (!over) return;

        const activeIssueId = active.id;
        const overId = over.id;

        if (activeIssueId === overId) return;

        const newStatusId = over.data.current?.type === 'Column' ? overId : over.data.current?.issue.statusId;
        const originalIssue = issuesById.get(activeIssueId);
        const newOrderIssues = issues.filter((i: any) => i.statusId === newStatusId);

        try {
            await updateIssueOrder({
                issueId: activeIssueId.toString(),
                statusId: newStatusId.toString(),
                orderedIds: newOrderIssues.map((i: any) => i.id),
                projectId: project.id,
            });

            // Force refresh to get persisted state from server
            router.refresh();

            if (originalIssue && originalIssue.statusId !== newStatusId) {
                toast({
                    title: `Issue moved to ${statuses.find((s:any) => s.id === newStatusId)?.name}`
                });
            }

        } catch (error) {
            toast({
                title: 'Error updating issue',
                description: 'Could not save changes. Please refresh and try again.',
                variant: 'destructive',
            });
            // Revert optimistic update by refreshing
            router.refresh(); 
        }
    };


    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-4">
                <SortableContext items={statuses.map((s: any) => s.id)}>
                    {statuses.map((status: any) => (
                        <BoardColumn
                            key={status.id}
                            status={status}
                            issues={issues.filter((issue: any) => issue.statusId === status.id)}
                            users={users}
                            project={project}
                            currentUser={currentUser}
                            statuses={statuses}
                            sprints={sprints}
                        />
                    ))}
                </SortableContext>
            </div>
            {isMounted && createPortal(
                <DragOverlay>
                    {activeIssue && (
                        <IssueCard
                            issue={activeIssue}
                            users={users}
                            isDragging
                        />
                    )}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}