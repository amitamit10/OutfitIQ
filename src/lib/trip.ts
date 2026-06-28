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
} from "firebase/firestore";
import { getDbInstance } from "@/lib/firebase";
import { eachDayOfInterval, format } from "date-fns";
import type { Trip, TripInput, PackingItem } from "@/types/trip";
import type { ClothingItem } from "@/types/clothing";

function getCollectionRef(uid: string) {
  return collection(getDbInstance(), "users", uid, "trips");
}

function getDocRef(uid: string, tripId: string) {
  return doc(getDbInstance(), "users", uid, "trips", tripId);
}

function timestampToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function docToTrip(id: string, data: Record<string, unknown>): Trip {
  return {
    id,
    destination: (data.destination as string) ?? "",
    startDate: timestampToDate(data.startDate) ?? new Date(),
    endDate: timestampToDate(data.endDate) ?? new Date(),
    purpose: (data.purpose as string) ?? "vacation",
    packingList: (data.packingList as PackingItem[]) ?? [],
    dailyOutfits: (data.dailyOutfits as { date: string; outfitId: string | null }[]) ?? [],
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  };
}

export async function getTrips(uid: string): Promise<Trip[]> {
  const q = query(getCollectionRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToTrip(doc.id, doc.data()));
}

export async function getTrip(uid: string, tripId: string): Promise<Trip | null> {
  const snap = await getDoc(getDocRef(uid, tripId));
  if (!snap.exists()) return null;
  return docToTrip(snap.id, snap.data());
}

export async function addTrip(uid: string, input: TripInput): Promise<Trip> {
  const days = eachDayOfInterval({ start: input.startDate, end: input.endDate });
  const packingList = generatePackingList(days.length, input.purpose);

  const payload: Record<string, unknown> = {
    ...input,
    packingList,
    dailyOutfits: days.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      outfitId: null,
    })),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getCollectionRef(uid), payload);
  return {
    ...input,
    id: docRef.id,
    packingList,
    dailyOutfits: days.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      outfitId: null,
    })),
    createdAt: new Date(),
  };
}

export async function updateTrip(
  uid: string,
  tripId: string,
  updates: Partial<Trip>
): Promise<void> {
  await setDoc(
    getDocRef(uid, tripId),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteTrip(uid: string, tripId: string): Promise<void> {
  await deleteDoc(getDocRef(uid, tripId));
}

function generatePackingList(days: number, purpose: string): PackingItem[] {
  const isFormal = purpose === "business";
  const list: PackingItem[] = [
    { itemId: null, category: "shirt", quantity: days, packed: false },
    { itemId: null, category: "pants", quantity: Math.max(1, Math.ceil(days / 3)), packed: false },
    { itemId: null, category: "socks", quantity: days, packed: false },
    { itemId: null, category: "underwear", quantity: days, packed: false },
    { itemId: null, category: "shoes", quantity: isFormal ? 2 : 1, packed: false },
  ];

  if (isFormal) {
    list.push({ itemId: null, category: "jacket", quantity: 1, packed: false });
  }

  list.push({ itemId: null, category: "accessory", quantity: 1, packed: false });

  return list;
}

export function assignItemsToPackingList(
  list: PackingItem[],
  items: ClothingItem[]
): PackingItem[] {
  const available = [...items];
  return list.map((slot) => {
    const match = available.find((item) => item.category === slot.category);
    if (match) {
      const index = available.indexOf(match);
      available.splice(index, 1);
      return { ...slot, itemId: match.id };
    }
    return slot;
  });
}
