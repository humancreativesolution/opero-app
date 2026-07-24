import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { PromotionEntity, PromotionStatus, PromotionType } from "@/graphql/generated";

type PromotionTypeLabel = "Product discount" | "Min qty" | "Min transaction";
type PromotionChannelLabel = "POS" | "Sales order" | "All";
type PromotionStatusLabel = "Active" | "Inactive";

function getTypeLabel(type: PromotionType): PromotionTypeLabel {
  if (type === "PRODUCT_DISCOUNT") {
    return "Product discount";
  }

  if (type === "MIN_QTY_DISCOUNT") {
    return "Min qty";
  }

  return "Min transaction";
}

function getChannelLabel(channel: string): PromotionChannelLabel {
  if (channel === "POS") {
    return "POS";
  }

  if (channel === "SALES_ORDER") {
    return "Sales order";
  }

  return "All";
}

function getStatusLabel(status: PromotionStatus): PromotionStatusLabel {
  if (status === "ACTIVE") {
    return "Active";
  }

  return "Inactive";
}

function getStatusClassName(status: PromotionStatus) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatDiscount(promotion: PromotionEntity) {
  if (promotion.discountValueType === "PERCENT") {
    return `${promotion.discountValue}%`;
  }

  return currencyFormatter.format(promotion.discountValue);
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date);
}

type PromotionDetailProps = {
  promotion: PromotionEntity;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function PromotionDetail({ promotion, onOpenChange, open }: PromotionDetailProps) {
  const discountLabel = formatDiscount(promotion);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{promotion.name}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatDate(promotion.createdAt)}</span>
          </div>
          {promotion.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{promotion.description}</p>
          ) : null}
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{getTypeLabel(promotion.type)}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusClassName(promotion.status)} variant="outline">
                  {getStatusLabel(promotion.status)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{discountLabel}</div>
                <div className="text-xs text-muted-foreground">
                  {promotion.discountValueType === "PERCENT" ? "Percent discount" : "Fixed amount"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{getChannelLabel(promotion.channel)}</Badge>
              </CardContent>
            </Card>
          </div>

          {promotion.minQty ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minimum qty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{promotion.minQty}</div>
              </CardContent>
            </Card>
          ) : null}

          {promotion.minSubtotal ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minimum subtotal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {currencyFormatter.format(promotion.minSubtotal)}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {promotion.startsAt || promotion.endsAt ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {promotion.startsAt ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Starts at</span>
                    <span className="font-medium">{formatDate(promotion.startsAt)}</span>
                  </div>
                ) : null}
                {promotion.endsAt ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ends at</span>
                    <span className="font-medium">{formatDate(promotion.endsAt)}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Apply to all products</span>
                <span className="font-medium">{promotion.applyToAllProducts ? "Yes" : "No"}</span>
              </div>
              {!promotion.applyToAllProducts && promotion.productIds && promotion.productIds.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Products ({promotion.productIds.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {promotion.productIds.map((id, idx) => (
                      <Badge key={id} variant="secondary">
                        {idx < 3 ? `Product ${idx + 1}` : "..."}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {promotion.locationIds && promotion.locationIds.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Locations ({promotion.locationIds.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {promotion.locationIds.map((id, idx) => (
                      <Badge key={id} variant="outline">
                        {idx < 3 ? `Location ${idx + 1}` : "..."}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Applies to all locations</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
