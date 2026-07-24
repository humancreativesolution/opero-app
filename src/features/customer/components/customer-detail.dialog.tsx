import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CustomerEntity } from "@/graphql/generated";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

type CustomerDetailProps = {
  customer: CustomerEntity;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CustomerDetail({ customer, onOpenChange, open }: CustomerDetailProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {customer.code && (
              <span className="font-mono text-xs">#{customer.code}</span>
            )}
            <span>·</span>
            <span>{formatDate(customer.createdAt)}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.phone ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                ) : null}
                {customer.email ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={customer.isActive ? "secondary" : "outline"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {customer.address ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.address}</p>
              </CardContent>
            </Card>
          ) : null}

          {customer.notes ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatDate(customer.createdAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatDate(customer.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
