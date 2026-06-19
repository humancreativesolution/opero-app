import { Boxes, Home, Maximize2, ReceiptText, Settings } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthMenu } from "@/features/auth/components/AuthMenu";

export function PosLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ReceiptText className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Opero POS</p>
            <p className="text-xs text-muted-foreground">Outlet Utama</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="secondary">Shift Aktif</Badge>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">
              <Home className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/inventory">
              <Boxes className="size-4" />
              Inventory
            </Link>
          </Button>
          <Separator className="h-6" orientation="vertical" />
          <Button size="icon-sm" variant="ghost">
            <Maximize2 className="size-4" />
          </Button>
          <Button size="icon-sm" variant="ghost">
            <Settings className="size-4" />
          </Button>
          <AuthMenu />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
