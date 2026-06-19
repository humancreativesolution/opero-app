import { Navigate } from "react-router-dom";

import { isAuthenticated } from "@/routes/auth";

type PublicRouteProps = {
  children: React.ReactNode;
};

export function PublicRoute({ children }: PublicRouteProps) {
  if (isAuthenticated()) {
    return <Navigate replace to="/" />;
  }

  return children;
}
