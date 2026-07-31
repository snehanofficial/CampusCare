import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client.js";
import { isMockEnabled } from "../mocks/index.js";
import { logger } from "./logger.js";

export interface SdkRequestOptions<T> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  data?: any;
  params?: any;
  mockResolver?: () => Promise<T>;
}

export async function sdkRequest<T>(options: SdkRequestOptions<T>): Promise<T> {
  const { method, url, data, params, mockResolver } = options;

  if (isMockEnabled() && mockResolver) {
    logger.debug("api-sdk", `Mocking API call: ${method} ${url}`, { params, data });
    return mockResolver();
  }

  logger.debug("api-sdk", `Making real API call: ${method} ${url}`, { params, data });
  const response = await apiClient.request<any>({
    method,
    url,
    data,
    params,
  });

  // Backend response helper wraps results in { success: true, data: T }
  return response.data?.data;
}

export function useCrudList<T>(
  queryKey: readonly unknown[],
  url: string,
  filters?: Record<string, any>,
  mockResolver?: () => Promise<T[]>
) {
  return useQuery({
    queryKey: [...queryKey, filters || {}],
    queryFn: () =>
      sdkRequest<T[]>({
        method: "GET",
        url,
        params: filters,
        mockResolver,
      }),
  });
}

export function useCrudDetail<T>(
  queryKey: readonly unknown[],
  url: string,
  id: string,
  mockResolver?: () => Promise<T>
) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: () =>
      sdkRequest<T>({
        method: "GET",
        url: `${url}/${id}`,
        mockResolver,
      }),
    enabled: !!id,
  });
}

export function useCrudMutation<T, Variables = any>(
  queryKeyToInvalidate?: readonly unknown[],
  onSuccessCallback?: (data: T) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      method: "POST" | "PUT" | "PATCH" | "DELETE";
      url: string;
      data?: Variables;
      mockResolver?: () => Promise<T>;
    }) => {
      return sdkRequest<T>({
        method: variables.method,
        url: variables.url,
        data: variables.data,
        mockResolver: variables.mockResolver,
      });
    },
    onSuccess: (data) => {
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      }
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
  });
}
