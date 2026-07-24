import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { GRAPHQL_FORBIDDEN_EVENT } from "@/libs/graphql";
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
  expireAuthSession,
  getAccessTokenExpiryMs,
  isAuthenticated,
} from "@/routes/auth";

const EXPIRY_TIMER_BUFFER_MS = 500;

export function AuthSessionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: number | undefined;

    function redirectToLogin() {
      if (window.location.pathname !== "/login") {
        toast.error("Session expired", {
          description: "Please login again to continue.",
        });
        navigate("/login", { replace: true });
      }
    }

    function scheduleExpiryCheck() {
      window.clearTimeout(timeoutId);

      if (!isAuthenticated()) {
        return;
      }

      const expiryMs = getAccessTokenExpiryMs();

      if (!expiryMs) {
        return;
      }

      const delay = Math.max(expiryMs - Date.now() + EXPIRY_TIMER_BUFFER_MS, 0);

      timeoutId = window.setTimeout(() => {
        expireAuthSession();
      }, delay);
    }

    function showForbiddenAlert() {
      toast.error("You don't have access", {
        description: "Your role does not have permission for this action.",
        id: "graphql-forbidden",
      });
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, scheduleExpiryCheck);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, redirectToLogin);
    window.addEventListener(GRAPHQL_FORBIDDEN_EVENT, showForbiddenAlert);
    scheduleExpiryCheck();

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, scheduleExpiryCheck);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, redirectToLogin);
      window.removeEventListener(GRAPHQL_FORBIDDEN_EVENT, showForbiddenAlert);
    };
  }, [navigate]);

  return null;
}
