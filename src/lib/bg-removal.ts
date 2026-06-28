/**
 * Client-side background removal wrapper.
 * Dynamically imports @imgly/background-removal only when needed
 * to avoid loading the large WASM bundle on initial page load.
 */

export async function removeBackground(imageSource: ImageSource): Promise<Blob> {
  const { default: removeBackground } = await import("@imgly/background-removal");
  return removeBackground(imageSource, {
    output: {
      format: "image/png",
      quality: 0.9,
    },
  });
}

export type ImageSource = string | Blob;

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
