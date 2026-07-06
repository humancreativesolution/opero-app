import type { ComponentType } from "react";

import { PermissionDenied } from "@/components/rbac/components/permission-denied.component";
import type { PermissionRequirement } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";

export function withPermission<Props extends object>(
  Component: ComponentType<Props>,
  requirement: PermissionRequirement,
  Fallback: ComponentType = PermissionDenied,
) {
  function PermissionWrappedComponent(props: Props) {
    if (!canAccess(requirement)) {
      return <Fallback />;
    }

    return <Component {...props} />;
  }

  PermissionWrappedComponent.displayName = `withPermission(${Component.displayName || Component.name || "Component"})`;

  return PermissionWrappedComponent;
}
