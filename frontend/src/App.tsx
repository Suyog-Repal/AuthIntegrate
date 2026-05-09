import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/LoadingSpinner";

const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UserDashboard = lazy(() => import("@/pages/UserDashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Home = lazy(() => import("@/pages/Home"));

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
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* LOGIN */}
        <Route path="/login">
          {isAuthenticated ? (
            <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
          ) : (
            <Login />
          )}
        </Route>

        {/* REGISTER */}
        <Route path="/register">
          {isAuthenticated ? (
            <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
          ) : (
            <Register />
          )}
        </Route>

        {/* PASSWORD RESET */}
        <Route path="/forgot-password">
          {isAuthenticated ? (
            <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
          ) : (
            <ForgotPassword />
          )}
        </Route>

        <Route path="/reset-password">
          {isAuthenticated ? (
            <Redirect to={isAdmin ? "/dashboard/admin" : "/dashboard/user"} />
          ) : (
            <ResetPassword />
          )}
        </Route>

        {/* DASHBOARDS */}
        <Route path="/dashboard/admin">
          <ProtectedRoute component={AdminDashboard} adminOnly />
        </Route>

        <Route path="/dashboard/user">
          <ProtectedRoute component={UserDashboard} />
        </Route>

        {/* PROFILE */}
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>

        {/* ⭐ NEW — HOME LANDING PAGE */}
        <Route path="/">
          <Home />
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
