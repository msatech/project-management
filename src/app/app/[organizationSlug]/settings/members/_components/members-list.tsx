'use client';

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRoleToMember } from "@/lib/actions/role.actions";
import { useToast } from "@/hooks/use-toast";
import { Crown, Shield } from "lucide-react";

export function MembersList({
  members,
  roles,
  organizationSlug,
  currentUserId,
  ownerId,
}: any) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRoleChange = (memberId: string, roleId: string) => {
    startTransition(async () => {
      try {
        await assignRoleToMember(memberId, roleId, organizationSlug);
        toast({
          title: "Role updated",
          description: "Member role has been updated successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update role",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {members.map((member: any) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={member.user.avatarUrl} />
              <AvatarFallback>
                {member.user.name?.charAt(0) || member.user.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.user.name || member.user.email}</p>
                {member.userId === ownerId && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {member.userId === ownerId ? (
              <Badge variant="default">
                <Crown className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                {member.role && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {member.role.name}
                  </Badge>
                )}
                <Select
                  value={member.roleId || ""}
                  onValueChange={(roleId) => handleRoleChange(member.id, roleId)}
                  disabled={isPending || member.userId === currentUserId}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assign role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
