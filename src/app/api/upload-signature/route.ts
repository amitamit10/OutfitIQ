import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getCloudName, getApiKey, generateUploadSignature } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const path = body.path;
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const publicId = `users/${uid}/${path.replace(/\.[^/.]+$/, "").replace(/\//g, "_")}`;
  const timestamp = Math.round(Date.now() / 1000);

  try {
    const signature = generateUploadSignature(publicId, timestamp);
    return NextResponse.json({
      cloudName: getCloudName(),
      apiKey: getApiKey(),
      publicId,
      timestamp,
      signature,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate signature";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
