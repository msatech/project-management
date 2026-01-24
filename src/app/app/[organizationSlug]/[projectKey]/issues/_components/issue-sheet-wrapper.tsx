"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { IssueDetailSheet } from "../../board/_components/issue-detail-sheet";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function IssueSheetWrapper({ 
  users, 
  statuses,
  sprints = []
}: { 
  users: any[]; 
  statuses: any[];
  sprints?: any[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const issueId = searchParams.get("issue");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const params = new URLSearchParams(searchParams);
      params.delete("issue");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  if (!issueId) return null;

  return (
    <Sheet open={!!issueId} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-2xl md:max-w-3xl overflow-y-auto w-full" side="right">
        <SheetTitle className="sr-only">Issue Details</SheetTitle>
        <IssueDetailSheet issueId={issueId} users={users} statuses={statuses} sprints={sprints} />
      </SheetContent>
    </Sheet>
  );
}
