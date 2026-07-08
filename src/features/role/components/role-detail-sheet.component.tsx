import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PermissionEntity, RoleEntity } from "@/resources/gql/role.gql";

type RoleDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleEntity | null;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function formatModuleName(moduleName: string) {
  return moduleName
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatActionName(action: string) {
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
}

export function RoleDetailSheet({
  open,
  onOpenChange,
  role,
}: RoleDetailSheetProps) {
  const groupedPermissions = useMemo(() => {
    return (role?.permissions ?? []).reduce<Record<string, PermissionEntity[]>>(
      (groups, permission) => {
        const key = permission.module || "General";
        groups[key] = [...(groups[key] ?? []), permission];
        return groups;
      },
      {},
    );
  }, [role?.permissions]);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Role detail</SheetTitle>
          <SheetDescription>
            Read-only permission overview for this reusable role.
          </SheetDescription>
        </SheetHeader>

        {role ? (
          <div className="space-y-5 px-4 pb-4">
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Role name</p>
                <p className="font-semibold">{role.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Permissions</p>
                <Badge variant="secondary">
                  {role.permissions.length} permissions
                </Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{role.description || "No description"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(role.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm">{formatDate(role.updatedAt)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <h3 className="font-medium">Permission detail</h3>
                </div>
              </div>

              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  No permissions assigned.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Object.entries(groupedPermissions).map(
                    ([moduleName, permissions]) => (
                      <div className="overflow-hidden rounded-lg border" key={moduleName}>
                        <div className="border-b bg-muted/60 px-3 py-2 text-sm font-medium">
                          {formatModuleName(moduleName)}
                        </div>
                        <div className="grid gap-2 p-3">
                          {permissions.map((permission) => (
                            <div
                              className="flex items-start justify-between gap-2 text-sm"
                              key={permission.id}
                            >
                              <div>
                                <p>{formatActionName(permission.action)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {permission.name}
                                </p>
                              </div>
                              <Badge
                                className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
                                variant="outline"
                              >
                                Allowed
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
