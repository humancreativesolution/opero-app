import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  userFormSchema,
  type UserFormValues,
} from "@/features/user/schemas/user-form.schema";
import { ErrorHelper } from "@/libs/error";
import type { RoleEntity } from "@/resources/gql/role.gql";
import {
  type UserEntity,
  useCreateUser,
  useUpdateUser,
} from "@/resources/gql/user.gql";

type UserFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleEntity[];
  user?: UserEntity | null;
};

const defaultValues: UserFormValues = {
  fullName: "",
  email: "",
  password: "",
  roleId: "",
};

export function UserFormSheet({
  open,
  onOpenChange,
  roles,
  user,
}: UserFormSheetProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEdit = Boolean(user);
  const isSubmitting = createUser.isPending || updateUser.isPending;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      user
        ? {
            fullName: user.fullName,
            email: user.email,
            password: "",
            roleId: user.roleId ?? "",
          }
        : defaultValues,
    );
  }, [form, open, user]);

  async function handleSubmit(values: UserFormValues) {
    if (!user && !values.password?.trim()) {
      form.setError("password", { message: "Password is required" });
      return;
    }

    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          roleId: values.roleId,
        });
        toast.success("Staff updated");
      } else {
        await createUser.mutateAsync({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password?.trim() ?? "",
          roleId: values.roleId,
        });
        toast.success("Staff created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Failed to update staff" : "Failed to create staff", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Update staff" : "Create new staff"}</SheetTitle>
          <SheetDescription>
            Assign staff to a custom role so permissions stay reusable.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="user-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: Kasir Outlet A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="staff@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit ? (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Initial password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      {...field}
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="user-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save staff"
            ) : (
              "Create staff"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
