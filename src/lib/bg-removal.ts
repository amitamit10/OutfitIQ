/**
 * Client-side background removal wrapper.
 * Dynamically imports @imgly/background-removal only when needed
 * to avoid loading the large WASM bundle on initial page load.
 */

export type ImageSource = string | Blob;

export async function removeBackground(imageSource: ImageSource): Promise<Blob> {
  const mod = await import("@imgly/background-removal");
  const remove = (mod as unknown as { default: (image: ImageSource, config?: unknown) => Promise<Blob> }).default;
  return remove(imageSource, {
    output: {
      format: "image/png",
      quality: 0.9,
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
