import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { CashierShiftEntity } from "@/graphql/generated";
import { ErrorHelper } from "@/libs/error";
import {
  CashMovementReason,
  CashMovementType,
  useCreateCashMovement,
  type CashMovementReason as CashMovementReasonValue,
  type CashMovementType as CashMovementTypeValue,
} from "@/resources/gql/cashier-shift.gql";

type CashMovementFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: CashierShiftEntity | null;
};

const cashInReasons = [
  CashMovementReason.AdditionalFloat,
  CashMovementReason.CashCorrection,
  CashMovementReason.Other,
];

const cashOutReasons = [
  CashMovementReason.CashWithdrawal,
  CashMovementReason.PettyCashExpense,
  CashMovementReason.CashDeposit,
  CashMovementReason.CashCorrection,
  CashMovementReason.Other,
];

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function CashMovementFormSheet({
  open,
  onOpenChange,
  shift,
}: CashMovementFormSheetProps) {
  const [type, setType] = useState<CashMovementTypeValue>(CashMovementType.CashIn);
  const [reason, setReason] = useState<CashMovementReasonValue>(
    CashMovementReason.AdditionalFloat,
  );
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const createCashMovement = useCreateCashMovement();
  const reasonOptions = useMemo(
    () => (type === CashMovementType.CashIn ? cashInReasons : cashOutReasons),
    [type],
  );

  function handleTypeChange(nextType: CashMovementTypeValue) {
    setType(nextType);
    setReason(
      nextType === CashMovementType.CashIn
        ? CashMovementReason.AdditionalFloat
        : CashMovementReason.CashWithdrawal,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!shift) {
      toast.error("No open cashier shift");
      return;
    }

    if (amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      await createCashMovement.mutateAsync({
        cashierShiftId: shift.id,
        type,
        reason,
        amount,
        notes: notes.trim() || undefined,
      });

      toast.success(type === CashMovementType.CashIn ? "Cash in saved" : "Cash out saved");
      setAmount(0);
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save cash movement", {
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
            Record cash in or cash out for the current open cashier shift.
          </SheetDescription>
        </SheetHeader>

        <form className="grid gap-4 px-4" id="cash-movement-form" onSubmit={handleSubmit}>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{shift?.locationName ?? "No open shift"}</p>
            <p className="text-muted-foreground">
              Opened by {shift?.openedByUserName ?? "-"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) =>
                handleTypeChange(event.target.value as CashMovementTypeValue)
              }
              value={type}
            >
              <option value={CashMovementType.CashIn}>Cash in</option>
              <option value={CashMovementType.CashOut}>Cash out</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              onChange={(event) =>
                setReason(event.target.value as CashMovementReasonValue)
              }
              value={reason}
            >
              {reasonOptions.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              min={0}
              onChange={(event) => setAmount(event.target.valueAsNumber || 0)}
              type="number"
              value={amount}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
              value={notes}
            />
          </div>
        </form>

        <SheetFooter>
          <Button
            disabled={createCashMovement.isPending || !shift}
            form="cash-movement-form"
            type="submit"
          >
            {createCashMovement.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save cash movement
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
