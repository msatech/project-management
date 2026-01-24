'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateStatus } from "@/lib/actions/status.actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface RenameColumnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statusId: string;
    currentName: string;
    projectId: string;
}

export function RenameColumnDialog({
    open,
    onOpenChange,
    statusId,
    currentName,
    projectId,
}: RenameColumnDialogProps) {
    const [name, setName] = useState(currentName);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                await updateStatus({
                    statusId,
                    name,
                    projectId,
                });
                toast({ title: "Column renamed successfully" });
                onOpenChange(false);
                router.refresh();
            } catch (error) {
                toast({
                    title: "Failed to rename column",
                    description: (error as Error).message,
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Column</DialogTitle>
                    <DialogDescription>
                        Enter a new name for this column.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
