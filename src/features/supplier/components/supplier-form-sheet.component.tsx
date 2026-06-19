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
import { Textarea } from "@/components/ui/textarea";
import type { SupplierEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  supplierFormSchema,
  type SupplierFormValues,
} from "@/features/supplier/schemas/supplier-form.schema";
import {
  useCreateSupplier,
  useUpdateSupplier,
} from "@/resources/gql/supplier.gql";

type SupplierFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierEntity | null;
};

const defaultValues: SupplierFormValues = {
  code: "",
  name: "",
  phone: "",
  address: "",
};

function optionalString(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export function SupplierFormSheet({
  open,
  onOpenChange,
  supplier,
}: SupplierFormSheetProps) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isEdit = Boolean(supplier);
  const isSubmitting = createSupplier.isPending || updateSupplier.isPending;
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      supplier
        ? {
            code: supplier.code ?? "",
            name: supplier.name,
            phone: supplier.phone ?? "",
            address: supplier.address ?? "",
          }
        : defaultValues,
    );
  }, [form, open, supplier]);

  async function handleSubmit(values: SupplierFormValues) {
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({
          id: supplier.id,
          code: optionalString(values.code),
          name: values.name.trim(),
          phone: optionalString(values.phone),
          address: optionalString(values.address),
        });
        toast.success("Supplier updated");
      } else {
        await createSupplier.mutateAsync({
          code: optionalString(values.code),
          name: values.name.trim(),
          phone: optionalString(values.phone),
          address: optionalString(values.address),
        });
        toast.success("Supplier created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update supplier" : "Failed to create supplier",
        {
          description: ErrorHelper.parse(error).message,
        },
      );
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit supplier" : "Create supplier"}</SheetTitle>
          <SheetDescription>
            Suppliers are used by purchasing and purchase history.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="supplier-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional supplier code" {...field} />
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
                  <FormLabel>Supplier name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: PT Sumber Makmur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional supplier address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button disabled={isSubmitting} form="supplier-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create supplier"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
