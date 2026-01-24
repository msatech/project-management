"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, PlayCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditSprintDialog } from "./edit-sprint-dialog";
import { deleteSprint, updateSprint } from "@/lib/actions/sprint.actions";
import { useToast } from "@/hooks/use-toast";
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

export function SprintActions({ sprint }: { sprint: any }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleStatusChange = async (status: string) => {
    try {
      await updateSprint({
        sprintId: sprint.id,
        status,
      });
      toast({ title: `Sprint ${status === 'ACTIVE' ? 'started' : 'completed'}` });
      router.refresh();
    } catch (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSprint(sprint.id);
      toast({ title: "Sprint deleted" });
      router.refresh();
    } catch (error) {
      toast({ title: "Error deleting sprint", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Sprint
          </DropdownMenuItem>
          {sprint.status === 'FUTURE' && (
            <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Sprint
            </DropdownMenuItem>
          )}
          {sprint.status === 'ACTIVE' && (
            <DropdownMenuItem onClick={() => handleStatusChange('COMPLETED')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Sprint
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Sprint
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditSprintDialog 
        sprint={sprint} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />

       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sprint
              and remove all issue associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
