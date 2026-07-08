import { Navigate, type RouteObject } from "react-router-dom";

import AuditLogsPage from "@pages/audit-logs";
import CashierShiftsPage from "@pages/cashier-shifts";
import CustomersPage from "@pages/customers";
import DashboardPage from "@pages/dashboard";
import InventoryPage from "@pages/inventory";
import LocationsPage from "@pages/locations";
import LoginPage from "@pages/login";
import NotFound from "@pages/not-found";
import PosPage from "@pages/pos";
import ProductsPage from "@pages/products";
import PromotionsPage from "@pages/promotions";
import PurchasesPage from "@pages/purchases";
import ReportsPage from "@pages/reports";
import SalesPage from "@pages/sales";
import SettingsPage from "@pages/settings";
import StockOpnamesPage from "@pages/stock-opnames";
import SuppliersPage from "@pages/suppliers";
import UnitsPage from "@pages/units";
import UsersPage from "@pages/users";

import { PERMISSIONS } from "@/components/rbac/permissions";
import { withPermission } from "@/components/rbac/with-permission";
import { AppLayout } from "@/layouts/app/app.layout";
import { PosLayout } from "@/layouts/pos/pos.layout";
import { ProtectedRoute } from "@/routes/protected-route";
import { PublicRoute } from "@/routes/public-route";

const DashboardRoute = withPermission(DashboardPage, {
  anyOf: [PERMISSIONS.dashboard.view, PERMISSIONS.reports.view],
});
const ProductsRoute = withPermission(ProductsPage, {
  anyOf: [PERMISSIONS.products.read],
});
const PromotionsRoute = withPermission(PromotionsPage, {
  anyOf: [PERMISSIONS.promotions.read],
});
const CustomersRoute = withPermission(CustomersPage, {
  anyOf: [PERMISSIONS.customers.read],
});
const SalesRoute = withPermission(SalesPage, {
  anyOf: [PERMISSIONS.receipt.view, PERMISSIONS.reports.view],
});
const CashierShiftsRoute = withPermission(CashierShiftsPage, {
  anyOf: [PERMISSIONS.reports.view],
});
const SuppliersRoute = withPermission(SuppliersPage, {
  anyOf: [PERMISSIONS.suppliers.read],
});
const LocationsRoute = withPermission(LocationsPage, {
  anyOf: [PERMISSIONS.locations.read],
});
const UnitsRoute = withPermission(UnitsPage, {
  anyOf: [PERMISSIONS.units.read],
});
const PurchasesRoute = withPermission(PurchasesPage, {
  anyOf: [PERMISSIONS.purchases.read],
});
const InventoryRoute = withPermission(InventoryPage, {
  anyOf: [PERMISSIONS.stock.read],
});
const StockOpnamesRoute = withPermission(StockOpnamesPage, {
  anyOf: [PERMISSIONS.stock.read],
});
const ReportsRoute = withPermission(ReportsPage, {
  anyOf: [PERMISSIONS.reports.view],
});
const AuditLogsRoute = withPermission(AuditLogsPage, {
  anyOf: [PERMISSIONS.reports.view],
});
const StaffRoute = withPermission(() => <UsersPage view="staff" />, {
  anyOf: [PERMISSIONS.users.read],
});
const RolesRoute = withPermission(() => <UsersPage view="roles" />, {
  anyOf: [PERMISSIONS.roles.read],
});
const SettingsRoute = withPermission(SettingsPage, {
  anyOf: [PERMISSIONS.settings.read, PERMISSIONS.settings.update],
});
const PosRoute = withPermission(PosPage, {
  anyOf: [PERMISSIONS.pos.access],
});

const routes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: "dashboard", element: <DashboardRoute /> },
      { path: "products", element: <ProductsRoute /> },
      { path: "promotions", element: <PromotionsRoute /> },
      { path: "customers", element: <CustomersRoute /> },
      { path: "sales", element: <SalesRoute /> },
      { path: "cashier-shifts", element: <CashierShiftsRoute /> },
      { path: "suppliers", element: <SuppliersRoute /> },
      { path: "locations", element: <LocationsRoute /> },
      { path: "units", element: <UnitsRoute /> },
      { path: "purchases", element: <PurchasesRoute /> },
      { path: "inventory", element: <InventoryRoute /> },
      { path: "stock-opnames", element: <StockOpnamesRoute /> },
      { path: "reports", element: <ReportsRoute /> },
      { path: "audit-logs", element: <AuditLogsRoute /> },
      {
        path: "users",
        children: [
          { index: true, element: <Navigate replace to="/users/staff" /> },
          { path: "staff", element: <StaffRoute /> },
          { path: "roles", element: <RolesRoute /> },
        ],
      },
      { path: "settings", element: <SettingsRoute /> },
    ],
  },
  {
    path: "/pos",
    element: (
      <ProtectedRoute>
        <PosLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <PosRoute /> }],
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/*",
    element: <NotFound />,
  },
] satisfies RouteObject[];

export default routes;
