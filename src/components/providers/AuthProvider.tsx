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
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

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
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadAppUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(getAuthInstance(), getGoogleProvider());
      await loadAppUser(result.user);
    } catch (err) {
      console.error("Google sign-in failed", err);
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

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        signInWithGoogle,
        logout,
        refreshAppUser,
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
