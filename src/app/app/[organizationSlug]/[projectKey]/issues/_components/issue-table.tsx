"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Bug, 
    Bookmark, 
    CheckSquare, 
    ChevronUp, 
    ChevronDown, 
    Minus,
    ArrowUpCircle 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateIssueAssignee, updateIssueDetails, updateIssueStatus } from "@/lib/actions/issue.actions";
import { assignIssueToSprint, removeIssueFromSprint } from "@/lib/actions/sprint.actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface IssueTableProps {
  issues: any[];
  projectKey: string;
  organizationSlug: string;
  statuses: any[];
  members: any[];
  sprints?: any[];
}

export function IssueTable({ issues, projectKey, organizationSlug, statuses, members, sprints = [] }: IssueTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (issues.length === 0) {
    return (
      <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
        No issues found matching your filters.
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
        case 'BUG': return <Bug className="h-4 w-4 text-red-500" />;
        case 'STORY': return <Bookmark className="h-4 w-4 text-green-600" fill="currentColor" />;
        case 'EPIC': return <div className="h-4 w-4 rounded-sm bg-purple-500" />; 
        default: return <CheckSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
      switch(priority) {
          case 'CRITICAL': return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
          case 'HIGH': return <ChevronUp className="h-4 w-4 text-red-500" />;
          case 'MEDIUM': return <Minus className="h-4 w-4 text-orange-500" />;
          case 'LOW': return <ChevronDown className="h-4 w-4 text-blue-500" />;
          default: return <Minus className="h-4 w-4 text-muted-foreground" />;
      }
  }

  const handleStatusChange = async (issueId: string, statusId: string, projectId: string) => {
      try {
          await updateIssueStatus({ issueId, statusId, projectId });
          toast({ title: "Status updated" });
          router.refresh();
      } catch (error) {
          toast({ title: "Failed to update status", variant: "destructive" });
      }
  }

  const handlePriorityChange = async (issueId: string, priority: any, projectId: string) => {
      try {
          await updateIssueDetails({ issueId, priority, projectId });
          toast({ title: "Priority updated" });
          router.refresh();
      } catch (error) {
           toast({ title: "Failed to update priority", variant: "destructive" });
      }
  }

  const handleAssigneeChange = async (issueId: string, assigneeId: string, projectId: string) => {
      try {
          await updateIssueAssignee({ issueId, assigneeId: assigneeId === 'unassigned' ? null : assigneeId, projectId });
          toast({ title: "Assignee updated" });
          router.refresh();
      } catch (error) {
           toast({ title: "Failed to update assignee", variant: "destructive" });
      }
  }

  const handleSprintChange = async (issueId: string, sprintId: string, projectId: string) => {
      try {
          const currentSprint = issues.find(i => i.id === issueId)?.sprints?.[0];
          
          // Remove from current sprint if exists
          if (currentSprint) {
              await removeIssueFromSprint({ issueId, sprintId: currentSprint.sprintId });
          }
          
          // Assign to new sprint if not "none"
          if (sprintId !== 'none') {
              await assignIssueToSprint({ issueId, sprintId });
          }
          
          toast({ title: "Sprint updated" });
          router.refresh();
      } catch (error) {
           toast({ title: "Failed to update sprint", variant: "destructive" });
      }
  }


  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[30px] pr-0">
                <Checkbox />
            </TableHead>
            <TableHead className="w-[40px]">T</TableHead>
            <TableHead className="w-[100px]">Key</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="w-[180px]">Assignee</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead className="w-[40px]">P</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[150px]">Sprint</TableHead>
            <TableHead className="text-right">Created</TableHead>
            <TableHead className="text-right">Updated</TableHead>
            <TableHead className="text-right">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id} className="h-10 hover:bg-muted/30">
              <TableCell className="pr-0 py-2">
                 <Checkbox />
              </TableCell>
              <TableCell className="py-2">
                {getTypeIcon(issue.type)}
              </TableCell>
              <TableCell className="font-medium py-2">
                <button 
                  onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('issue', issue.key);
                      const currentParams = new URLSearchParams(searchParams.toString());
                      currentParams.set('issue', issue.key);
                      router.push(`?${currentParams.toString()}`, { scroll: false });
                  }}
                  className="text-primary hover:underline text-xs bg-transparent border-none p-0 cursor-pointer"
                >
                  {issue.key}
                </button>
              </TableCell>
              <TableCell className="py-2">
                <button 
                    onClick={() => {
                        const currentParams = new URLSearchParams(searchParams.toString());
                        currentParams.set('issue', issue.key);
                        router.push(`?${currentParams.toString()}`, { scroll: false });
                    }}
                    className="hover:text-primary transition-colors text-sm text-left bg-transparent border-none p-0 cursor-pointer"
                >
                    {issue.title}
                </button>
              </TableCell>
              <TableCell className="py-2">
                 <Select 
                    key={issue.assigneeId || 'unassigned'}
                    defaultValue={issue.assigneeId || 'unassigned'} 
                    onValueChange={(val) => handleAssigneeChange(issue.id, val, issue.projectId)}
                 >
                    <SelectTrigger className="h-7 text-xs border-transparent hover:border-input focus:ring-0 px-2 bg-transparent">
                        <SelectValue placeholder="Unassigned">
                             {issue.assignee ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-4 w-4">
                                    <AvatarImage src={issue.assignee.image || ""} />
                                    <AvatarFallback className="text-[9px]">{issue.assignee.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[80px]">{issue.assignee.name}</span>
                                </div>
                                ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                                )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((m) => (
                            <SelectItem key={m.user.id} value={m.user.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={m.user.image || ""} />
                                        <AvatarFallback className="text-[9px]">{m.user.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{m.user.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
              </TableCell>
              <TableCell className="py-2">
                 {issue.reporter && (
                  <div className="flex items-center gap-2 px-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={issue.reporter.image || ""} />
                      <AvatarFallback className="text-[9px]">{issue.reporter.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate max-w-[100px]">{issue.reporter.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="py-2">
                 <Select 
                    key={issue.priority}
                    defaultValue={issue.priority} 
                    onValueChange={(val) => handlePriorityChange(issue.id, val, issue.projectId)}
                 >
                     <SelectTrigger className="h-7 w-8 p-0 border-transparent hover:border-input focus:ring-0 flex justify-center bg-transparent">
                         {getPriorityIcon(issue.priority)}
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="CRITICAL"><div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-red-600"/> <span className="text-xs">Critical</span></div></SelectItem>
                        <SelectItem value="HIGH"><div className="flex items-center gap-2"><ChevronUp className="h-4 w-4 text-red-500"/> <span className="text-xs">High</span></div></SelectItem>
                        <SelectItem value="MEDIUM"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-orange-500"/> <span className="text-xs">Medium</span></div></SelectItem>
                        <SelectItem value="LOW"><div className="flex items-center gap-2"><ChevronDown className="h-4 w-4 text-blue-500"/> <span className="text-xs">Low</span></div></SelectItem>
                        <SelectItem value="NONE"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-muted-foreground"/> <span className="text-xs">None</span></div></SelectItem>
                     </SelectContent>
                 </Select>
              </TableCell>
              <TableCell className="py-2">
                 <Select 
                    key={issue.statusId}
                    defaultValue={issue.statusId} 
                    onValueChange={(val) => handleStatusChange(issue.id, val, issue.projectId)}
                 >
                    <SelectTrigger className="h-6 text-[10px] px-2 w-auto min-w-[80px] font-medium uppercase border-none bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-sm focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs uppercase">{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
              </TableCell>
              <TableCell className="py-2">
                 <Select 
                    key={issue.sprints?.[0]?.sprintId || 'none'}
                    defaultValue={issue.sprints?.[0]?.sprintId || 'none'} 
                    onValueChange={(val) => handleSprintChange(issue.id, val, issue.projectId)}
                 >
                    <SelectTrigger className="h-6 text-xs px-2 w-auto min-w-[100px] border-none bg-transparent hover:bg-accent focus:ring-0">
                        <SelectValue placeholder="No Sprint" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs">No Sprint</SelectItem>
                        {sprints.map((sprint) => (
                            <SelectItem key={sprint.id} value={sprint.id} className="text-xs">{sprint.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-xs py-2">
                {format(new Date(issue.createdAt), "dd/MMM/yy")}
              </TableCell>
               <TableCell className="text-right text-muted-foreground text-xs py-2">
                {format(new Date(issue.updatedAt), "dd/MMM/yy")}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-xs py-2">
                {issue.dueDate ? format(new Date(issue.dueDate), "dd/MMM/yy") : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
