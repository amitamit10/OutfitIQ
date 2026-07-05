"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { getAuthInstance, getGoogleProvider } from "@/lib/firebase";
import { ensureUser, getUser } from "@/lib/user";
import type { AppUser } from "@/types/user";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadAppUser = useCallback(async (user: User) => {
    const existing = await getUser(user.uid);
    if (existing) {
      setAppUser(existing);
      return;
    }
    const created = await ensureUser(user.uid, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
    });
    setAppUser(created);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await loadAppUser(user);
        } catch (err) {
          console.error("Failed to load app user", err);
          setAuthError(
            err instanceof Error
              ? err.message
              : "Failed to load your profile. Please try again."
          );
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadAppUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(getAuthInstance(), getGoogleProvider());
      await loadAppUser(result.user);
    } catch (err) {
      console.error("Google sign-in failed", err);
      let message = "Sign-in failed. Please try again.";
      if (err instanceof Error) {
        if (err.message.includes("popup-closed-by-user")) {
          message = "Sign-in popup was closed. Please try again.";
        } else if (err.message.includes("network")) {
          message = "Network error. Check your connection and try again.";
        } else if (err.message.includes("unauthorized-domain")) {
          message = "This domain is not authorized for sign-in.";
        } else {
          message = err.message;
        }
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }, [loadAppUser]);

  const logout = useCallback(async () => {
    await signOut(getAuthInstance());
    setAppUser(null);
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (!firebaseUser) return;
    const refreshed = await getUser(firebaseUser.uid);
    if (refreshed) setAppUser(refreshed);
  }, [firebaseUser]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        authLoading,
        authError,
        signInWithGoogle,
        logout,
        refreshAppUser,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
