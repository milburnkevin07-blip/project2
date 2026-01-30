import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await storage.getUser();
      setUser(storedUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (pin: string): Promise<boolean> => {
    if (user && user.pin === pin) {
      const updatedUser = { ...user, isAuthenticated: true };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
      return true;
    }
    return false;
  };

  const setupPin = async (pin: string) => {
    const newUser: User = { pin, isAuthenticated: true };
    await storage.setUser(newUser);
    setUser(newUser);
  };

  const logout = async () => {
    if (user) {
      const updatedUser = { ...user, isAuthenticated: false };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    return user?.pin === pin;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user?.isAuthenticated ?? false,
        login,
        setupPin,
        logout,
        verifyPin,
        hasPin: !!user?.pin,
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
