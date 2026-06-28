interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  publicId: string;
  timestamp: number;
  signature: string;
}

async function getUploadSignature(
  uid: string,
  path: string
): Promise<UploadSignatureResponse> {
  // In a server context (API route) we can sign directly without calling the API.
  // In a browser context we call the API route to get a signed upload signature.
  if (typeof window === "undefined") {
    const { getCloudName, getApiKey, generateUploadSignature } = await import("@/lib/cloudinary");
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `users/${uid}/${path.replace(/\.[^/.]+$/, "").replace(/\//g, "_")}`;
    return {
      cloudName: getCloudName(),
      apiKey: getApiKey(),
      publicId,
      timestamp,
      signature: generateUploadSignature(publicId, timestamp),
    };
  }

  const res = await fetch("/api/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to get upload signature" }));
    throw new Error(error.error ?? "Failed to get upload signature");
  }

  return res.json();
}

export async function uploadImage(
  uid: string,
  path: string,
  blob: Blob
): Promise<string> {
  const { cloudName, apiKey, publicId, timestamp, signature } = await getUploadSignature(
    uid,
    path
  );

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("api_key", apiKey);
  formData.append("public_id", publicId);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Upload failed" } }));
    throw new Error(error.error?.message ?? "Failed to upload image");
  }

  const data = await res.json();
  return data.secure_url as string;
}

export async function deleteImage(uid: string, path: string): Promise<void> {
  const publicId = `users/${uid}/${path.replace(/\.[^/.]+$/, "").replace(/\//g, "_")}`;

  // In a server context we can delete directly; in a browser context we call the API route.
  if (typeof window === "undefined") {
    const { initCloudinary } = await import("@/lib/cloudinary");
    const cld = initCloudinary();
    await cld.uploader.destroy(publicId);
    return;
  }

  const res = await fetch("/api/delete-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete image" }));
    throw new Error(error.error ?? "Failed to delete image");
  }
}
