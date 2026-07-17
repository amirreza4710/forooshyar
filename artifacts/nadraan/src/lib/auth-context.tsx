import { createContext, useContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, setAuth: () => {}, logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getUser);
  const [token, setToken] = useState<string | null>(getToken);
  const queryClient = useQueryClient();

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
