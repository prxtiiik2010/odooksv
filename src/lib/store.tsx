"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { api } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "procurement_officer" | "vendor" | "approver";
  vendorId?: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("auth");
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const { user, accessToken, refreshToken } = JSON.parse(
        stored,
      ) as StoredAuth;

      if (!user || !accessToken || !refreshToken) {
        localStorage.removeItem("auth");
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsLoading(false);
        return;
      }

      setUser(user);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setIsLoading(false);
    } catch {
      localStorage.removeItem("auth");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const stored = localStorage.getItem("auth");
    if (!stored) return false;

    try {
      const { refreshToken } = JSON.parse(stored) as StoredAuth;
      const data = await api("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
      return true;
    } catch {
      localStorage.removeItem("auth");
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      return false;
    }
  }, []);

  const login = useCallback(
    (user: User, accessToken: string, refreshToken: string) => {
      setUser(user);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem(
        "auth",
        JSON.stringify({ user, accessToken, refreshToken }),
      );
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("auth");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        refreshAccessToken,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
