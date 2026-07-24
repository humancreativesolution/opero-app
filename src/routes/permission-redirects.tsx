import { Navigate } from "react-router-dom";

import UsersPage from "@pages/users";
import SettingsPage from "@pages/settings";

import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";

export function UsersIndexRoute() {
  if (canAccess({ anyOf: [PERMISSIONS.users.read] })) {
    return <Navigate replace to="/users/staff" />;
  }

  if (canAccess({ anyOf: [PERMISSIONS.roles.read] })) {
    return <Navigate replace to="/users/roles" />;
  }

  return <UsersPage view="staff" />;
}

export function SettingsIndexRoute() {
  if (
    canAccess({
      anyOf: [
        PERMISSIONS.receiptConfig.read,
        PERMISSIONS.receiptConfig.update,
      ],
    })
  ) {
    return <Navigate replace to="/settings/receipt" />;
  }

  if (
    canAccess({
      anyOf: [
        PERMISSIONS.numberingConfig.read,
        PERMISSIONS.numberingConfig.update,
      ],
    })
  ) {
    return <Navigate replace to="/settings/numbering" />;
  }

  return <SettingsPage view="receipt" />;
}
