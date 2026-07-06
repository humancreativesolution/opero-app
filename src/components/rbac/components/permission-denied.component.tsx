import { ShieldAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function PermissionDenied() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your role does not have permission to access this page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
