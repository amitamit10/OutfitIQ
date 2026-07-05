"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  removeBackground,
  blobToDataUrl,
  fileToDataUrl,
  scaleImageIfNeeded,
  preloadBackgroundRemoval,
} from "@/lib/bg-removal";
import { uploadImage } from "@/lib/storage";
import { addClothingItem } from "@/lib/wardrobe";
import { ClothingForm } from "./ClothingForm";
import type { ClothingInput } from "@/types/clothing";
import {
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  Search,
  Check,
  LinkIcon,
  Download,
  ImagePlus,
  ShoppingBag,
} from "lucide-react";

type ScanStep = "upload" | "scaling" | "removing-bg" | "classifying" | "confirm" | "saving";

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

interface SearchResult {
  id: string;
  url: string;
  thumb: string;
  alt: string;
}

/** Compress a data URL to fit within Groq's 4MB base64 limit. */
async function compressDataUrl(dataUrl: string, maxBytes = 3_500_000): Promise<string> {
  const base64Size = Math.round((dataUrl.length * 3) / 4);
  if (base64Size <= maxBytes) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      let quality = 0.8;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      const tryCompress = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const result = canvas.toDataURL("image/jpeg", quality);
        const size = Math.round((result.length * 3) / 4);

        if (size <= maxBytes || quality <= 0.1) {
          resolve(result);
        } else if (quality > 0.2) {
          quality -= 0.1;
          tryCompress();
        } else {
          w = Math.round(w * 0.7);
          h = Math.round(h * 0.7);
          quality = 0.8;
          tryCompress();
        }
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Failed to decode image for compression"));
    img.src = dataUrl;
  });
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
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fallback image search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStockUrl, setSelectedStockUrl] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");

  // Preload the bg-removal model when the scan page mounts.
  useEffect(() => {
    preloadBackgroundRemoval().catch((err) =>
      console.warn("BG removal preload failed (non-fatal)", err)
    );
  }, []);

  const isUploading = step === "scaling" || step === "removing-bg" || step === "classifying";
  const isProcessing = isUploading || step === "saving";

  // --- Core upload + AI flow ---
  const handleFile = async (file: File) => {
    if (!firebaseUser) return;
    setError(null);
    setSearchResults([]);
    setProgress(0);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();

    try {
      setStep("scaling");
      setProgressLabel("Scaling image...");
      setProgress(10);

      const scaled = await scaleImageIfNeeded(file);
      const original = await fileToDataUrl(file);
      setOriginalDataUrl(original);
      setProgress(20);

      setStep("removing-bg");
      setProgressLabel("Removing background...");
      const processedBlob = await removeBackground(scaled, (p) => {
        const offset = p.stage === "downloading" ? 0 : p.stage === "computing" ? 10 : 20;
        setProgress(Math.min(60, 20 + offset + Math.round(p.progress * 0.4)));
        setProgressLabel(
          p.stage === "downloading"
            ? "Downloading AI model..."
            : p.stage === "computing"
            ? "Removing background..."
            : "Encoding result..."
        );
      });
      const processed = await blobToDataUrl(processedBlob);
      setProcessedDataUrl(processed);
      setProgress(60);

      // Compress for Groq API (4MB base64 limit)
      const compressedForApi = await compressDataUrl(processed);
      setProgress(65);

      setStep("classifying");
      setProgressLabel("AI is analyzing the item...");
      setProgress(70);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: compressedForApi }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "AI classification failed");
      }

      const json = await res.json();
      setAiResult(json.result);
      setStep("confirm");
      setProgress(100);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to process image";
      setError(msg);
      setStep("confirm");
      setProgress(100);

      // Auto-trigger fallback image search. Classification failed here, so
      // aiResult is still null — derive the query from the file name instead.
      // Use the local cleanName (state `fileName` hasn't flushed yet this tick).
      const query = cleanName.length > 1 ? cleanName : "clothing item";
      setSearchQuery(query);
      setTimeout(() => handleSearchOnline(query), 0);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onCapture = () => fileInputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // --- Fallback: search online ---
  const handleSearchOnline = async (overrideQuery?: string) => {
    if (!firebaseUser) return;
    const q = overrideQuery ?? searchQuery;
    if (!q.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(
        `/api/search-image?q=${encodeURIComponent(q.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
      if (data.results?.length === 0 && data.fallback?.googleImagesUrl) {
        window.open(data.fallback.googleImagesUrl, "_blank", "noopener");
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUseStockPhoto = async (url: string) => {
    setError(null);
    setStep("scaling");
    setProgressLabel("Downloading image...");
    setProgress(30);
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const dataUrl = await blobToDataUrl(blob);
      setOriginalDataUrl(dataUrl);
      setProcessedDataUrl(dataUrl);
      setSelectedStockUrl(url);
      setProgress(80);
      setStep("confirm");
      setProgress(100);
    } catch {
      setError("Failed to download the selected image.");
      setStep("confirm");
    }
  };

  const handleUsePastedUrl = async () => {
    const url = pasteUrl.trim();
    if (!url || !url.startsWith("http")) return;
    setPasteUrl("");
    await handleUseStockPhoto(url);
  };

  // --- Save ---
  const handleSave = async (data: ClothingInput) => {
    if (!firebaseUser) return;

    // Guard before showing the saving spinner so we never get stuck on it.
    const imageSource = processedDataUrl || selectedStockUrl || originalDataUrl;
    if (!imageSource) {
      setError("No image available to save. Please upload a photo or pick one online.");
      setStep("confirm");
      return;
    }

    setStep("saving");
    setProgress(0);
    setProgressLabel("Saving to your wardrobe...");
    try {
      const imageBlob = await fetch(imageSource).then((r) => r.blob());
      setProgress(30);

      const timestamp = Date.now();
      const imageUrl = await uploadImage(firebaseUser.uid, `clothing/${timestamp}_processed.png`, imageBlob);
      setProgress(70);

      let originalImageUrl = imageUrl;
      if (originalDataUrl && originalDataUrl !== imageSource) {
        const originalBlob = await fetch(originalDataUrl).then((r) => r.blob());
        originalImageUrl = await uploadImage(firebaseUser.uid, `clothing/${timestamp}_original.png`, originalBlob);
      }
      setProgress(90);

      await addClothingItem(firebaseUser.uid, { ...data, imageUrl, originalImageUrl });
      setProgress(100);
      router.push("/wardrobe");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save item");
      setStep("confirm");
    }
  };

  if (!firebaseUser) return null;

  // --- Render: Upload zone ---
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
              <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
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

  // --- Render: Processing ---
  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="font-medium">{progressLabel || "Processing..."}</p>
          <Progress value={progress} />
        </CardContent>
      </Card>
    );
  }

  // --- Render: Confirm + fallback search ---
  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Pick a photo for this item</h3>
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t identify the item automatically. Search for a stock photo, paste an image URL, or fill in the details below.
                </p>
                {error !== "AI classification failed" && (
                  <p className="text-xs text-muted-foreground mt-1">Reason: {error}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. blue denim jacket"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchOnline(searchQuery)}
                  className="flex-1"
                />
                <Button variant="default" size="sm" onClick={() => handleSearchOnline(searchQuery)} disabled={searching || !searchQuery.trim()}>
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleUseStockPhoto(r.url)}
                      disabled={isProcessing}
                      className="flex-shrink-0 w-24 text-center space-y-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                    >
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                        <Image src={r.thumb} alt={r.alt} fill sizes="96px" className="object-cover" />
                        {selectedStockUrl === r.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Or paste any image URL"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => e.key === "Enter" && handleUsePastedUrl()}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleUsePastedUrl} disabled={!pasteUrl.trim().startsWith("http")}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processedDataUrl && !error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden relative shrink-0">
                <Image src={processedDataUrl} alt="Processed item" fill sizes="80px" className="object-contain p-2" />
              </div>
              <div>
                <p className="font-medium text-sm">Image ready</p>
                <p className="text-xs text-muted-foreground">{selectedStockUrl ? "Stock photo" : "Background removed"}</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setStep("upload"); setError(null); setSearchResults([]); setProcessedDataUrl(null); setOriginalDataUrl(null); setSelectedStockUrl(null); setAiResult(null); }}>
                <ImagePlus className="h-4 w-4 mr-1" /> Retake
              </Button>
            </div>
          </CardContent>
        </Card>
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
        onCancel={() => { setStep("upload"); setError(null); setSearchResults([]); }}
        submitLabel="Save to Wardrobe"
      />
    </div>
  );
}
