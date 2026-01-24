'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function IssueFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");

  const handleChange = (key: string, value: string) => {
    const newFilters = {
      search,
      type,
      priority,
      status,
      assignee,
      [key]: value,
    };

    if (key === 'search') setSearch(value);
    if (key === 'type') setType(value);
    if (key === 'priority') setPriority(value);
    if (key === 'status') setStatus(value);
    if (key === 'assignee') setAssignee(value);

    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-8"
        />
      </div>

      <Select value={type} onValueChange={(v) => handleChange('type', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="EPIC">Epic</SelectItem>
          <SelectItem value="STORY">Story</SelectItem>
          <SelectItem value="TASK">Task</SelectItem>
          <SelectItem value="BUG">Bug</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={(v) => handleChange('priority', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="NONE">None</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => handleChange('status', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
