"use client";

import { ScanForm } from "@/components/clothing/ScanForm";

export default function ScanPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Clothing</h1>
        <p className="text-muted-foreground">
          Take a photo and let AI identify it, or fill in the details yourself.
        </p>
      </div>
      <ScanForm />
    </div>
  );
}
