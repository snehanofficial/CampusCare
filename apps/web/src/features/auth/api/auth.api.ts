import { apiClient } from "../../../lib/api-client.js";
import { authStore } from "../../../lib/auth-store.js";
import type { LoginResult, AuthUser, RefreshResult } from "@campuscare/shared-types";

export const authApi = {
  login: async (credentials: any): Promise<AuthUser> => {
    const { data } = await apiClient.post<{ success: boolean; data: LoginResult }>(
      "/auth/login",
      credentials
    );
    const result = data.data;
    authStore.setAccessToken(result.accessToken);
    return result.user;
  },

  register: async (input: any): Promise<any> => {
    const { data } = await apiClient.post<{ success: boolean; data: any }>(
      "/auth/register",
      input
    );
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      authStore.clearTokens();
    }
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<{ success: boolean; data: { user: AuthUser } }>(
      "/auth/me"
    );
    return data.data.user;
  },

  refresh: async (): Promise<string> => {
    const { data } = await apiClient.post<{ success: boolean; data: RefreshResult }>(
      "/auth/refresh"
    );
    const token = data.data.accessToken;
    authStore.setAccessToken(token);
    return token;
  },

  getSessions: async (): Promise<any[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: any[] }>(
      "/auth/sessions"
    );
    return data.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.delete("/auth/sessions");
  },
};
