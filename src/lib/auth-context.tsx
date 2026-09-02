"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { Session } from "next-auth";

interface BuildMeSession extends Session {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: "engineer" | "homeowner";
  };
}

interface AuthContextType {
  session: BuildMeSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isEngineer: boolean;
  isHomeowner: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "loading",
  isEngineer: false,
  isHomeowner: false,
});

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const buildMeSession = session as BuildMeSession | null;

  return (
    <AuthContext.Provider
      value={{
        session: buildMeSession,
        status,
        isEngineer: buildMeSession?.user?.role === "engineer",
        isHomeowner: buildMeSession?.user?.role === "homeowner",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </NextAuthSessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
