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
import type { ClothingItem, ClothingInput, ClothingCategory, Formality, LaundryStatus } from "@/types/clothing";

function getCollectionRef(uid: string) {
  return collection(getDbInstance(), "users", uid, "clothing");
}

function getDocRef(uid: string, itemId: string) {
  return doc(getDbInstance(), "users", uid, "clothing", itemId);
}

function timestampToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function docToClothingItem(id: string, data: Record<string, unknown>): ClothingItem {
  return {
    id,
    name: (data.name as string) ?? "",
    category: (data.category as ClothingCategory) ?? "shirt",
    subcategory: (data.subcategory as string) ?? "",
    brand: (data.brand as string | null) ?? null,
    color: (data.color as string) ?? "",
    secondaryColors: (data.secondaryColors as string[]) ?? [],
    pattern: (data.pattern as string | null) ?? null,
    season: (data.season as string[]) ?? ["all"],
    formality: (data.formality as Formality) ?? "casual",
    material: (data.material as string | null) ?? null,
    size: (data.size as string | null) ?? null,
    purchaseDate: timestampToDate(data.purchaseDate),
    purchasePrice: (data.purchasePrice as number | null) ?? null,
    currency: (data.currency as string) ?? "ILS",
    imageUrl: (data.imageUrl as string) ?? "",
    originalImageUrl: (data.originalImageUrl as string) ?? "",
    laundryStatus: (data.laundryStatus as LaundryStatus) ?? "clean",
    lastWornDate: timestampToDate(data.lastWornDate),
    wearCount: (data.wearCount as number) ?? 0,
    notes: (data.notes as string | null) ?? null,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  };
}

export async function getClothingItems(uid: string): Promise<ClothingItem[]> {
  const q = query(getCollectionRef(uid), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToClothingItem(doc.id, doc.data()));
}

export async function getClothingItem(uid: string, itemId: string): Promise<ClothingItem | null> {
  const snap = await getDoc(getDocRef(uid, itemId));
  if (!snap.exists()) return null;
  return docToClothingItem(snap.id, snap.data());
}

export async function addClothingItem(
  uid: string,
  input: ClothingInput
): Promise<ClothingItem> {
  const payload: Record<string, unknown> = {
    ...input,
    wearCount: 0,
    lastWornDate: null,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(getCollectionRef(uid), payload);
  return { ...input, id: docRef.id, wearCount: 0, lastWornDate: null, createdAt: new Date() };
}

export async function updateClothingItem(
  uid: string,
  itemId: string,
  input: Partial<ClothingInput>
): Promise<void> {
  await setDoc(
    getDocRef(uid, itemId),
    { ...input, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteClothingItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(getDocRef(uid, itemId));
}
