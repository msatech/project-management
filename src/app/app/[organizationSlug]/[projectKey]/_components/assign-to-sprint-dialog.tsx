"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignIssueToSprint, removeIssueFromSprint } from "@/lib/actions/sprint.actions";
import { useToast } from "@/hooks/use-toast";

interface AssignToSprintDialogProps {
  issue: any;
  sprints: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignToSprintDialog({
  issue,
  sprints,
  open,
  onOpenChange,
}: AssignToSprintDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const currentSprint = issue.sprints?.[0];
  const availableSprints = sprints.filter(s => s.status !== 'COMPLETED');

  const handleAssign = async () => {
    if (!selectedSprintId) return;

    setLoading(true);
    try {
      // Remove from current sprint if exists
      if (currentSprint) {
        await removeIssueFromSprint({
          issueId: issue.id,
          sprintId: currentSprint.sprintId,
        });
      }

      // Assign to new sprint
      await assignIssueToSprint({
        issueId: issue.id,
        sprintId: selectedSprintId,
      });

      toast({
        title: "Issue assigned to sprint",
        description: "The issue has been added to the selected sprint.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign issue to sprint.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentSprint) return;

    setLoading(true);
    try {
      await removeIssueFromSprint({
        issueId: issue.id,
        sprintId: currentSprint.sprintId,
      });

      toast({
        title: "Issue removed from sprint",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove issue from sprint.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign to Sprint</DialogTitle>
          <DialogDescription>
            {issue.key} - {issue.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {currentSprint && (
            <div className="text-sm text-muted-foreground">
              Currently in: <span className="font-medium">{currentSprint.sprint?.name}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="sprint">Select Sprint</Label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger id="sprint">
                <SelectValue placeholder="Choose a sprint" />
              </SelectTrigger>
              <SelectContent>
                {availableSprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </SelectItem>
                ))}
                {availableSprints.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">
                    No active or future sprints available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {currentSprint && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={loading}
            >
              Remove from Sprint
            </Button>
          )}
          <Button onClick={handleAssign} disabled={loading || !selectedSprintId}>
            {loading ? "Assigning..." : "Assign to Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
