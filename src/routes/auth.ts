import { LocalStorage } from "@/libs/storage";
import type { AuthResponse, UserResponse } from "@/graphql/generated";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";

export function isAuthenticated() {
  return Boolean(LocalStorage.getItem(ACCESS_TOKEN_KEY));
}

export function saveAuthSession(auth: AuthResponse) {
  LocalStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  LocalStorage.setItem(AUTH_USER_KEY, auth.user);
}

export function clearAuthSession() {
  LocalStorage.removeItem(ACCESS_TOKEN_KEY);
  LocalStorage.removeItem(AUTH_USER_KEY);
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
