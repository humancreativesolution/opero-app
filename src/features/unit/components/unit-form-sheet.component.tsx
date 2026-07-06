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
import type { UnitEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  unitFormSchema,
  type UnitFormValues,
} from "@/features/unit/schemas/unit-form.schema";
import { useCreateUnit, useUpdateUnit } from "@/resources/gql/unit.gql";

type UnitFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: UnitEntity | null;
};

const defaultValues: UnitFormValues = {
  code: "",
  name: "",
  isActive: true,
};

export function UnitFormSheet({ open, onOpenChange, unit }: UnitFormSheetProps) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const isEdit = Boolean(unit);
  const isSubmitting = createUnit.isPending || updateUnit.isPending;
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      unit
        ? {
            code: unit.code,
            name: unit.name,
            isActive: unit.isActive,
          }
        : defaultValues,
    );
  }, [form, open, unit]);

  async function handleSubmit(values: UnitFormValues) {
    try {
      if (unit) {
        await updateUnit.mutateAsync({
          id: unit.id,
          code: values.code.trim(),
          name: values.name.trim(),
          isActive: values.isActive,
        });
        toast.success("Unit updated");
      } else {
        await createUnit.mutateAsync({
          code: values.code.trim(),
          name: values.name.trim(),
          isActive: values.isActive,
        });
        toast.success("Unit created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Failed to update unit" : "Failed to create unit", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit unit" : "Create unit"}</SheetTitle>
          <SheetDescription>
            Units are used by products, POS catalog, purchasing, and reports.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="unit-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="PCS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pieces" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active unit</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive units should not be selected for new products.
                    </p>
                  </div>
                  <FormControl>
                    <input
                      checked={field.value}
                      className="size-4 accent-primary"
                      onChange={(event) => field.onChange(event.target.checked)}
                      type="checkbox"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="unit-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create unit"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
