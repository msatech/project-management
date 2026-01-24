'use client';

import { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  userPermissions: string[];
  fallback?: ReactNode;
}

export function PermissionGate({ children, permission, userPermissions, fallback = null }: PermissionGateProps) {
  const hasPermission = userPermissions.includes(permission);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function usePermissions(userPermissions: string[]) {
  return {
    can: (permission: string) => userPermissions.includes(permission),
    canAny: (permissions: string[]) => permissions.some(p => userPermissions.includes(p)),
    canAll: (permissions: string[]) => permissions.every(p => userPermissions.includes(p)),
  };
}
