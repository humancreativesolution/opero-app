import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  closeCashierShiftFormSchema,
  type CloseCashierShiftFormValues,
} from "@/features/cashier-shift/schemas/cashier-shift-form.schema";
import type { CashierShiftEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useCloseCashierShift } from "@/resources/gql/cashier-shift.gql";

type CloseCashierShiftSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: CashierShiftEntity | null;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function CloseCashierShiftSheet({
  open,
  onOpenChange,
  shift,
}: CloseCashierShiftSheetProps) {
  const closeCashierShift = useCloseCashierShift();
  const form = useForm<CloseCashierShiftFormValues>({
    resolver: zodResolver(closeCashierShiftFormSchema),
    defaultValues: {
      countedCash: shift?.expectedCash ?? 0,
      notes: "",
    },
  });
  const countedCash = useWatch({
    control: form.control,
    name: "countedCash",
  });
  const expectedCash = shift?.expectedCash ?? 0;
  const variance = (countedCash || 0) - expectedCash;
  const isSubmitting = closeCashierShift.isPending;

  useEffect(() => {
    if (open) {
      form.reset({
        countedCash: shift?.expectedCash ?? 0,
        notes: "",
      });
    }
  }, [form, open, shift?.expectedCash]);

  async function handleSubmit(values: CloseCashierShiftFormValues) {
    if (!shift) {
      toast.error("No active cashier shift");
      return;
    }

    if (variance !== 0 && !values.notes?.trim()) {
      form.setError("notes", {
        message: "Notes are required when there is cash variance",
      });
      return;
    }

    try {
      await closeCashierShift.mutateAsync({
        id: shift.id,
        countedCash: values.countedCash,
        notes: values.notes?.trim() || undefined,
      });
      toast.success("Cashier shift closed");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to close cashier shift", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Close cashier shift</SheetTitle>
          <SheetDescription>
            Count drawer cash and close the current cashier shift.
          </SheetDescription>
        </SheetHeader>

        <div className="mx-4 grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Outlet</span>
            <span className="font-medium">{shift?.locationName ?? "-"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Opening cash</span>
            <span className="font-medium">
              {formatCurrency(shift?.openingCash ?? 0)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Expected cash</span>
            <span className="font-medium">{formatCurrency(expectedCash)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Variance</span>
            <span className={variance === 0 ? "font-medium" : "font-medium text-red-600"}>
              {formatCurrency(variance)}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="close-cashier-shift-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="countedCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counted cash</FormLabel>
                  <FormControl>
                    <Input
                      min="0"
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber || 0)
                      }
                      step="100"
                      type="number"
                      value={field.value}
                    />
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
                    <Textarea
                      placeholder={
                        variance === 0
                          ? "Optional closing notes"
                          : "Required because cash variance is not zero"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button
            disabled={isSubmitting || !shift}
            form="close-cashier-shift-form"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Closing
              </>
            ) : (
              "Close shift"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
