import { AlertTriangle, BadgeDollarSign, Loader2, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/libs/utils";
import { useCashierShiftReport } from "@/resources/gql/cashier-shift.gql";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value?: number | null) {
  return currencyFormatter.format(value ?? 0);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function getVarianceClassName(value?: number | null) {
  if (!value) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  return value > 0
    ? "text-amber-700 dark:text-amber-300"
    : "text-red-700 dark:text-red-300";
}

type CashierShiftReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId?: string | null;
};

function ReportMetric({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: string | number;
  helper?: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold", className)}>{value}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function CashierShiftReportDialog({
  open,
  onOpenChange,
  shiftId,
}: CashierShiftReportDialogProps) {
  const reportQuery = useCashierShiftReport(open ? shiftId : null);
  const report = reportQuery.data;
  const isLiveReport = report?.status === "OPEN";
  const variance = report?.variance ?? 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-muted-foreground" />
            Shift Report
            {report ? (
              <Badge variant={isLiveReport ? "secondary" : "outline"}>
                {isLiveReport ? "Live report" : "Final report"}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Cashier shift sales, payments, profit, and cash reconciliation.
          </DialogDescription>
        </DialogHeader>

        {reportQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading shift report...
          </div>
        ) : null}

        {reportQuery.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load shift report.
          </div>
        ) : null}

        {report ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shift info</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Outlet</span>
                  <span className="font-medium">{report.locationName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isLiveReport ? "secondary" : "outline"}>
                    {report.status}
                  </Badge>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Opened by</span>
                  <span className="font-medium">{report.openedByUserName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Closed by</span>
                  <span className="font-medium">{report.closedByUserName ?? "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Opened at</span>
                  <span className="font-medium">{formatDate(report.openedAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Closed at</span>
                  <span className="font-medium">{formatDate(report.closedAt)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BadgeDollarSign className="size-4 text-muted-foreground" />
                    Cash reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <ReportMetric
                    label="Opening cash"
                    value={formatCurrency(report.openingCash)}
                  />
                  <ReportMetric
                    label="Expected cash"
                    value={formatCurrency(report.expectedCash)}
                    helper="Opening + cash payment + cash in - cash out"
                  />
                  <ReportMetric
                    label="Cash in"
                    value={formatCurrency(report.cashInTotal)}
                  />
                  <ReportMetric
                    label="Cash out"
                    value={formatCurrency(report.cashOutTotal)}
                  />
                  <ReportMetric
                    label="Counted cash"
                    helper={isLiveReport ? "Not final until shift is closed" : undefined}
                    value={report.countedCash == null ? "-" : formatCurrency(report.countedCash)}
                  />
                  <ReportMetric
                    className={getVarianceClassName(variance)}
                    helper={
                      variance === 0
                        ? "Balanced"
                        : variance > 0
                          ? "Cash over"
                          : "Cash shortage"
                    }
                    label="Variance"
                    value={formatCurrency(variance)}
                  />
                  {variance !== 0 ? (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:col-span-2 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 size-4" />
                      <span>Cash variance needs review before operational reconciliation.</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReportMetric
                      label="Cash payment"
                      value={formatCurrency(report.cashPaymentTotal)}
                    />
                    <ReportMetric
                      label="Non-cash payment"
                      value={formatCurrency(report.nonCashPaymentTotal)}
                    />
                  </div>
                  <div className="space-y-2">
                    {report.paymentsByMethod.length > 0 ? (
                      report.paymentsByMethod.map((payment) => (
                        <div
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          key={payment.method}
                        >
                          <div>
                            <p className="font-medium">{payment.method}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.count} transactions
                            </p>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                        No payment data for this shift.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sales summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <ReportMetric
                    label="Transactions"
                    value={report.transactionCount}
                    helper={`${report.saleCount} sales · ${report.returnCount} returns`}
                  />
                  <ReportMetric label="Items sold" value={report.itemQtySold} />
                  <ReportMetric
                    label="Gross sales"
                    value={formatCurrency(report.grossSales)}
                  />
                  <ReportMetric
                    label="Returns"
                    value={formatCurrency(report.returnAmount)}
                  />
                  <ReportMetric
                    label="Net sales"
                    value={formatCurrency(report.netSales)}
                  />
                  <ReportMetric
                    label="Total discount"
                    value={formatCurrency(report.totalDiscount)}
                    helper={`Item ${formatCurrency(report.itemDiscountTotal)} · Transaction ${formatCurrency(report.transactionDiscountTotal)}`}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profit summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <ReportMetric label="COGS" value={formatCurrency(report.cogs)} />
                  <ReportMetric
                    className={report.grossProfit < 0 ? "text-red-700 dark:text-red-300" : undefined}
                    label="Gross profit"
                    value={formatCurrency(report.grossProfit)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
