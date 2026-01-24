// Re-export permission constants from separate file to avoid module-level import issues
export { PERMISSIONS, defaultPermissions } from './permissions-constants';

/**
 * Permission Validation Utilities
 * 
 * These functions provide server-side permission checking for all actions.
 * Always use these in server actions to ensure proper authorization.
 */

/**
 * Get all permissions for a user in an organization
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const { db } = await import('./db');
  
  const member = await db.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  // member.role can be null since roleId is optional in the schema
  if (!member || !member.role) {
    return [];
  }

  return member.role.permissions.map((p: any) => p.action);
}

/**
 * Check if user is the owner of an organization
 */
export async function isOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { db } = await import('./db');
  
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  });

  return org?.ownerId === userId;
}

/**
 * Check if user has a specific permission in an organization
 * Organization owners always have all permissions
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<boolean> {
  // Check if user is owner (owners have all permissions)
  const isOwner = await isOrganizationOwner(userId, organizationId);
  if (isOwner) {
    return true;
  }

  // Check if user has the specific permission through their role
  const permissions = await getUserPermissions(userId, organizationId);
  return permissions.includes(permission);
}

/**
 * Require a permission - throws error if user doesn't have it
 * Use this in server actions to enforce permissions
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permission: string,
  customMessage?: string
): Promise<void> {
  const hasAccess = await hasPermission(userId, organizationId, permission);

  if (!hasAccess) {
    const message =
      customMessage ||
      `You need the "${formatPermissionName(permission)}" permission to perform this action. Contact your organization administrator.`;
    throw new Error(message);
  }
}

/**
 * Get current user's permissions for an organization
 * Useful for checking permissions in server components
 */
export async function getCurrentUserPermissions(
  organizationId: string
): Promise<string[]> {
  const { getSession } = await import('./session');
  const session = await getSession();
  if (!session) {
    return [];
  }

  return getUserPermissions(session.user.id, organizationId);
}

/**
 * Check if current user has permission
 */
export async function currentUserHasPermission(
  organizationId: string,
  permission: string
): Promise<boolean> {
  const { getSession } = await import('./session');
  const session = await getSession();
  if (!session) {
    return false;
  }

  return hasPermission(session.user.id, organizationId, permission);
}

/**
 * Require current user to have permission
 */
export async function requireCurrentUserPermission(
  organizationId: string,
  permission: string,
  customMessage?: string
): Promise<void> {
  const { getSession } = await import('./session');
  const session = await getSession();
  if (!session) {
    throw new Error('You must be logged in to perform this action.');
  }

  await requirePermission(session.user.id, organizationId, permission, customMessage);
}

/**
 * Check if user is a member of an organization
 */
export async function isOrganizationMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { db } = await import('./db');
  
  const member = await db.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  return !!member;
}

/**
 * Require user to be organization member
 */
export async function requireOrganizationMember(
  userId: string,
  organizationId: string
): Promise<void> {
  const isMember = await isOrganizationMember(userId, organizationId);

  if (!isMember) {
    throw new Error('You must be a member of this organization to perform this action.');
  }
}

/**
 * Format permission name for user-friendly error messages
 */
function formatPermissionName(permission: string): string {
  return permission
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get organization ID from project ID
 * Helper function for permission checks
 */
export async function getOrganizationIdFromProject(
  projectId: string
): Promise<string | null> {
  const { db } = await import('./db');
  
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  return project?.organizationId || null;
}

/**
 * Get organization ID from issue ID
 * Helper function for permission checks
 */
export async function getOrganizationIdFromIssue(
  issueId: string
): Promise<string | null> {
  const { db } = await import('./db');
  
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        select: { organizationId: true },
      },
    },
  });

  return issue?.project.organizationId || null;
}

