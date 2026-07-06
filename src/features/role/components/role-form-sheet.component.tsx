import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/features/role/schemas/role-form.schema";
import { ErrorHelper } from "@/libs/error";
import {
  type PermissionEntity,
  type RoleEntity,
  useCreateRole,
  usePermissions,
  useUpdateRole,
} from "@/resources/gql/role.gql";

type RoleFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleEntity | null;
};

const defaultValues: RoleFormValues = {
  name: "",
  description: "",
  permissionIds: [],
};

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

export function RoleFormSheet({
  open,
  onOpenChange,
  role,
}: RoleFormSheetProps) {
  const permissionsQuery = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const isEdit = Boolean(role);
  const isSubmitting = createRole.isPending || updateRole.isPending;
  const permissions = useMemo(
    () => permissionsQuery.data ?? [],
    [permissionsQuery.data],
  );
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues,
  });
  const selectedPermissionIds = useWatch({
    control: form.control,
    name: "permissionIds",
  });
  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionEntity[]>>(
      (groups, permission) => {
        const key = permission.module || "General";
        groups[key] = [...(groups[key] ?? []), permission];
        return groups;
      },
      {},
    );
  }, [permissions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      role
        ? {
            name: role.name,
            description: role.description ?? "",
            permissionIds: role.permissions.map((permission) => permission.id),
          }
        : defaultValues,
    );
  }, [form, open, role]);

  function togglePermission(permissionId: string) {
    const currentIds = form.getValues("permissionIds");
    const nextIds = currentIds.includes(permissionId)
      ? currentIds.filter((id) => id !== permissionId)
      : [...currentIds, permissionId];

    form.setValue("permissionIds", nextIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleModule(modulePermissions: PermissionEntity[]) {
    const modulePermissionIds = modulePermissions.map((permission) => permission.id);
    const currentIds = form.getValues("permissionIds");
    const hasAllPermissions = modulePermissionIds.every((id) =>
      currentIds.includes(id),
    );
    const nextIds = hasAllPermissions
      ? currentIds.filter((id) => !modulePermissionIds.includes(id))
      : Array.from(new Set([...currentIds, ...modulePermissionIds]));

    form.setValue("permissionIds", nextIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleSubmit(values: RoleFormValues) {
    try {
      if (role) {
        await updateRole.mutateAsync({
          id: role.id,
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          permissionIds: values.permissionIds,
        });
        toast.success("Role updated");
      } else {
        await createRole.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          permissionIds: values.permissionIds,
        });
        toast.success("Role created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Failed to update role" : "Failed to create role", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="xl-sheet overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Update role" : "Create role"}</SheetTitle>
          <SheetDescription>
            Configure reusable permissions before assigning the role to staff.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-5 px-4"
            id="role-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role name</FormLabel>
                    <FormControl>
                      <Input placeholder="Example: Cashier Outlet A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional role description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <h3 className="font-medium">Permissions</h3>
                </div>
                <Badge variant="secondary">
                  {(selectedPermissionIds ?? []).length} selected
                </Badge>
              </div>

              {permissionsQuery.isLoading ? (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Loading permissions...
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Object.entries(groupedPermissions).map(
                    ([moduleName, modulePermissions]) => {
                      const modulePermissionIds = modulePermissions.map(
                        (permission) => permission.id,
                      );
                      const checkedCount = modulePermissionIds.filter((id) =>
                        selectedPermissionIds?.includes(id),
                      ).length;
                      const isModuleChecked =
                        checkedCount === modulePermissionIds.length;
                      const isModulePartial =
                        checkedCount > 0 && checkedCount < modulePermissionIds.length;

                      return (
                        <div
                          className="overflow-hidden rounded-lg border"
                          key={moduleName}
                        >
                          <label className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2 text-sm font-medium">
                            <input
                              checked={isModuleChecked}
                              className="size-4 accent-primary"
                              data-partial={isModulePartial}
                              onChange={() => toggleModule(modulePermissions)}
                              type="checkbox"
                            />
                            <span>{formatModuleName(moduleName)}</span>
                          </label>
                          <div className="grid gap-2 p-3">
                            {modulePermissions.map((permission) => (
                              <label
                                className="flex items-center gap-2 text-sm"
                                key={permission.id}
                              >
                                <input
                                  checked={selectedPermissionIds?.includes(
                                    permission.id,
                                  )}
                                  className="size-4 accent-primary"
                                  onChange={() => togglePermission(permission.id)}
                                  type="checkbox"
                                />
                                <span>{formatActionName(permission.action)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
              {form.formState.errors.permissionIds?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.permissionIds.message}
                </p>
              ) : null}
            </div>
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="role-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save role"
            ) : (
              "Create role"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
