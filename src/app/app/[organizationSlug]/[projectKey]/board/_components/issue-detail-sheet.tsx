'use client'

import { getIssueDetails, summarizeIssue, updateIssueAssignee } from '@/lib/actions/issue.actions';
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

type IssueWithDetails = Issue & { 
    status: Status, 
    comments: (Comment & { author: User })[] 
};

export function IssueDetailSheet({ issueId, users }: { issueId: string; users: any[] }) {
    const [issue, setIssue] = useState<IssueWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, startSummaryTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        getIssueDetails(issueId).then(data => {
            if (data) {
                const authorIds = data.comments.map(c => c.authorId);
                const authors = users.filter(u => authorIds.includes(u.id));
                const commentsWithAuthors = data.comments.map(comment => ({
                    ...comment,
                    author: users.find(u => u.id === comment.authorId)
                }));
                setIssue({ ...data, comments: commentsWithAuthors});
            }
            setLoading(false);
        });
    }, [issueId, users]);

    const handleSummarize = () => {
        if (!issue) return;
        startSummaryTransition(async () => {
            const result = await summarizeIssue(issue.id);
            if (result.summary) {
                setSummary(result.summary);
            }
        });
    };

    const handleAssigneeChange = async (assigneeId: string) => {
        if (!issue) return;
        const newAssigneeId = assigneeId === 'unassigned' ? null : assigneeId;
        try {
            await updateIssueAssignee({
                issueId: issue.id,
                assigneeId: newAssigneeId,
                projectId: issue.projectId,
            });
            setIssue({ ...issue, assigneeId: newAssigneeId });
            const assignee = users.find(u => u.id === newAssigneeId);
            toast({
                title: 'Assignee changed',
                description: assignee ? `Issue assigned to ${assignee.name}` : 'Issue unassigned',
            })
        } catch (error) {
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
    const assignee = users.find(u => u.id === issue.assigneeId);
    const reporter = users.find(u => u.id === issue.reporterId);

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

                {summary && (
                     <Alert>
                        <Bot className="h-4 w-4" />
                        <AlertTitle>AI Summary</AlertTitle>
                        <AlertDescription>{summary}</AlertDescription>
                    </Alert>
                )}
                
                <div className="mt-auto">
                    <h2 className="text-lg font-semibold mt-6 mb-2">Comments</h2>
                    <div className="space-y-4">
                        {issue.comments.map((comment: any) => {
                             const author = comment.author;
                             return (
                                <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={author?.avatarUrl} alt={author?.name} />
                                    <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{author?.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm">{comment.body}</p>
                                </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
            </div>
            <div className="col-span-1 bg-muted/50 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
                <h2 className="font-semibold">Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-muted-foreground">Status</div>
                    <div><Badge variant="secondary">{issue.status.name}</Badge></div>
                    
                    <div className="text-muted-foreground">Assignee</div>
                    <div>
                        <Select onValueChange={handleAssigneeChange} defaultValue={assignee?.id ?? 'unassigned'}>
                            <SelectTrigger className="h-auto p-1 border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignee?.avatarUrl} alt={assignee?.name} />
                                            <AvatarFallback>{assignee ? assignee.name.charAt(0) : 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span>{assignee ? assignee.name : 'Unassigned'}</span>
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
                    <div>{reporter ? (
                        <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6">
                                <AvatarImage src={reporter.avatarUrl} alt={reporter.name} />
                                <AvatarFallback>{reporter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{reporter.name}</span>
                        </div>
                    ) : 'Unknown'}</div>

                    <div className="text-muted-foreground">Priority</div>
                    <div className="flex items-center gap-2"><PriorityIcon className="h-4 w-4" /> {issue.priority}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-auto">
                    <div>Created: {format(new Date(issue.createdAt), "MMM d, yyyy")}</div>
                    <div>Updated: {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</div>
                </div>

                <Button onClick={handleSummarize} disabled={isSummaryLoading}>
                    {isSummaryLoading ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Summarize with AI</>}
                </Button>
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
