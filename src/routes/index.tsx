import { Navigate, type RouteObject } from "react-router-dom";

import DashboardPage from "@pages/dashboard";
import InventoryPage from "@pages/inventory";
import LoginPage from "@pages/login";
import NotFound from "@pages/not-found";
import PosPage from "@pages/pos";
import ProductsPage from "@pages/products";
import PurchasesPage from "@pages/purchases";
import ReportsPage from "@pages/reports";
import SettingsPage from "@pages/settings";
import SuppliersPage from "@pages/suppliers";
import UsersPage from "@pages/users";

import { AppLayout } from "@/layouts/app/AppLayout";
import { PosLayout } from "@/layouts/pos/PosLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";

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
      { path: "suppliers", element: <SuppliersPage /> },
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
