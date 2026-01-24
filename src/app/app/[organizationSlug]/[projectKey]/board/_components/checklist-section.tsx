'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/lib/actions/subtask.actions";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export function ChecklistSection({ issueId, checklist, onUpdate }: { issueId: string; checklist: any[]; onUpdate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;

    startTransition(async () => {
      try {
        await addChecklistItem(issueId, newItemTitle);
        setNewItemTitle("");
        setIsAdding(false);
        onUpdate();
        toast({ title: "Checklist item added" });
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const handleToggle = (itemId: string) => {
    startTransition(async () => {
      try {
        await toggleChecklistItem(itemId);
        onUpdate();
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      try {
        await deleteChecklistItem(itemId);
        onUpdate();
        toast({ title: "Checklist item deleted" });
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const completedCount = checklist.filter(item => item.isChecked).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Checklist</h2>
          {checklist.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{checklist.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {checklist.length > 0 && (
        <div className="mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {checklist.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded group">
            <Checkbox
              checked={item.isChecked}
              onCheckedChange={() => handleToggle(item.id)}
              disabled={isPending}
            />
            <span className={`flex-1 text-sm ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
              {item.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 p-2">
            <Input
              placeholder="Add an item..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewItemTitle("");
                }
              }}
              autoFocus
              disabled={isPending}
            />
            <Button size="sm" onClick={handleAdd} disabled={isPending || !newItemTitle.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}

        {!isAdding && checklist.length === 0 && (
          <p className="text-sm text-muted-foreground">No checklist items</p>
        )}
      </div>
    </div>
  );
}
