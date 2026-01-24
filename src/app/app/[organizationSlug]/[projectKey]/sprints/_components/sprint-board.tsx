"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateIssueStatus } from "@/lib/actions/issue.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bug, CheckSquare, Bookmark } from "lucide-react";

interface SprintBoardProps {
  issues: any[];
  statuses: any[];
  users: any[];
  sprintId: string;
  projectId: string;
}

export function SprintBoard({ issues: initialIssues, statuses, users, sprintId, projectId }: SprintBoardProps) {
  const [issues, setIssues] = useState(initialIssues);
  const { toast } = useToast();
  const router = useRouter();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG': return <Bug className="h-4 w-4 text-red-500" />;
      case 'STORY': return <Bookmark className="h-4 w-4 text-green-600" fill="currentColor" />;
      default: return <CheckSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatusId = destination.droppableId;
    const issueId = draggableId;

    // Optimistic update
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? { ...issue, statusId: newStatusId, status: statuses.find(s => s.id === newStatusId) }
          : issue
      )
    );

    try {
      await updateIssueStatus({ issueId, statusId: newStatusId, projectId });
      toast({ title: "Issue status updated" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
      setIssues(initialIssues); // Revert on error
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statuses.map((status) => {
          const statusIssues = issues.filter(issue => issue.statusId === status.id);

          return (
            <Card key={status.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{status.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {statusIssues.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg' : ''
                      }`}
                    >
                      {statusIssues.map((issue, index) => (
                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-card border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(issue.type)}
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {issue.key}
                                    </span>
                                  </div>
                                  <Badge variant={getPriorityColor(issue.priority) as any} className="text-xs">
                                    {issue.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium line-clamp-2">{issue.title}</p>
                                <div className="flex items-center justify-between">
                                  {issue.estimatePoints && (
                                    <Badge variant="outline" className="text-xs">
                                      {issue.estimatePoints} pts
                                    </Badge>
                                  )}
                                  {issue.assignee && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={issue.assignee.image || ""} />
                                      <AvatarFallback className="text-xs">
                                        {issue.assignee.name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {statusIssues.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No issues
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DragDropContext>
  );
}
