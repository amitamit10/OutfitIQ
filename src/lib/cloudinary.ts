import { v2 as cloudinary } from "cloudinary";

export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function getCloudName(): string {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!name) throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
  return name;
}

export function getApiKey(): string {
  const key = process.env.CLOUDINARY_API_KEY ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  if (!key) throw new Error("CLOUDINARY_API_KEY is not configured");
  return key;
}

export function generateUploadSignature(publicId: string, timestamp: number): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error("CLOUDINARY_API_SECRET is not configured");

  const paramsToSign = {
    public_id: publicId,
    timestamp: String(timestamp),
  };

  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}
