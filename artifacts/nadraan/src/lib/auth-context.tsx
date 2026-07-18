import { createContext, useContext, type ReactNode } from "react";
import { getUser, getToken, clearAuth, type AuthUser } from "./auth";

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setAuth: () => {},
  logout: () => {},
});

/**
 * Hook to access current auth state (user, token) and auth actions (login, logout)
 * Can be used from any component without causing import cycles
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Provider component that manages auth state
 * Typically wraps the entire app in App.tsx
 */
export function AuthProvider({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: any;
}) {
  const [user, setUser] = require("react").useState<AuthUser | null>(getUser);
  const [token, setToken] = require("react").useState<string | null>(getToken);

  function setAuthWithToken(u: AuthUser, t: string) {
    setUser(u);
    setToken(t);
  }

  function logout() {
    clearAuth();
    setUser(null);
    setToken(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setAuth: setAuthWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
