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
import type { CustomerEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/features/customer/schemas/customer-form.schema";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/resources/gql/customer.gql";

type CustomerFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerEntity | null;
};

const defaultValues: CustomerFormValues = {
  code: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  isActive: true,
};

function optionalString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function CustomerFormSheet({
  open,
  onOpenChange,
  customer,
}: CustomerFormSheetProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = Boolean(customer);
  const isSubmitting = createCustomer.isPending || updateCustomer.isPending;
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      customer
        ? {
            code: customer.code ?? "",
            name: customer.name,
            phone: customer.phone ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
            isActive: customer.isActive,
          }
        : defaultValues,
    );
  }, [customer, form, open]);

  async function handleSubmit(values: CustomerFormValues) {
    try {
      const payload = {
        code: optionalString(values.code),
        name: values.name.trim(),
        phone: optionalString(values.phone),
        email: optionalString(values.email),
        address: optionalString(values.address),
        notes: optionalString(values.notes),
        isActive: values.isActive,
      };

      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, ...payload });
        toast.success("Customer updated");
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success("Customer created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update customer" : "Failed to create customer",
        { description: ErrorHelper.parse(error).message },
      );
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit customer" : "Create customer"}</SheetTitle>
          <SheetDescription>
            Customer data is optional in POS and useful for sales history and reports.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="customer-form"
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
                      <Input placeholder="Auto/manual code" {...field} />
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
                      <Input placeholder="Customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional phone" {...field} />
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
                      <Input placeholder="Optional email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active customer</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive customers are hidden from new POS selection.
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
          <Button disabled={isSubmitting} form="customer-form" type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create customer"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
