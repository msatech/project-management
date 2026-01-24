'use client'

import { getIssueDetails, updateIssueAssignee, addComment, updateIssueDescription } from '@/lib/actions/issue.actions';
import { assignIssueToSprint, removeIssueFromSprint } from '@/lib/actions/sprint.actions';
import { useEffect, useState, useTransition } from 'react';
import { RichTextEditor } from '@/components/rich-text-editor';
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
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { updateIssueDetails } from '@/lib/actions/issue.actions';
import { useRouter } from 'next/navigation';

import { ChecklistSection } from './checklist-section';
import { SubtasksSection } from './subtasks-section';
import { AttachmentsSection } from './attachments-section';

type IssueWithDetails = Issue & { 
    status: Status, 
    reporter: User,
    assignee: User | null,
    comments: (Comment & { author: User })[]
    parent?: any;
    children?: any[];
    checklist?: any[];
    attachments?: any[];
    startDate?: Date | null;
    dueDate?: Date | null;
    estimatedHours?: number | null;
};

const commentSchema = z.object({
    body: z.string().min(1, "Comment can't be empty"),
});

export function IssueDetailSheet({ issueId, users, statuses, sprints = [] }: { issueId: string; users: any[]; statuses?: any[]; sprints?: any[] }) {
    const [issue, setIssue] = useState<IssueWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, startSummaryTransition] = useTransition();
    const [isCommenting, startCommentingTransition] = useTransition();
    const { toast } = useToast();
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState('');
    const router = useRouter();

    const fetchIssueDetails = async () => {
        const data = await getIssueDetails(issueId);
        if (data) {
            setIssue(data as IssueWithDetails);
            setDescription(data.description || '');
        }
        setLoading(false);
    }
    
    useEffect(() => {
        fetchIssueDetails();
    }, [issueId]);

    const handleUpdateDetails = async (updates: any) => {
        if (!issue) return;
        
        // Optimistic update
        setIssue(prev => prev ? { ...prev, ...updates } : null);

        try {
            await updateIssueDetails({
                issueId: issue.id,
                projectId: issue.projectId,
                ...updates
            });
            toast({ title: 'Issue updated' });
            router.refresh();
        } catch (error) {
            // Revert would be complex here without deep cloning, simpler to just refetch on error or rely on toast
             toast({
                title: 'Error updating issue',
                description: 'Could not save changes.',
                variant: 'destructive',
            });
            fetchIssueDetails();
        }
    }

    const handleSaveDescription = async () => {
        if (!issue) return;
        try {
            await updateIssueDescription({
                issueId: issue.id,
                description: description,
                projectId: issue.projectId,
            });
            setIssue(prev => prev ? { ...prev, description } : null);
            setIsEditingDescription(false);
            toast({ title: 'Description updated' });
        } catch (error) {
            toast({
                title: 'Error updating description',
                description: 'Could not save changes.',
                variant: 'destructive',
            });
        }
    }


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
                
                <div className="flex items-center justify-between mt-6 mb-2">
                     <h2 className="text-lg font-semibold">Description</h2>
                     <Button variant="ghost" size="sm" onClick={() => {
                        if (isEditingDescription) handleSaveDescription();
                        else setIsEditingDescription(true);
                     }}>
                        {isEditingDescription ? 'Save' : 'Edit'}
                     </Button>
                </div>
                
                <div className="min-h-[100px]">
                    {isEditingDescription ? (
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            users={users}
                        />
                    ) : (
                         <div className="prose prose-sm dark:prose-invert max-w-none">
                            {issue.description ? (
                                <RichTextEditor value={issue.description} editable={false} users={users} />
                            ) : (
                                <p className="text-muted-foreground italic">No description provided.</p>
                            )}
                         </div>
                    )}
                </div>
                
                {/* Parent Issue Link */}
                {issue.parent && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">Parent Issue</h2>
                        <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
                            <span>{issue.parent.key}</span>
                            <span>-</span>
                            <span>{issue.parent.title}</span>
                        </div>
                    </div>
                )}

                
                {/* Subtasks Section */}
                {issue.type !== 'TASK' && issue.type !== 'BUG' && (
                    <SubtasksSection issue={issue} users={users} onUpdate={fetchIssueDetails} />
                )}

                {/* Checklist Section */}
                <ChecklistSection issueId={issue.id} checklist={issue.checklist || []} onUpdate={fetchIssueDetails} />
                
                {/* Attachments Section */}
                <AttachmentsSection issueId={issue.id} attachments={issue.attachments || []} onUpdate={fetchIssueDetails} />
                
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
                                <div className="text-sm mt-1">
                                    <RichTextEditor value={comment.body} editable={false} />
                                </div>
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
                                            <RichTextEditor 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                                placeholder="Add a comment... (@ to mention)"
                                                users={users}
                                            />
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
                <div className="flex flex-col gap-4 text-sm">
                    {/* Status */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Status</div>
                        <div>
                             {statuses ? (
                                <Select 
                                    value={issue.statusId} 
                                    onValueChange={(val) => {
                                        const status = statuses.find(s => s.id === val);
                                        if (status) {
                                            handleUpdateDetails({ statusId: val, status: status });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8 border-0 bg-transparent p-0 hover:bg-muted/50 w-full justify-start font-medium">
                                        <Badge variant="secondary" className="pointer-events-none">
                                            {statuses.find(s => s.id === issue.statusId)?.name || issue.status.name}
                                        </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(status => (
                                            <SelectItem key={status.id} value={status.id}>
                                                {status.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                             ) : (
                                <Badge variant="secondary">{issue.status.name}</Badge>
                             )}
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Start Date</div>
                        <Input
                            type="date"
                            className="w-full justify-start text-left font-normal h-8"
                            value={issue.startDate ? format(new Date(issue.startDate), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleUpdateDetails({ startDate: e.target.value ? new Date(e.target.value) : null })}
                        />
                    </div>

                    {/* Sprint */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Sprint</div>
                        <div>
                            <Select 
                                value={(issue as any).sprints?.[0]?.sprintId || 'none'} 
                                onValueChange={async (val) => {
                                    const currentSprint = (issue as any).sprints?.[0];
                                    
                                    try {
                                        // Remove from current sprint if exists
                                        if (currentSprint) {
                                            await removeIssueFromSprint({ issueId: issue.id, sprintId: currentSprint.sprintId });
                                        }
                                        
                                        // Assign to new sprint if not "none"
                                        if (val !== 'none') {
                                            await assignIssueToSprint({ issueId: issue.id, sprintId: val });
                                        }
                                        
                                        toast({ title: "Sprint updated" });
                                        router.refresh();
                                        fetchIssueDetails();
                                    } catch (error) {
                                        toast({ title: "Failed to update sprint", variant: "destructive" });
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8 border-0 bg-transparent p-0 hover:bg-muted/50 w-full justify-start">
                                    <SelectValue placeholder="No Sprint" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Sprint</SelectItem>
                                    {(sprints || []).map((sprint: any) => (
                                        <SelectItem key={sprint.id} value={sprint.id}>
                                            {sprint.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Due Date</div>
                        <Input
                            type="date"
                            className="w-full justify-start text-left font-normal h-8"
                            value={issue.dueDate ? format(new Date(issue.dueDate), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleUpdateDetails({ dueDate: e.target.value ? new Date(e.target.value) : null })}
                        />
                    </div>

                    {/* Estimated Hours */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Estimated Hours</div>
                        <div className="flex items-center gap-1">
                            <Input 
                                type="number" 
                                className="h-8 w-20 bg-transparent border-transparent hover:border-input focus:border-input text-right"
                                value={issue.estimatedHours ?? ''}
                                placeholder="0"
                                onChange={(e) => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    setIssue(prev => prev ? { ...prev, estimatedHours: val } : null); // Local update for smooth typing
                                }}
                                onBlur={(e) => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    handleUpdateDetails({ estimatedHours: val });
                                }}
                            />
                            <span className="text-muted-foreground text-xs">hrs</span>
                        </div>
                    </div>
                    
                    {/* Assignee */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Assignee</div>
                        <div>
                            <Select onValueChange={handleAssigneeChange} defaultValue={issue.assignee?.id ?? 'unassigned'}>
                                <SelectTrigger className="h-auto p-1 border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="Unassigned">
                                       <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={issue.assignee?.avatarUrl || undefined} alt={issue.assignee?.name || ''} />
                                                <AvatarFallback>{issue.assignee?.name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <span>{issue.assignee?.name || 'Unassigned'}</span>
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
                                                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name || ''} />
                                                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Reporter */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Reporter</div>
                        <div>
                            <div className="flex items-center gap-2">
                                 <Avatar className="h-6 w-6">
                                    <AvatarImage src={issue.reporter.avatarUrl || undefined} alt={issue.reporter.name || ''} />
                                    <AvatarFallback>{issue.reporter.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span>{issue.reporter.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Priority</div>
                        <div className="flex items-center gap-2"><PriorityIcon className="h-4 w-4" /> {issue.priority}</div>
                    </div>
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
