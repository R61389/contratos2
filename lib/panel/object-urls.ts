import type { ProviderWorkspace } from "@/lib/panel/types";

/**
 * Local image previews are object URLs, which hold the file in memory until revoked. This registry knows which
 * URLs were created here so they can be released when an image is removed, replaced or the demo is reset.
 * With a backend, uploads would return permanent URLs and this file goes away.
 */
const created = new Set<string>();

export function createLocalUrl(file: File) {
  const url = URL.createObjectURL(file);
  created.add(url);
  return url;
}

export function revokeLocalUrl(url: string | null | undefined) {
  if (url && created.has(url)) {
    URL.revokeObjectURL(url);
    created.delete(url);
  }
}

export function revokeWorkspaceUrls(ws: ProviderWorkspace) {
  ws.media.forEach((m) => revokeLocalUrl(m.url));
  revokeLocalUrl(ws.profile.logoUrl);
  revokeLocalUrl(ws.profile.coverUrl);
}

export function revokeAll() {
  created.forEach((url) => URL.revokeObjectURL(url));
  created.clear();
}
