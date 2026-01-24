// Permission constants
export const PERMISSIONS = {
  // Project permissions
  MANAGE_PROJECTS: 'MANAGE_PROJECTS',
  CREATE_PROJECTS: 'CREATE_PROJECTS',
  DELETE_PROJECTS: 'DELETE_PROJECTS',
  
  // Issue permissions
  CREATE_ISSUES: 'CREATE_ISSUES',
  EDIT_ALL_ISSUES: 'EDIT_ALL_ISSUES',
  DELETE_ISSUES: 'DELETE_ISSUES',
  ASSIGN_ISSUES: 'ASSIGN_ISSUES',
  
  // Member permissions
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  INVITE_MEMBERS: 'INVITE_MEMBERS',
  
  // Role permissions
  MANAGE_ROLES: 'MANAGE_ROLES',
  
  // Settings
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
} as const;

export const defaultPermissions = [
  { action: "CREATE_PROJECTS", label: "Create Projects" },
  { action: "MANAGE_PROJECTS", label: "Manage Projects" },
  { action: "DELETE_PROJECTS", label: "Delete Projects" },
  { action: "CREATE_ISSUES", label: "Create Issues" },
  { action: "EDIT_ALL_ISSUES", label: "Edit All Issues" },
  { action: "EDIT_OWN_ISSUES", label: "Edit Own Issues" },
  { action: "DELETE_ISSUES", label: "Delete Issues" },
  { action: "INVITE_MEMBERS", label: "Invite Members" },
  { action: "MANAGE_MEMBERS", label: "Manage Members" },
  { action: "MANAGE_ROLES", label: "Manage Roles" },
  { action: "MANAGE_SETTINGS", label: "Manage Settings" },
];
