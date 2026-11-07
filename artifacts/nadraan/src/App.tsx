import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ApiError } from "@workspace/api-client-react";
import { canAccessRoute } from "@/lib/permissions";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import OperationalCommandCenter from "@/pages/OperationalCommandCenter";
import NewOrderPage from "@/pages/new-order";
import OrdersPage from "@/pages/orders";
import ProductsPage from "@/pages/products";
import CustomersPage from "@/pages/customers";
import UsersPage from "@/pages/users";
import ProfilePage from "@/pages/profile";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({
  component: Component,
  path,
}: {
  component: React.ComponentType;
  path?: string;
}) {
  const { token, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (path && user && !canAccessRoute(user.role, path)) {
      navigate(canAccessRoute(user.role, "/") ? "/" : "/profile");
    }
  }, [token, user, path, navigate]);

  if (!token) return null;
  if (path && user && !canAccessRoute(user.role, path)) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route
        path="/"
        component={() => <ProtectedRoute component={OperationalCommandCenter} path="/" />}
      />
      <Route
        path="/dashboard"
        component={() => <ProtectedRoute component={DashboardPage} path="/dashboard" />}
      />
      <Route
        path="/new-order"
        component={() => <ProtectedRoute component={NewOrderPage} path="/new-order" />}
      />
      <Route
        path="/orders"
        component={() => <ProtectedRoute component={OrdersPage} path="/orders" />}
      />
      <Route
        path="/products"
        component={() => <ProtectedRoute component={ProductsPage} path="/products" />}
      />
      <Route
        path="/customers"
        component={() => <ProtectedRoute component={CustomersPage} path="/customers" />}
      />
      <Route
        path="/users"
        component={() => <ProtectedRoute component={UsersPage} path="/users" />}
      />
      <Route
        path="/profile"
        component={() => <ProtectedRoute component={ProfilePage} path="/profile" />}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
