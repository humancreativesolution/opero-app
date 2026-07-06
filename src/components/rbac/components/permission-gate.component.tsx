import type { ReactNode } from "react";

import type { PermissionRequirement } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";

export type PermissionGateProps = PermissionRequirement & {
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ allOf, anyOf, children, fallback = null }: PermissionGateProps) {
  if (!canAccess({ allOf, anyOf })) {
    return fallback;
  }

  return children;
}
