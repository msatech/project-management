'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createRole } from "@/lib/actions/role.actions";
import { PERMISSIONS, defaultPermissions } from "@/lib/permissions-constants";
import { Plus } from "lucide-react";

const PERMISSION_GROUPS = {
  "Projects": [
    { id: PERMISSIONS.CREATE_PROJECTS, label: "Create Projects" },
    { id: PERMISSIONS.MANAGE_PROJECTS, label: "Manage Projects" },
    { id: PERMISSIONS.DELETE_PROJECTS, label: "Delete Projects" },
  ],
  "Issues": [
    { id: PERMISSIONS.CREATE_ISSUES, label: "Create Issues" },
    { id: PERMISSIONS.EDIT_ALL_ISSUES, label: "Edit All Issues" },
    { id: PERMISSIONS.DELETE_ISSUES, label: "Delete Issues" },
    { id: PERMISSIONS.ASSIGN_ISSUES, label: "Assign Issues" },
  ],
  "Members": [
    { id: PERMISSIONS.INVITE_MEMBERS, label: "Invite Members" },
    { id: PERMISSIONS.MANAGE_MEMBERS, label: "Manage Members" },
  ],
  "Administration": [
    { id: PERMISSIONS.MANAGE_ROLES, label: "Manage Roles" },
    { id: PERMISSIONS.MANAGE_SETTINGS, label: "Manage Settings" },
  ],
};

export function CreateRoleDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        await createRole(slug, {
          name,
          description,
          permissions: selectedPermissions,
        });
        toast({
          title: "Role created",
          description: `${name} role has been created successfully`,
        });
        setOpen(false);
        setName("");
        setDescription("");
        setSelectedPermissions([]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create role",
          variant: "destructive",
        });
      }
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Define a new role with specific permissions for your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              placeholder="e.g., Developer, Designer, Intern"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this role is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="grid gap-4">
            <Label>Permissions</Label>
            {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
              <div key={group} className="space-y-2">
                <h4 className="text-sm font-medium">{group}</h4>
                <div className="space-y-2 pl-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
