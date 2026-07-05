/**
 * Client-side background removal wrapper.
 *
 * Call preloadBackgroundRemoval() on scan page mount so the WASM model
 * downloads while the user reads the page. By the time they select a photo,
 * the model is already compiled and ready.
 */

export type ImageSource = string | Blob;

export interface RemovalProgress {
  stage: "downloading" | "computing" | "encoding";
  progress: number; // 0–100
}

// Only request the GPU backend when the browser actually exposes WebGPU;
// otherwise fall back to CPU. Requesting "gpu" on a browser without WebGPU
// (Safari, older Chrome/Firefox) can throw instead of degrading gracefully.
const hasWebGPU =
  typeof navigator !== "undefined" &&
  "gpu" in navigator &&
  (navigator as { gpu?: unknown }).gpu != null;

const BG_REMOVAL_CONFIG = {
  model: "isnet_quint8" as const, // quantized — ~2× faster than fp16
  output: {
    format: "image/png" as const,
    quality: 0.7,
  },
  device: (hasWebGPU ? "gpu" : "cpu") as "gpu" | "cpu",
  proxyToWorker: true, // non-blocking UI
  rescale: true,
};

/**
 * Scale an image down to maxSide px on its longest edge.
 * Reduces ~12MP photos -> ~1MP, cutting inference time 5-10x.
 */
export async function scaleImageIfNeeded(
  source: File,
  maxSide = 1280
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(source);
    // If the image is already within the target dimensions, return it as-is.
    // Re-encoding a correctly-sized image to JPEG only adds work and would
    // flatten any PNG transparency for no benefit.
    if (maxSide === 0 || (bitmap.width <= maxSide && bitmap.height <= maxSide)) {
      bitmap.close();
      return source;
    }

    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    return canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
  } catch {
    return source;
  }
}

let preloadPromise: Promise<void> | null = null;

export function preloadBackgroundRemoval(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const { preload } = await import("@imgly/background-removal");
    await preload(BG_REMOVAL_CONFIG);
  })();

  return preloadPromise;
}

export async function removeBackground(
  imageSource: ImageSource,
  onProgress?: (p: RemovalProgress) => void
): Promise<Blob> {
  const { removeBackground: remove } = await import(
    "@imgly/background-removal"
  );

  return remove(imageSource, {
    ...BG_REMOVAL_CONFIG,
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      if (key.startsWith("fetch")) {
        onProgress({ stage: "downloading", progress: Math.round((current / total) * 100) });
      } else if (key.startsWith("compute")) {
        onProgress({ stage: "computing", progress: Math.round((current / total) * 100) });
      } else {
        onProgress({ stage: "encoding", progress: Math.round((current / total) * 100) });
      }
    },
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
