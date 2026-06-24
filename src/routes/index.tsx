import { Navigate, type RouteObject } from "react-router-dom";

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
import SuppliersPage from "@pages/suppliers";
import UsersPage from "@pages/users";

import { AppLayout } from "@/layouts/app/app.layout";
import { PosLayout } from "@/layouts/pos/pos.layout";
import { ProtectedRoute } from "@/routes/protected-route";
import { PublicRoute } from "@/routes/public-route";

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
      { path: "dashboard", element: <DashboardPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "promotions", element: <PromotionsPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "locations", element: <LocationsPage /> },
      { path: "purchases", element: <PurchasesPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/pos",
    element: (
      <ProtectedRoute>
        <PosLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <PosPage /> }],
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
