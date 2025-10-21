import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/LoadingSpinner";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import Profile from "@/pages/Profile";

function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Redirect to="/dashboard/user" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? (
          <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
        ) : (
          <Login />
        )}
      </Route>
      <Route path="/register">
        {isAuthenticated ? (
          <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
        ) : (
          <Register />
        )}
      </Route>
      <Route path="/dashboard/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/dashboard/user">
        <ProtectedRoute component={UserDashboard} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
