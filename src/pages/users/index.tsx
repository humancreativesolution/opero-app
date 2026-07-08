import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table.component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RoleDetailSheet } from "@/features/role/components/role-detail-sheet.component";
import { RoleFormSheet } from "@/features/role/components/role-form-sheet.component";
import { PermissionGate } from "@/components/rbac/components/permission-gate.component";
import { PERMISSIONS } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import { UserFormSheet } from "@/features/user/components/user-form-sheet.component";
import { ErrorHelper } from "@/libs/error";
import {
  type RoleEntity,
  useRemoveRole,
  useRolesByTenant,
} from "@/resources/gql/role.gql";
import {
  type UserEntity,
  useGetUsers,
  useRemoveUser,
} from "@/resources/gql/user.gql";

type UserManagementView = "staff" | "roles";

type UsersPageProps = {
  view: UserManagementView;
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

function isProtectedOwnerRole(role: RoleEntity) {
  return role.name.trim().toLowerCase() === "owner";
}

export default function UsersPage({ view }: UsersPageProps) {
  const [search, setSearch] = useState("");
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [roleDetailSheetOpen, setRoleDetailSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleEntity | null>(null);
  const [detailRole, setDetailRole] = useState<RoleEntity | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserEntity | null>(null);
  const [deleteRole, setDeleteRole] = useState<RoleEntity | null>(null);

  const usersQuery = useGetUsers();
  const rolesQuery = useRolesByTenant();
  const removeUser = useRemoveUser();
  const removeRole = useRemoveRole();
  const isStaffView = view === "staff";
  const canUpdateStaff = canAccess({ anyOf: [PERMISSIONS.users.update] });
  const canDeleteStaff = canAccess({ anyOf: [PERMISSIONS.users.delete] });
  const canUpdateRole = canAccess({ anyOf: [PERMISSIONS.roles.update] });
  const canDeleteRole = canAccess({ anyOf: [PERMISSIONS.roles.delete] });

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const filteredUsers = useMemo(() => {
    const users = usersQuery.data?.data ?? [];
    const keyword = search.trim().toLowerCase();

    if (!keyword || !isStaffView) {
      return users;
    }

    return users.filter((user) =>
      [user.fullName, user.email, user.role]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [isStaffView, search, usersQuery.data?.data]);
  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword || isStaffView) {
      return roles;
    }

    return roles.filter((role) =>
      [role.name, role.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [isStaffView, roles, search]);

  function handleCreateStaff() {
    setSelectedUser(null);
    setUserSheetOpen(true);
  }

  function handleEditStaff(user: UserEntity) {
    setSelectedUser(user);
    setUserSheetOpen(true);
  }

  function handleCreateRole() {
    setSelectedRole(null);
    setRoleSheetOpen(true);
  }

  function handleEditRole(role: RoleEntity) {
    if (isProtectedOwnerRole(role)) {
      toast.error("Owner role cannot be edited");
      return;
    }

    setSelectedRole(role);
    setRoleSheetOpen(true);
  }

  function handleViewRole(role: RoleEntity) {
    setDetailRole(role);
    setRoleDetailSheetOpen(true);
  }

  async function handleDeleteUser() {
    if (!deleteUser) {
      return;
    }

    try {
      await removeUser.mutateAsync(deleteUser.id);
      toast.success("Staff deleted");
      setDeleteUser(null);
    } catch (error) {
      toast.error("Failed to delete staff", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  async function handleDeleteRole() {
    if (!deleteRole) {
      return;
    }

    if (isProtectedOwnerRole(deleteRole)) {
      toast.error("Owner role cannot be deleted");
      setDeleteRole(null);
      return;
    }

    try {
      await removeRole.mutateAsync(deleteRole.id);
      toast.success("Role deleted");
      setDeleteRole(null);
    } catch (error) {
      toast.error("Failed to delete role", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  const userColumns = useMemo<ColumnDef<UserEntity>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Staff",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) =>
          row.original.role ? (
            <Badge variant="secondary">{row.original.role}</Badge>
          ) : (
            <Badge variant="outline">No role</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canUpdateStaff ? (
              <Button
                onClick={() => handleEditStaff(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Edit className="size-4" />
                <span className="sr-only">Edit staff</span>
              </Button>
            ) : null}
            {canDeleteStaff ? (
              <Button
                onClick={() => setDeleteUser(row.original)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 className="size-4 text-destructive" />
                <span className="sr-only">Delete staff</span>
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDeleteStaff, canUpdateStaff],
  );

  const roleColumns = useMemo<ColumnDef<RoleEntity>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.description || "No description"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.permissions.length} permissions
          </Badge>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const isOwner = isProtectedOwnerRole(row.original);

          return (
            <div className="flex justify-end gap-1">
              <Button
                onClick={() => handleViewRole(row.original)}
                size="icon-sm"
                title="View role detail"
                variant="ghost"
              >
                <Eye className="size-4" />
                <span className="sr-only">View role detail</span>
              </Button>
              {canUpdateRole ? (
                <Button
                  disabled={isOwner}
                  onClick={() => handleEditRole(row.original)}
                  size="icon-sm"
                  title={isOwner ? "Owner role cannot be edited" : "Edit role"}
                  variant="ghost"
                >
                  <Edit className="size-4" />
                  <span className="sr-only">Edit role</span>
                </Button>
              ) : null}
              {canDeleteRole ? (
                <Button
                  disabled={isOwner}
                  onClick={() => setDeleteRole(row.original)}
                  size="icon-sm"
                  title={
                    isOwner ? "Owner role cannot be deleted" : "Delete role"
                  }
                  variant="ghost"
                >
                  <Trash2 className="size-4 text-destructive" />
                  <span className="sr-only">Delete role</span>
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [canDeleteRole, canUpdateRole],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isStaffView ? "Staff" : "Roles"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isStaffView
              ? "Manage tenant staff and assign reusable access roles."
              : "Manage reusable access roles and permissions."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionGate
            anyOf={[
              isStaffView ? PERMISSIONS.users.create : PERMISSIONS.roles.create,
            ]}
          >
            <Button onClick={isStaffView ? handleCreateStaff : handleCreateRole}>
              <Plus className="size-4" />
              {isStaffView ? "Create staff" : "Create role"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isStaffView ? (
              <>
                <UserPlus className="size-4 text-muted-foreground" />
                Staff
              </>
            ) : (
              <>
                <ShieldCheck className="size-4 text-muted-foreground" />
                Roles
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isStaffView ? (
            <DataTable
              columns={userColumns}
              data={filteredUsers}
              emptyMessage="No staff found."
              isLoading={usersQuery.isLoading}
              toolbar={
                <div className="relative w-full sm:max-w-sm">
                  <Input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search staff, email, or role"
                    value={search}
                  />
                </div>
              }
            />
          ) : (
            <DataTable
              columns={roleColumns}
              data={filteredRoles}
              emptyMessage="No roles found."
              isLoading={rolesQuery.isLoading}
              toolbar={
                <div className="relative w-full sm:max-w-sm">
                  <Input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search role name or description"
                    value={search}
                  />
                </div>
              }
            />
          )}
        </CardContent>
      </Card>

      <UserFormSheet
        onOpenChange={setUserSheetOpen}
        open={userSheetOpen}
        roles={roles}
        user={selectedUser}
      />

      <RoleFormSheet
        onOpenChange={setRoleSheetOpen}
        open={roleSheetOpen}
        role={selectedRole}
      />

      <RoleDetailSheet
        onOpenChange={(open) => {
          setRoleDetailSheetOpen(open);
          if (!open) {
            setDetailRole(null);
          }
        }}
        open={roleDetailSheetOpen}
        role={detailRole}
      />

      <Dialog onOpenChange={(open) => !open && setDeleteUser(null)} open={Boolean(deleteUser)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete staff</DialogTitle>
            <DialogDescription>
              This will remove staff "{deleteUser?.fullName}" from this tenant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={removeUser.isPending}
              onClick={() => setDeleteUser(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={removeUser.isPending} onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setDeleteRole(null)} open={Boolean(deleteRole)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              This will remove role "{deleteRole?.name}". Staff using this role may
              need reassignment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={removeRole.isPending}
              onClick={() => setDeleteRole(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={removeRole.isPending} onClick={handleDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
