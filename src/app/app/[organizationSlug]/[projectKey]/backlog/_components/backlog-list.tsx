'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { assignIssueToSprint, removeIssueFromSprint } from "@/lib/actions/sprint.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { AssignToSprintDialog } from "../../_components/assign-to-sprint-dialog";
import { CreateSprintDialog } from "../../timeline/_components/create-sprint-dialog";

export function BacklogList({ issues, sprints, users, projectId }: any) {
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const issueId = draggableId;
    const targetSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;
    const sourceSprintId = source.droppableId === 'backlog' ? null : source.droppableId;

    try {
      // Remove from source sprint if exists
      if (sourceSprintId) {
        await removeIssueFromSprint({ issueId, sprintId: sourceSprintId });
      }

      // Add to target sprint if not backlog
      if (targetSprintId) {
        await assignIssueToSprint({ issueId, sprintId: targetSprintId });
      }

      toast({ title: targetSprintId ? "Issue assigned to sprint" : "Issue moved to backlog" });
      router.refresh();
    } catch (error) {
      toast({ title: "Failed to move issue", variant: "destructive" });
    }
  };

  const renderIssue = (issue: any, index: number) => (
    <Draggable key={issue.id} draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
            snapshot.isDragging ? 'shadow-lg bg-background' : ''
          }`}
          onClick={() => {
            setSelectedIssue(issue);
            setShowAssignDialog(true);
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">{issue.key}</span>
              <Badge variant="outline" className="text-xs">
                {issue.type}
              </Badge>
              <Badge
                variant={
                  issue.priority === 'HIGH' || issue.priority === 'CRITICAL'
                    ? 'destructive'
                    : 'secondary'
                }
                className="text-xs"
              >
                {issue.priority}
              </Badge>
            </div>
            <h4 className="font-medium">{issue.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{issue.status.name}</Badge>
            {issue.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={issue.assignee.avatarUrl} />
                <AvatarFallback>{issue.assignee.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Sprints */}
          {sprints.map((sprint: any) => {
            const sprintIssues = issues.filter((issue: any) =>
              issue.sprints?.some((s: any) => s.sprintId === sprint.id)
            );

            return (
              <Card key={sprint.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{sprint.name}</CardTitle>
                      {sprint.goal && (
                        <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
                      )}
                    </div>
                    <Badge>{sprint.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={sprint.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[100px] ${
                          snapshot.isDraggingOver ? 'bg-muted/30 rounded-lg p-2' : ''
                        }`}
                      >
                        {sprintIssues.map((issue: any, index: number) => renderIssue(issue, index))}
                        {provided.placeholder}
                        {sprintIssues.length === 0 && (
                          <p className="text-center py-8 text-muted-foreground text-sm">
                            Drag issues here to add to sprint
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}

          {/* Backlog Issues */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Backlog ({issues.filter((i: any) => !i.sprints || i.sprints.length === 0).length} issues)</CardTitle>
                <CreateSprintDialog projectId={projectId} />
              </div>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 ${
                      snapshot.isDraggingOver ? 'bg-muted/30 rounded-lg p-2' : ''
                    }`}
                  >
                    {issues
                      .filter((issue: any) => !issue.sprints || issue.sprints.length === 0)
                      .map((issue: any, index: number) => renderIssue(issue, index))}
                    {provided.placeholder}
                    {issues.filter((i: any) => !i.sprints || i.sprints.length === 0).length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No issues in backlog
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>

      {selectedIssue && (
        <AssignToSprintDialog
          issue={selectedIssue}
          sprints={sprints}
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
        />
      )}
    </>
  );
}
