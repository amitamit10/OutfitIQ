import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from "firebase/storage";
import { getStorageInstance } from "@/lib/firebase";

export function getUserStorageRef(uid: string, path: string): StorageReference {
  return ref(getStorageInstance(), `users/${uid}/${path}`);
}

export async function uploadImage(
  uid: string,
  path: string,
  blob: Blob
): Promise<string> {
  const storageRef = getUserStorageRef(uid, path);
  const snapshot = await uploadBytes(storageRef, blob);
  return getDownloadURL(snapshot.ref);
}

export async function deleteImage(uid: string, path: string): Promise<void> {
  const storageRef = getUserStorageRef(uid, path);
  await deleteObject(storageRef);
}
