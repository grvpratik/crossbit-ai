import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "~/features/auth/auth-client";

// Define the actual session type based on what better-auth returns
type AuthSession = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
} | null;

interface AuthContextType {
  session: AuthSession;
  isPending: boolean;
  error: Error | null;
  signIn: typeof authClient.signIn;
  signOut: typeof authClient.signOut;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error } = authClient.useSession();

  const value: AuthContextType = {
    session,
    isPending,
    error,
    signIn: authClient.signIn,
    signOut: authClient.signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Loading component for auth states
export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
export function ProtectedRoute({ 
  children, 
  fallback = <AuthLoading />,
  redirectTo = "/login"
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}) {
  const { session, isPending } = useAuth();

  useEffect(() => {
    if (!isPending && !session) {
     
      window.location.href = redirectTo;
    }
  }, [session, isPending, redirectTo]);

  if (isPending) {
    return <>{fallback}</>;
  }

  if (!session) {
    return null; 
  }

  return <>{children}</>;
}
