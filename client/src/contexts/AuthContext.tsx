import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile, UserWithProfile } from "@shared/schema";

interface AuthContextType {
  user: UserWithProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserWithProfile | undefined>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: user, isLoading, refetch } = useQuery<UserWithProfile>({
    queryKey: ["auth/me"],
    enabled: isInitialized,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return apiRequest("POST", "auth/login", { email, password });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const login = async (email: string, password: string) => {
    try {
      // Step 1: Send login credentials to server
      await loginMutation.mutateAsync({ email, password });
      
      // Step 2: Invalidate the auth/me query to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["auth/me"] });
      
      // Step 3: Refetch the updated user profile with new session
      const result = await refetch();
      
      // Step 4: Verify the user data was successfully retrieved
      if (result.isError || !result.data) {
        const errorMessage = result.error instanceof Error ? result.error.message : "Failed to fetch user profile after login";
        throw new Error(errorMessage || "Authentication failed. Please try again.");
      }
      
      return result.data;
    } catch (error: any) {
      // Clear any partial auth state on error
      queryClient.removeQueries({ queryKey: ["auth/me"] });
      throw error;
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
