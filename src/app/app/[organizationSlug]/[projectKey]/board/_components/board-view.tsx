'use client'

import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { BoardColumn, BoardColumnSkeleton } from './board-column';
import { IssueCard } from './issue-card';
import { updateIssueOrder, updateIssueStatus } from '@/lib/actions/issue.actions';
import { useToast } from '@/hooks/use-toast';

export function BoardView({ project, initialIssues, statuses, users, currentUser }: any) {
    const [issues, setIssues] = useState(initialIssues);
    const [activeIssue, setActiveIssue] = useState<any>(null);
    const { toast } = useToast();

    const issuesById = useMemo(() => {
        const map = new Map();
        issues.forEach((issue: any) => map.set(issue.id, issue));
        return map;
    }, [issues]);

    const columnsId = useMemo(() => statuses.map((col: any) => col.id), [statuses]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );
    
    const handleDragStart = (event: DragStartEvent) => {
        setActiveIssue(event.active.data.current?.issue);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAnIssue = active.data.current?.type === 'Issue';
        const isOverAnIssue = over.data.current?.type === 'Issue';

        if (!isActiveAnIssue) return;
        
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
        const { active, over } = event;
        if (!over) return;

        const activeIssueId = active.id;
        const overId = over.id;

        if (activeIssueId === overId) return;

        const newStatusId = over.data.current?.type === 'Column' ? overId : over.data.current?.issue.statusId;
        const originalIssue = initialIssues.find((i: any) => i.id === activeIssueId);
        const newOrderIssues = issues.filter((i: any) => i.statusId === newStatusId);

        try {
            await updateIssueOrder({
                issueId: activeIssueId,
                statusId: newStatusId,
                orderedIds: newOrderIssues.map((i: any) => i.id),
                projectId: project.id,
            });

            if (originalIssue.statusId !== newStatusId) {
                toast({
                    title: `Issue moved to ${statuses.find((s:any) => s.id === newStatusId).name}`
                });
            }

        } catch (error) {
            toast({
                title: 'Error updating issue',
                description: 'Could not save changes. Please refresh and try again.',
                variant: 'destructive',
            });
            // Revert optimistic update
            setIssues(initialIssues);
        }
    };


    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="flex gap-4 h-full overflow-x-auto">
                <SortableContext items={columnsId}>
                    {statuses.map((status: any) => (
                        <BoardColumn
                            key={status.id}
                            status={status}
                            issues={issues.filter((issue: any) => issue.statusId === status.id)}
                            users={users}
                            project={project}
                            currentUser={currentUser}
                        />
                    ))}
                </SortableContext>
            </div>
            {createPortal(
                <DragOverlay>
                    {activeIssue && (
                        <IssueCard
                            issue={activeIssue}
                            users={users}
                        />
                    )}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}