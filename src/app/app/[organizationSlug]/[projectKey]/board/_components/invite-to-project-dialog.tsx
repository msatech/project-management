'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { inviteUserToProject } from '@/lib/actions/invitation.actions';

interface InviteToProjectDialogProps {
  projectId: string;
}

export function InviteToProjectDialog({ projectId }: InviteToProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInvite = () => {
    if (!email) return;

    startTransition(async () => {
      try {
        await inviteUserToProject(projectId, email);
        toast({
          title: 'Invitation sent',
          description: `Successfully invited ${email} to the project.`,
        });
        setOpen(false);
        setEmail('');
      } catch (error: any) {
        toast({
          title: 'Error inviting user',
          description: error.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex ml-auto gap-1">
          <Plus className="h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Project</DialogTitle>
          <DialogDescription>
            Enter the email address of the person you want to invite to this project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleInvite} disabled={isPending || !email}>
            {isPending ? 'Inviting...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
