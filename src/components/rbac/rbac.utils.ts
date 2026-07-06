import type { UserResponse } from "@/graphql/generated";
import { getAuthUser } from "@/routes/auth";

import type { PermissionRequirement } from "@/components/rbac/permissions";

export function getCurrentUserPermissions() {
  return getAuthUser()?.permissions ?? [];
}

export function isOwnerRole(user: UserResponse | null = getAuthUser()) {
  return user?.role.trim().toLowerCase() === "owner";
}

export function isCurrentUserSuperuser() {
  const user = getAuthUser();
  return Boolean(user?.isSuperuser || isOwnerRole(user));
}

export function hasPermission(permission: string, user: UserResponse | null = getAuthUser()) {
  if (!user) {
    return false;
  }

  if (user.isSuperuser || isOwnerRole(user)) {
    return true;
  }

  return user.permissions.includes(permission);
}

export function canAccess(
  requirement?: PermissionRequirement,
  user: UserResponse | null = getAuthUser(),
) {
  if (!requirement) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.isSuperuser || isOwnerRole(user)) {
    return true;
  }

  const permissions = new Set(user.permissions);
  const allOf = requirement.allOf ?? [];
  const anyOf = requirement.anyOf ?? [];
  const hasAll = allOf.every((permission) => permissions.has(permission));
  const hasAny = anyOf.length === 0 || anyOf.some((permission) => permissions.has(permission));

  return hasAll && hasAny;
}
