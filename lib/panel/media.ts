import type { MediaItem } from "@/lib/panel/types";
import { createLocalUrl } from "@/lib/panel/object-urls";
import { uid } from "@/lib/panel/format";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const MAX_BYTES = 5 * 1024 * 1024;

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: formato no admitido. Usa JPG, PNG o WebP.`;
  if (file.size > MAX_BYTES) return `${file.name}: pesa ${formatSize(file.size)}; el máximo es 5 MB.`;
  return null;
}

function titleFrom(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "Foto";
}

/** A preview held only in this tab (object URL); nothing is uploaded anywhere. */
export function localMedia(file: File): MediaItem {
  const title = titleFrom(file.name);
  return { id: uid("m"), url: createLocalUrl(file), title, alt: title, source: "local", fileName: file.name, size: file.size };
}

/** Splits a selection into accepted previews and readable errors. */
export function intakeFiles(files: FileList | File[]) {
  const accepted: MediaItem[] = [];
  const errors: string[] = [];
  Array.from(files).forEach((f) => {
    const error = validateImage(f);
    if (error) errors.push(error);
    else accepted.push(localMedia(f));
  });
  return { accepted, errors };
}
