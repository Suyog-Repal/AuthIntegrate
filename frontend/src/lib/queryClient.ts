import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios from "axios";
import { getApiBase } from "./api";

// Derive the API base URL: empty string in dev (Vite proxy), full Render URL in production
const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  withCredentials: true,
});

// Intercept 401s to force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthPath = error.config.url?.includes("auth/login") || 
                        error.config.url?.includes("auth/register") ||
                        error.config.url?.includes("auth/me");
      
      if (!isAuthPath) {
        // For other protected routes, a 401 means our session is dead
        queryClient.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

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
      const res = await api.get(queryKey.join("/"), {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      });
      return res.data?.success ? res.data.data : res.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        if (unauthorizedBehavior === "returnNull") return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Re-validate when coming back
      staleTime: 0, // Always stale for auth-heavy apps
      gcTime: 0,    // Don't keep in garbage collector
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
