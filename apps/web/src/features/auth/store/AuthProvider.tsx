import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./auth-context.js";
import { authApi } from "../api/auth.api.js";
import { authStore } from "../../../lib/auth-store.js";
import type { AuthUser } from "@campuscare/shared-types";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUser(null);
      authStore.clearTokens();
      setStatus("unauthenticated");
      toast.info("Signed out successfully.");
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      // 1. Request new access token using refresh token cookie
      await authApi.refresh();
      // 2. Fetch authenticated profile details
      const profile = await authApi.getMe();
      setUser(profile);
      setStatus("authenticated");
    } catch (err) {
      setUser(null);
      authStore.clearTokens();
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (credentials: any) => {
    setStatus("loading");
    try {
      const authUser = await authApi.login(credentials);
      setUser(authUser);
      setStatus("authenticated");
      toast.success(`Welcome back, ${authUser.firstName}!`);
    } catch (err: any) {
      setUser(null);
      authStore.clearTokens();
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  // Session Restore on initial load
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Handle global axios unauthorized callbacks
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus("unauthenticated");
      toast.error("Session expired. Please sign in again.");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
