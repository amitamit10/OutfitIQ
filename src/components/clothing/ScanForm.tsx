"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/AuthProvider";
import { removeBackground, blobToDataUrl, fileToDataUrl } from "@/lib/bg-removal";
import { uploadImage } from "@/lib/storage";
import { addClothingItem } from "@/lib/wardrobe";
import { ClothingForm } from "./ClothingForm";
import type { ClothingInput } from "@/types/clothing";
import { Camera, Upload, RefreshCw, AlertCircle } from "lucide-react";

type ScanStep = "upload" | "removing-bg" | "classifying" | "confirm" | "saving";

interface AiResult {
  name: string;
  category: string;
  subcategory: string;
  brand: string | null;
  color: string;
  secondaryColors: string[];
  pattern: string | null;
  season: string[];
  formality: string;
  material: string | null;
  size: string | null;
  confidence?: number;
}

export function ScanForm() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ScanStep>("upload");
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!firebaseUser) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setStep("removing-bg");
    setProgress(10);

    try {
      const original = await fileToDataUrl(file);
      setOriginalDataUrl(original);
      setProgress(30);

      const processedBlob = await removeBackground(file);
      const processed = await blobToDataUrl(processedBlob);
      setProcessedDataUrl(processed);
      setProgress(60);

      setStep("classifying");
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: processed }),
      });

      if (!res.ok) {
        throw new Error("AI classification failed");
      }

      const json = await res.json();
      setAiResult(json.result);
      setStep("confirm");
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to process image"
      );
      // Allow manual entry fallback by showing confirm step without AI data
      setStep("confirm");
      setProgress(100);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onCapture = () => {
    fileInputRef.current?.click();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = async (data: ClothingInput) => {
    setStep("saving");
    try {
      if (!processedDataUrl || !originalDataUrl) return;

      const processedBlob = await fetch(processedDataUrl).then((r) => r.blob());
      const originalBlob = await fetch(originalDataUrl).then((r) => r.blob());

      const timestamp = Date.now();
      const imageUrl = await uploadImage(
        firebaseUser.uid,
        `clothing/${timestamp}_processed.png`,
        processedBlob
      );
      const originalImageUrl = await uploadImage(
        firebaseUser.uid,
        `clothing/${timestamp}_original.png`,
        originalBlob
      );

      await addClothingItem(firebaseUser.uid, {
        ...data,
        imageUrl,
        originalImageUrl,
      });

      router.push("/wardrobe");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save item");
      setStep("confirm");
    }
  };

  if (step === "upload") {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={onCapture}
          >
            <div className="flex justify-center gap-4">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Tap to take a photo or drop an image</p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG up to 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "removing-bg" || step === "classifying" || step === "saving") {
    return (
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="font-medium">
            {step === "removing-bg" && "Removing background..."}
            {step === "classifying" && "AI is analyzing the item..."}
            {step === "saving" && "Saving to your wardrobe..."}
          </p>
          <Progress value={progress} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}. You can fill in the details manually below.
        </div>
      )}
      <ClothingForm
        initialData={{
          name: aiResult?.name,
          category: aiResult?.category as ClothingInput["category"],
          subcategory: aiResult?.subcategory,
          brand: aiResult?.brand,
          color: aiResult?.color,
          secondaryColors: aiResult?.secondaryColors,
          pattern: aiResult?.pattern,
          season: aiResult?.season,
          formality: aiResult?.formality as ClothingInput["formality"],
          material: aiResult?.material,
          size: aiResult?.size,
        }}
        imageUrl={processedDataUrl ?? originalDataUrl ?? ""}
        onSubmit={handleSave}
        onCancel={() => setStep("upload")}
        submitLabel="Save to Wardrobe"
      />
    </div>
  );
}
