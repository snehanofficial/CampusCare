import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStore } from "./auth-store.js";
import { normalizeError } from "./errors.js";

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:3000/api/v1";
const TIMEOUT_MS = 15_000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token Rotation and Queuing
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If it's a 401 Unauthorized and not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue request until refresh is done
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token returned in refresh response");
        }

        authStore.setAccessToken(newAccessToken);

        // Resolve all queued requests
        pendingRequests.forEach(({ resolve }) => resolve(newAccessToken));
        pendingRequests = [];

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired or revoked)
        pendingRequests.forEach(({ reject }) => reject(refreshError));
        pendingRequests = [];
        authStore.clearTokens();
        
        // Dispatch custom event to let React App context know that auth is lost
        window.dispatchEvent(new Event("auth:unauthorized"));
        
        return Promise.reject(normalizeError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);
