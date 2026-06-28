import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdminApp } from "@/lib/firebase-admin";

export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    initAdminApp();
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    console.error("Auth verification failed", err);
    return null;
  }
}
