import { AxiosError } from "axios";
import type { ApiErrorResponse } from "@campuscare/shared-types";

export interface AppError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export function normalizeError(error: any): AppError {
  if (error && error.code && error.message && typeof error.status === "number") {
    // Already normalized
    return error;
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError.response) {
    const apiError = axiosError.response.data?.error;
    return {
      code: apiError?.code ?? "SERVER_ERROR",
      message: apiError?.message ?? "An unexpected error occurred",
      status: axiosError.response.status,
      details: apiError?.details,
    };
  }

  if (axiosError.request) {
    return {
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Please check your internet connection.",
      status: 0,
    };
  }

  return {
    code: "CLIENT_ERROR",
    message: error.message ?? "A client-side error occurred",
    status: 0,
  };
}
