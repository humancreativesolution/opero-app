import {
  BarChart3,
  Boxes,
  Home,
  MapPin,
  Package,
  PackageSearch,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuthMenu } from "@/features/auth/components/auth-menu.component";
import { cn } from "@/libs/utils";

const mainMenu = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "POS", path: "/pos", icon: ShoppingCart },
  { label: "Products", path: "/products", icon: Package },
  { label: "Suppliers", path: "/suppliers", icon: Truck },
  { label: "Locations", path: "/locations", icon: MapPin },
  { label: "Purchases", path: "/purchases", icon: PackageSearch },
  { label: "Inventory", path: "/inventory", icon: Boxes },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Users", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

function getTenantHost() {
  if (typeof window === "undefined") {
    return "tenant.opero.id";
  }

  return window.location.hostname;
}

export function AppLayout() {
  const tenantHost = getTenantHost();

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-semibold">O</span>
          </div>
          <div>
            <p className="font-semibold leading-none">Opero</p>
            <p className="text-xs text-muted-foreground">POS + ERP</p>
          </div>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {mainMenu.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-foreground",
                )
              }
              key={item.path}
              to={item.path}
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">Opero App</p>
            <p className="truncate text-xs text-muted-foreground">{tenantHost}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Outlet Utama</Badge>
            <AuthMenu />
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
