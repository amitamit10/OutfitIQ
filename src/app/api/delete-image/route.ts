import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { initCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { publicId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const publicId = body.publicId;
  if (!publicId || !publicId.startsWith(`users/${uid}/`)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }

  try {
    const cld = initCloudinary();
    const result = await cld.uploader.destroy(publicId);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
