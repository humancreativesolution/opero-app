import { LocalStorage } from "@/libs/storage";
import type { AuthResponse, UserResponse } from "@/graphql/generated";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";
export const AUTH_SESSION_CHANGED_EVENT = "opero:auth-session-changed";
export const AUTH_SESSION_EXPIRED_EVENT = "opero:auth-session-expired";

type JwtPayload = {
  exp?: number;
};

function emitAuthEvent(eventName: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(eventName));
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return window.atob(padded);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload || typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return LocalStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAccessTokenExpiryMs() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);

  return payload?.exp ? payload.exp * 1000 : null;
}

export function isAccessTokenExpired() {
  const expiryMs = getAccessTokenExpiryMs();

  if (!expiryMs) {
    return false;
  }

  return Date.now() >= expiryMs;
}

export function isAuthenticated() {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  if (isAccessTokenExpired()) {
    expireAuthSession();
    return false;
  }

  return true;
}

export function saveAuthSession(auth: AuthResponse) {
  LocalStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  LocalStorage.setItem(AUTH_USER_KEY, auth.user);
  emitAuthEvent(AUTH_SESSION_CHANGED_EVENT);
}

export function clearAuthSession() {
  LocalStorage.removeItem(ACCESS_TOKEN_KEY);
  LocalStorage.removeItem(AUTH_USER_KEY);
  emitAuthEvent(AUTH_SESSION_CHANGED_EVENT);
}

export function expireAuthSession() {
  const hadSession = Boolean(getAccessToken());

  clearAuthSession();

  if (hadSession) {
    emitAuthEvent(AUTH_SESSION_EXPIRED_EVENT);
  }
}

export function getAuthUser(): UserResponse | null {
  const value = LocalStorage.getItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as UserResponse;
  } catch {
    return null;
  }
}
