'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { createSubtask } from "@/lib/actions/subtask.actions";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SubtasksSection({ issue, users, onUpdate }: { issue: any; users: any[]; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'TASK' | 'BUG'>('TASK');
  const [priority, setPriority] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        await createSubtask({
          parentId: issue.id,
          title,
          description,
          type,
          priority,
          projectId: issue.projectId,
          projectKey: issue.key.split('-')[0],
        });
        setOpen(false);
        setTitle("");
        setDescription("");
        onUpdate();
        toast({ title: "Subtask created" });
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const completedCount = issue.children?.filter((s: any) => s.status.category === 'DONE').length || 0;
  const totalCount = issue.children?.length || 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Subtasks</h2>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Subtask
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subtask</DialogTitle>
              <DialogDescription>
                Add a subtask to break down this issue into smaller pieces.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subtask title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the subtask"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="BUG">Bug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Creating..." : "Create Subtask"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {totalCount > 0 && (
        <div className="mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {issue.children?.map((subtask: any) => (
          <div key={subtask.id} className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50 cursor-pointer">
            <input
              type="checkbox"
              checked={subtask.status.category === 'DONE'}
              readOnly
              className="h-4 w-4"
            />
            <span className="text-xs text-muted-foreground">{subtask.key}</span>
            <span className="flex-1 text-sm">{subtask.title}</span>
            {subtask.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={subtask.assignee.avatarUrl} />
                <AvatarFallback>{subtask.assignee.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {totalCount === 0 && (
          <p className="text-sm text-muted-foreground">No subtasks yet</p>
        )}
      </div>
    </div>
  );
}
