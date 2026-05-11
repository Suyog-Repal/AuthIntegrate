import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios from "axios";
import { getApiBase } from "./api";

// Derive the API base URL: empty string in dev (Vite proxy), full Render URL in production
const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  withCredentials: true,
});

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<any> {
  const response = await api.request({ method, url, data });
  return response.data;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await api.get(queryKey.join("/"));
      return res.data?.success ? res.data.data : res.data;
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
