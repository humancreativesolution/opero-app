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
import {
  openCashierShiftFormSchema,
  type OpenCashierShiftFormValues,
} from "@/features/cashier-shift/schemas/cashier-shift-form.schema";
import { ErrorHelper } from "@/libs/error";
import { useOpenCashierShift } from "@/resources/gql/cashier-shift.gql";

type OpenCashierShiftSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName?: string;
};

const defaultValues: OpenCashierShiftFormValues = {
  openingCash: 0,
  notes: "",
};

export function OpenCashierShiftSheet({
  open,
  onOpenChange,
  locationId,
  locationName,
}: OpenCashierShiftSheetProps) {
  const openCashierShift = useOpenCashierShift();
  const form = useForm<OpenCashierShiftFormValues>({
    resolver: zodResolver(openCashierShiftFormSchema),
    defaultValues,
  });
  const isSubmitting = openCashierShift.isPending;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [form, open]);

  async function handleSubmit(values: OpenCashierShiftFormValues) {
    if (!locationId) {
      toast.error("Outlet is required");
      return;
    }

    try {
      await openCashierShift.mutateAsync({
        locationId,
        openingCash: values.openingCash,
        notes: values.notes?.trim() || undefined,
      });
      toast.success("Cashier shift opened");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to open cashier shift", {
        description: ErrorHelper.parse(error).message,
      });
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Open cashier shift</SheetTitle>
          <SheetDescription>
            Start a cashier shift before accepting POS transactions.
          </SheetDescription>
        </SheetHeader>

        <div className="mx-4 rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">Outlet</p>
          <p className="font-medium">{locationName || "No outlet selected"}</p>
        </div>

        <Form {...form}>
          <form
            className="grid gap-4 px-4"
            id="open-cashier-shift-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="openingCash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening cash</FormLabel>
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
                    <Textarea placeholder="Optional opening notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button
            disabled={isSubmitting || !locationId}
            form="open-cashier-shift-form"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening
              </>
            ) : (
              "Open shift"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
