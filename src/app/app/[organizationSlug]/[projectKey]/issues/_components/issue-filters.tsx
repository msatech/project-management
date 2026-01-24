
'use client';

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

interface IssueFiltersProps {
  statuses: any[];
  members: any[];
  sprints?: any[];
}

export function IssueFilters({ statuses, members, sprints = [] }: IssueFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace("?");
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Top Header mimicking the wireframe */}
      <div className="flex items-center justify-between pb-2 border-b mb-2">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">Search</h1>
            <Button variant="outline" size="sm" className="h-7 text-xs">Save as</Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                <Search className="h-3 w-3" /> Share
            </Button>
             <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                <Search className="h-3 w-3" /> Export
            </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input - Jira style usually has it embedded or leading. 
            The wireframe showed: Project: All, Type: All... [Contains text] ... 
        */}
        
        {/* Project Filter (Visual only for now as we are in a project) */}
         <Button variant="ghost" size="sm" className="h-8 border-dashed border bg-background hover:bg-accent hover:text-accent-foreground">
            Project: All
         </Button>

        <Select 
            key={`type-${searchParams.get("type") || "ALL"}`}
            value={searchParams.get("type") || "ALL"} 
            onValueChange={(val) => handleFilterChange("type", val)}
        >
          <SelectTrigger className="h-8 w-[130px] border-none bg-transparent hover:bg-accent/50 focus:ring-0">
            <span className="text-muted-foreground mr-1">Type:</span> 
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="STORY">Story</SelectItem>
            <SelectItem value="TASK">Task</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="EPIC">Epic</SelectItem>
          </SelectContent>
        </Select>

        <Select 
             key={`status-${searchParams.get("status") || "ALL"}`}
             value={searchParams.get("status") || "ALL"} 
             onValueChange={(val) => handleFilterChange("status", val)}
        >
          <SelectTrigger className="h-8 w-[140px] border-none bg-transparent hover:bg-accent/50 focus:ring-0">
             <span className="text-muted-foreground mr-1">Status:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
             key={`assignee-${searchParams.get("assignee") || "ALL"}`}
             value={searchParams.get("assignee") || "ALL"} 
             onValueChange={(val) => handleFilterChange("assignee", val)}
        >
          <SelectTrigger className="h-8 w-[160px] border-none bg-transparent hover:bg-accent/50 focus:ring-0">
             <span className="text-muted-foreground mr-1">Assignee:</span>
             <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
             <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
             key={`sprint-${searchParams.get("sprint") || "ALL"}`}
             value={searchParams.get("sprint") || "ALL"} 
             onValueChange={(val) => handleFilterChange("sprint", val)}
        >
          <SelectTrigger className="h-8 w-[150px] border-none bg-transparent hover:bg-accent/50 focus:ring-0">
             <span className="text-muted-foreground mr-1">Sprint:</span>
             <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="none">No Sprint</SelectItem>
            {sprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex items-center">
            <Input
                placeholder="Contains text"
                className="h-8 w-[180px] bg-accent/20 border-transparent hover:border-input focus:border-primary transition-colors"
                defaultValue={searchParams.get("search")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
            />
             {/* <Search className="absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground" /> */}
        </div>
        
        <Button variant="link" className="text-xs h-8 text-primary">Advanced</Button>

        {(searchParams.toString().length > 0) && (
            <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 lg:px-3 text-xs hover:bg-destructive/10 hover:text-destructive">
               Clear filters
            </Button>
        )}
      </div>
    </div>
  );
}
