import { Bug, CheckCircle2, ChevronUp, Circle, CircleDot, Minus, X, Book, ArrowDown, ArrowRight, ArrowUp, ChevronsUp, ChevronsDown, MoreHorizontal } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export const Icons = {
    logo: (props: LucideProps) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          {...props}
        >
          <rect width="256" height="256" fill="none" />
          <path
            d="M139.4,37.8,225.5,185.3a16,16,0,0,1-14.1,24.2H44.6a16,16,0,0,1-14.1-24.2L116.6,37.8A16,16,0,0,1,139.4,37.8Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
    ),
    issue: {
        bug: Bug,
        task: CheckCircle2,
        story: Book,
        epic: ChevronsUp
    },
    priority: {
        critical: ChevronsUp,
        high: ArrowUp,
        medium: ArrowRight,
        low: ArrowDown,
        none: MoreHorizontal,
    },
    status: {
        todo: Circle,
        inProgress: CircleDot,
        done: CheckCircle2,
        canceled: X,
        backlog: Minus,
    },
};

export function getIssueTypeIcon(type: string) {
    switch (type) {
        case 'BUG': return Icons.issue.bug;
        case 'STORY': return Icons.issue.story;
        case 'EPIC': return Icons.issue.epic;
        case 'TASK':
        default:
            return Icons.issue.task;
    }
}

export function getPriorityIcon(priority: string) {
    switch (priority) {
        case 'CRITICAL': return Icons.priority.critical;
        case 'HIGH': return Icons.priority.high;
        case 'MEDIUM': return Icons.priority.medium;
        case 'LOW': return Icons.priority.low;
        case 'NONE':
        default:
            return Icons.priority.none;
    }
}

export function getStatusIcon(category: string) {
    switch(category) {
        case 'TODO': return Icons.status.todo;
        case 'IN_PROGRESS': return Icons.status.inProgress;
        case 'DONE': return Icons.status.done;
        default: return Icons.status.backlog;
    }
}