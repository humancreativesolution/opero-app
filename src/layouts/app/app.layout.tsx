import {
  BarChart3,
  Boxes,
  Home,
  MapPin,
  Package,
  PackageSearch,
  ReceiptText,
  Ruler,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuthMenu } from "@/features/auth/components/auth-menu.component";
import { PERMISSIONS, type PermissionRequirement } from "@/components/rbac/permissions";
import { canAccess } from "@/components/rbac/rbac.utils";
import { getAuthUser } from "@/routes/auth";
import { cn } from "@/libs/utils";

type ChildMenuItem = {
  label: string;
  path: string;
  permissions?: PermissionRequirement;
};

type MenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  matchPath?: string;
  permissions?: PermissionRequirement;
  children?: ChildMenuItem[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: Home,
        permissions: {
          anyOf: [PERMISSIONS.dashboard.view, PERMISSIONS.reports.view],
        },
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "POS",
        path: "/pos",
        icon: ShoppingCart,
        permissions: { anyOf: [PERMISSIONS.pos.access] },
      },
      {
        label: "Sales",
        path: "/sales",
        icon: ReceiptText,
        permissions: {
          anyOf: [PERMISSIONS.receipt.view, PERMISSIONS.reports.view],
        },
      },
      {
        label: "Promotions",
        path: "/promotions",
        icon: Tag,
        permissions: { anyOf: [PERMISSIONS.promotions.read] },
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Products",
        path: "/products",
        icon: Package,
        permissions: { anyOf: [PERMISSIONS.products.read] },
      },
      {
        label: "Inventory",
        path: "/inventory",
        icon: Boxes,
        permissions: { anyOf: [PERMISSIONS.stock.read] },
      },
      {
        label: "Locations",
        path: "/locations",
        icon: MapPin,
        permissions: { anyOf: [PERMISSIONS.locations.read] },
      },
      {
        label: "Units",
        path: "/units",
        icon: Ruler,
        permissions: { anyOf: [PERMISSIONS.units.read] },
      },
    ],
  },
  {
    label: "Purchasing",
    items: [
      {
        label: "Suppliers",
        path: "/suppliers",
        icon: Truck,
        permissions: { anyOf: [PERMISSIONS.suppliers.read] },
      },
      {
        label: "Purchases",
        path: "/purchases",
        icon: PackageSearch,
        permissions: { anyOf: [PERMISSIONS.purchases.read] },
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
        permissions: { anyOf: [PERMISSIONS.reports.view] },
      },
      {
        label: "Users",
        path: "/users/staff",
        icon: Users,
        matchPath: "/users",
        children: [
          {
            label: "Staff",
            path: "/users/staff",
            permissions: { anyOf: [PERMISSIONS.users.read] },
          },
          {
            label: "Roles",
            path: "/users/roles",
            permissions: { anyOf: [PERMISSIONS.roles.read] },
          },
        ],
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        permissions: {
          anyOf: [PERMISSIONS.settings.read, PERMISSIONS.settings.update],
        },
      },
    ],
  },
];

function getTenantHost() {
  if (typeof window === "undefined") {
    return "tenant.opero.id";
  }

  return window.location.hostname;
}

export function AppLayout() {
  const tenantHost = getTenantHost();
  const location = useLocation();
  const authUser = getAuthUser();
  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) =>
            canAccess(child.permissions, authUser),
          ),
        }))
        .filter((item) => {
          const hasVisibleChildren = Boolean(item.children?.length);
          return hasVisibleChildren || canAccess(item.permissions, authUser);
        }),
    }))
    .filter((group) => group.items.length > 0);

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

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {visibleMenuGroups.map((group) => (
            <div className="space-y-1" key={group.label}>
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isParentActive = location.pathname.startsWith(
                  item.matchPath ?? item.path,
                );

                return (
                  <div key={item.path}>
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          (isActive || isParentActive) &&
                            "bg-primary/10 text-foreground",
                        )
                      }
                      to={item.path}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </NavLink>

                    {item.children && isParentActive ? (
                      <div className="mt-1 space-y-1 pl-7">
                        {item.children.map((child) => (
                          <NavLink
                            className={({ isActive }) =>
                              cn(
                                "block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                isActive && "bg-muted text-foreground",
                              )
                            }
                            key={child.path}
                            to={child.path}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium">Opero App</p>
            <p className="truncate text-xs text-muted-foreground">
              {tenantHost}
            </p>
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
