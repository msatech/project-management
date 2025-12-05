'use client'

import { getIssueDetails, updateIssueAssignee, addComment } from '@/lib/actions/issue.actions';
import { useEffect, useState, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getIssueTypeIcon, getPriorityIcon } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Comment, Issue, Status, User } from '@prisma/client';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

type IssueWithDetails = Issue & { 
    status: Status, 
    reporter: User,
    assignee: User | null,
    comments: (Comment & { author: User })[] 
};

const commentSchema = z.object({
    body: z.string().min(1, "Comment can't be empty"),
});

export function IssueDetailSheet({ issueId, users }: { issueId: string; users: any[] }) {
    const [issue, setIssue] = useState<IssueWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, startSummaryTransition] = useTransition();
    const [isCommenting, startCommentingTransition] = useTransition();
    const { toast } = useToast();

    const fetchIssueDetails = async () => {
        const data = await getIssueDetails(issueId);
        if (data) {
            setIssue(data as IssueWithDetails);
        }
        setLoading(false);
    }
    
    useEffect(() => {
        fetchIssueDetails();
    }, [issueId]);


    const form = useForm({
        resolver: zodResolver(commentSchema),
        defaultValues: { body: '' },
    });

    const handleAddComment = async (values: z.infer<typeof commentSchema>) => {
        if (!issue) return;
        startCommentingTransition(async () => {
            try {
                await addComment({
                    issueId: issue.id,
                    body: values.body,
                    projectId: issue.projectId,
                });
                toast({ title: 'Comment added' });
                form.reset();
                fetchIssueDetails(); // Refetch to show new comment
            } catch (error) {
                toast({
                    title: 'Error adding comment',
                    description: 'Could not save comment. Please try again.',
                    variant: 'destructive',
                });
            }
        });
    }

    const handleAssigneeChange = async (assigneeId: string) => {
        if (!issue) return;
        const newAssigneeId = assigneeId === 'unassigned' ? null : assigneeId;
        
        // Optimistic update
        const originalAssignee = issue.assignee;
        const newAssignee = users.find(u => u.id === newAssigneeId) || null;
        setIssue(prev => prev ? { ...prev, assignee: newAssignee, assigneeId: newAssigneeId } : null);

        try {
            await updateIssueAssignee({
                issueId: issue.id,
                assigneeId: newAssigneeId,
                projectId: issue.projectId,
            });
            
            toast({
                title: 'Assignee changed',
                description: newAssignee ? `Issue assigned to ${newAssignee.name}` : 'Issue unassigned',
            })
        } catch (error) {
            // Revert on error
            setIssue(prev => prev ? { ...prev, assignee: originalAssignee, assigneeId: originalAssignee?.id || null } : null);
            toast({
                title: 'Error updating assignee',
                description: 'Could not save changes. Please try again.',
                variant: 'destructive',
            });
        }
    };

    if (loading || !issue) {
        return <IssueDetailSkeleton />;
    }

    const IssueIcon = getIssueTypeIcon(issue.type);
    const PriorityIcon = getPriorityIcon(issue.priority);

    return (
        <div className="grid grid-cols-3 gap-6 h-full overflow-hidden">
            <div className="col-span-2 flex flex-col gap-4 overflow-y-auto pr-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IssueIcon className="h-4 w-4" />
                    <span>{issue.key}</span>
                </div>
                <h1 className="text-2xl font-bold">{issue.title}</h1>
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h2 className="text-lg font-semibold mt-6 mb-2">Description</h2>
                    <p>{issue.description}</p>
                </div>
                
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">Comments</h2>
                    <div className="space-y-4">
                        {issue.comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.author?.avatarUrl} alt={comment.author?.name} />
                                <AvatarFallback>{comment.author?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{comment.author?.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm">{comment.body}</p>
                            </div>
                            </div>
                        ))}
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddComment)} className="mt-6 flex flex-col gap-2">
                            <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea placeholder="Add a comment..." {...field} disabled={isCommenting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isCommenting}>
                                    {isCommenting ? 'Adding...' : 'Comment'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
            <div className="col-span-1 bg-muted/50 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
                <h2 className="font-semibold">Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Status</div>
                    <div><Badge variant="secondary">{issue.status.name}</Badge></div>
                    
                    <div className="text-muted-foreground">Assignee</div>
                    <div>
                        <Select onValueChange={handleAssigneeChange} defaultValue={issue.assignee?.id ?? 'unassigned'}>
                            <SelectTrigger className="h-auto p-1 border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={issue.assignee?.avatarUrl} alt={issue.assignee?.name} />
                                            <AvatarFallback>{issue.assignee ? issue.assignee.name.charAt(0) : 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span>{issue.assignee ? issue.assignee.name : 'Unassigned'}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        <span>Unassigned</span>
                                    </div>
                                </SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-muted-foreground">Reporter</div>
                    <div>
                        <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6">
                                <AvatarImage src={issue.reporter.avatarUrl} alt={issue.reporter.name} />
                                <AvatarFallback>{issue.reporter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{issue.reporter.name}</span>
                        </div>
                    </div>

                    <div className="text-muted-foreground">Priority</div>
                    <div className="flex items-center gap-2"><PriorityIcon className="h-4 w-4" /> {issue.priority}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-auto">
                    <div>Created: {format(new Date(issue.createdAt), "MMM d, yyyy")}</div>
                    <div>Updated: {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</div>
                </div>
            </div>
        </div>
    );
}

function IssueDetailSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-6 h-full">
            <div className="col-span-2 flex flex-col gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="col-span-1 bg-muted/50 rounded-lg p-4 flex flex-col gap-4">
                <Skeleton className="h-6 w-1/3" />
                <div className="space-y-4">
                    <div className="flex justify-between"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
                    <div className="flex justify-between"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
                    <div className="flex justify-between"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-5 w-1/2" /></div>
                </div>
            </div>
        </div>
    );
}
