import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDbInstance } from "@/lib/firebase";
import type { AppUser, UserPreferences } from "@/types/user";

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteColors: [],
  preferredStyle: "casual",
  preferredFit: "regular",
  gender: "",
};

export function getUserRef(uid: string) {
  return doc(getDbInstance(), "users", uid);
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(getUserRef(uid));
  if (!snap.exists()) return null;
  return docToUser(snap.id, snap.data());
}

export async function createUser(
  uid: string,
  input: {
    email: string;
    displayName: string;
    photoURL: string;
  }
): Promise<AppUser> {
  const user: Omit<AppUser, "id"> & { createdAt: unknown } = {
    uid,
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    preferences: DEFAULT_PREFERENCES,
    createdAt: serverTimestamp(),
  };
  await setDoc(getUserRef(uid), user);
  return {
    ...user,
    uid,
    createdAt: new Date(),
  } as AppUser;
}

export async function ensureUser(
  uid: string,
  input: {
    email: string;
    displayName: string;
    photoURL: string;
  }
): Promise<AppUser> {
  const existing = await getUser(uid);
  if (existing) return existing;
  return createUser(uid, input);
}

export async function updateUserPreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const ref = getUserRef(uid);
  await setDoc(
    ref,
    {
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...preferences,
      },
    },
    { merge: true }
  );
}

export async function deleteUserData(uid: string): Promise<void> {
  // Implemented in settings/account deletion flow
  // Firestore collections under users/{uid} must be deleted separately
  // Cloud Functions or admin SDK preferred for full cleanup
  await setDoc(
    getUserRef(uid),
    {
      deletedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function docToUser(uid: string, data: Record<string, unknown>): AppUser {
  return {
    uid,
    email: (data.email as string) ?? "",
    displayName: (data.displayName as string) ?? "",
    photoURL: (data.photoURL as string) ?? "",
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(data.preferences as UserPreferences | undefined),
    },
    createdAt: timestampToDate(data.createdAt),
  };
}

function timestampToDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}
