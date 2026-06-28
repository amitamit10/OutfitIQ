import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { getDbInstance } from "@/lib/firebase";

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface CoachMessageInput {
  role: "user" | "assistant";
  content: string;
}

function getCollectionRef(uid: string) {
  return collection(getDbInstance(), "users", uid, "coachMessages");
}

function timestampToDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

export async function getCoachMessages(
  uid: string,
  messageLimit = 50
): Promise<CoachMessage[]> {
  const q = query(
    getCollectionRef(uid),
    orderBy("createdAt", "asc"),
    limit(messageLimit)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    role: doc.data().role as "user" | "assistant",
    content: doc.data().content as string,
    createdAt: timestampToDate(doc.data().createdAt),
  }));
}

export async function addCoachMessage(
  uid: string,
  input: CoachMessageInput
): Promise<CoachMessage> {
  const payload = {
    ...input,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(getCollectionRef(uid), payload);
  return {
    id: docRef.id,
    role: input.role,
    content: input.content,
    createdAt: new Date(),
  };
}
