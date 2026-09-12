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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  cashMovementFormSchema,
  type CashMovementFormValues,
} from "@/features/cashier-shift/schemas/cashier-shift-form.schema";
import { CashMovementReason, CashMovementType } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import { useCreateCashMovement } from "@/resources/gql/cashier-shift.gql";

const reasonLabels: Record<CashMovementReason, string> = {
  [CashMovementReason.AdditionalFloat]: "Additional float",
  [CashMovementReason.CashWithdrawal]: "Cash withdrawal",
  [CashMovementReason.PettyCashExpense]: "Petty cash expense",
  [CashMovementReason.CashCorrection]: "Cash correction",
  [CashMovementReason.CashDeposit]: "Cash deposit",
  [CashMovementReason.Other]: "Other",
};

type CashMovementFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashierShiftId?: string | null;
};

const defaultValues: CashMovementFormValues = {
  type: CashMovementType.CashIn,
  reason: CashMovementReason.AdditionalFloat,
  amount: 0,
  notes: "",
};

export function CashMovementFormSheet({
  open,
  onOpenChange,
  cashierShiftId,
}: CashMovementFormSheetProps) {
  const createCashMovement = useCreateCashMovement();
  const form = useForm<CashMovementFormValues>({
    resolver: zodResolver(cashMovementFormSchema),
    defaultValues,
  });
  const isSubmitting = createCashMovement.isPending;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [form, open]);

  async function handleSubmit(values: CashMovementFormValues) {
    if (!cashierShiftId) {
      toast.error("Open cashier shift is required");
      return;
    }

    try {
      await createCashMovement.mutateAsync({
        cashierShiftId,
        type: values.type,
        reason: values.reason,
        amount: values.amount,
        notes: values.notes?.trim() || undefined,
      });
      toast.success("Cash movement recorded");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to record cash movement", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Cash movement</SheetTitle>
          <SheetDescription>
            Record cash in or cash out during the current shift.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="cash-movement-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CashMovementType.CashIn}>Cash in</SelectItem>
                      <SelectItem value={CashMovementType.CashOut}>Cash out</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CashMovementReason).map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reasonLabels[reason]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
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
                    <Textarea placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button
            disabled={isSubmitting || !cashierShiftId}
            form="cash-movement-form"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
