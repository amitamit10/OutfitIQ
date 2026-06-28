import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDbInstance } from "@/lib/firebase";
import type { Outfit, OutfitInput, WearHistoryEntry, OutfitScheduleEntry } from "@/types/outfit";

function getOutfitsCollection(uid: string) {
  return collection(getDbInstance(), "users", uid, "outfits");
}

function getOutfitDoc(uid: string, outfitId: string) {
  return doc(getDbInstance(), "users", uid, "outfits", outfitId);
}

function getWearHistoryCollection(uid: string) {
  return collection(getDbInstance(), "users", uid, "wearHistory");
}

function getScheduleCollection(uid: string) {
  return collection(getDbInstance(), "users", uid, "outfitSchedule");
}

function timestampToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function docToOutfit(id: string, data: Record<string, unknown>): Outfit {
  return {
    id,
    name: (data.name as string) ?? "",
    itemIds: (data.itemIds as string[]) ?? [],
    occasion: (data.occasion as string | null) ?? null,
    isFavorite: (data.isFavorite as boolean) ?? false,
    rating: (data.rating as number | null) ?? null,
    lastWornDate: timestampToDate(data.lastWornDate),
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  };
}

export async function getOutfits(uid: string): Promise<Outfit[]> {
  const q = query(getOutfitsCollection(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToOutfit(doc.id, doc.data()));
}

export async function getOutfit(uid: string, outfitId: string): Promise<Outfit | null> {
  const snap = await getDoc(getOutfitDoc(uid, outfitId));
  if (!snap.exists()) return null;
  return docToOutfit(snap.id, snap.data());
}

export async function addOutfit(uid: string, input: OutfitInput): Promise<Outfit> {
  const payload: Record<string, unknown> = {
    ...input,
    isFavorite: input.isFavorite ?? false,
    rating: input.rating ?? null,
    lastWornDate: null,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(getOutfitsCollection(uid), payload);
  return {
    ...input,
    id: docRef.id,
    isFavorite: input.isFavorite ?? false,
    rating: input.rating ?? null,
    lastWornDate: null,
    createdAt: new Date(),
  };
}

export async function updateOutfit(
  uid: string,
  outfitId: string,
  input: Partial<OutfitInput>
): Promise<void> {
  await setDoc(
    getOutfitDoc(uid, outfitId),
    { ...input, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteOutfit(uid: string, outfitId: string): Promise<void> {
  await deleteDoc(getOutfitDoc(uid, outfitId));
}

export async function logWearEvent(
  uid: string,
  itemIds: string[],
  outfitId: string | null,
  date: Date
): Promise<void> {
  const batchPromises: Promise<unknown>[] = [];
  const dateString = date.toISOString().split("T")[0];

  for (const itemId of itemIds) {
    batchPromises.push(
      addDoc(getWearHistoryCollection(uid), {
        itemId,
        outfitId,
        wornDate: date,
      })
    );
  }

  if (outfitId) {
    batchPromises.push(
      setDoc(
        getOutfitDoc(uid, outfitId),
        { lastWornDate: date },
        { merge: true }
      )
    );
  }

  await Promise.all(batchPromises);
}

export async function getWearHistory(uid: string): Promise<WearHistoryEntry[]> {
  const q = query(getWearHistoryCollection(uid), orderBy("wornDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    itemId: doc.data().itemId as string,
    outfitId: (doc.data().outfitId as string | null) ?? null,
    wornDate: timestampToDate(doc.data().wornDate) ?? new Date(),
  }));
}

export async function getRecentWornItemIds(uid: string, days: number): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const q = query(
    getWearHistoryCollection(uid),
    where("wornDate", ">=", cutoff),
    orderBy("wornDate", "desc")
  );
  const snapshot = await getDocs(q);
  const ids = new Set<string>();
  snapshot.docs.forEach((doc) => ids.add(doc.data().itemId as string));
  return Array.from(ids);
}

export async function getScheduleForDate(
  uid: string,
  date: string
): Promise<OutfitScheduleEntry | null> {
  const snap = await getDoc(doc(getScheduleCollection(uid), date));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    date,
    outfitId: data.outfitId as string,
    occasion: (data.occasion as string | null) ?? null,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  };
}

export async function setScheduleOutfit(
  uid: string,
  date: string,
  outfitId: string,
  occasion: string | null
): Promise<void> {
  await setDoc(doc(getScheduleCollection(uid), date), {
    outfitId,
    occasion,
    createdAt: serverTimestamp(),
  });
}

export async function getScheduleRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<OutfitScheduleEntry[]> {
  const q = query(
    getScheduleCollection(uid),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    date: doc.id,
    outfitId: doc.data().outfitId as string,
    occasion: (doc.data().occasion as string | null) ?? null,
    createdAt: timestampToDate(doc.data().createdAt) ?? new Date(),
  }));
}
