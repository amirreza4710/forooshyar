import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import NewOrderPage from "@/pages/new-order";
import OrdersPage from "@/pages/orders";
import ProductsPage from "@/pages/products";
import CustomersPage from "@/pages/customers";
import UsersPage from "@/pages/users";
import ProfilePage from "@/pages/profile";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, setAuth: () => {}, logout: () => {},
});

export function useAuth() { return useContext(AuthContext); }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error && (error as any).status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getUser);
  const [token, setToken] = useState<string | null>(getToken);

  function setAuth(u: AuthUser, t: string) { setUser(u); setToken(t); }

  function logout() {
    clearAuth(); setUser(null); setToken(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => { if (!token) navigate("/login"); }, [token, navigate]);
  if (!token) return null;

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
      <Route path="/"          component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/new-order" component={() => <ProtectedRoute component={NewOrderPage} />} />
      <Route path="/orders"    component={() => <ProtectedRoute component={OrdersPage} />} />
      <Route path="/products"  component={() => <ProtectedRoute component={ProductsPage} />} />
      <Route path="/customers" component={() => <ProtectedRoute component={CustomersPage} />} />
      <Route path="/users"     component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/profile"   component={() => <ProtectedRoute component={ProfilePage} />} />
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
