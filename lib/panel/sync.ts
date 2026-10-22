/**
 * Saves a panel change to Supabase by comparing the workspace before and after it and writing only what changed.
 * Row-level security on the server is what actually guarantees a provider can touch only its own rows.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderWorkspace } from "@/lib/panel/types";
import { COLLECTIONS, providerRow, settingsRow } from "@/lib/panel/repository";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import { revokeLocalUrl } from "@/lib/panel/object-urls";

type Row = Record<string, unknown>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Readable message for the errors a provider can actually cause. */
export function explainError(e: { code?: string; message?: string } | Error): string {
  const code = "code" in e ? e.code : undefined;
  if (code === "23P01") return "Ese horario se cruza con otra reserva confirmada.";
  if (code === "23514") return "Algún dato no es válido (por ejemplo, un precio negativo o fechas al revés).";
  if (code === "42501") return "No tienes permiso para cambiar esto.";
  if (code === "23505") return "Ya existe un elemento igual.";
  return e.message || "No se pudo guardar.";
}

function extension(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

/** Uploads a local preview (blob: URL) and returns its permanent public URL. */
async function upload(sb: SupabaseClient, providerId: string, blobUrl: string, name: string) {
  const blob = await (await fetch(blobUrl)).blob();
  const path = `${providerId}/${name}.${extension(blob.type)}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  return { path, url: sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
}

/**
 * Turns local previews in `next` into uploaded files. Returns the workspace with permanent URLs, which the store
 * puts back into the screen so the previews can be released.
 */
async function uploadLocalImages(sb: SupabaseClient, next: ProviderWorkspace): Promise<ProviderWorkspace> {
  let ws = next;
  for (const m of ws.media) {
    if (!m.url.startsWith("blob:")) continue;
    const { path, url } = await upload(sb, ws.id, m.url, m.id);
    revokeLocalUrl(m.url);
    ws = { ...ws, media: ws.media.map((x) => (x.id === m.id ? { ...x, url, storagePath: path, source: "demo" } : x)) };
  }
  for (const key of ["logoUrl", "coverUrl"] as const) {
    const value = ws.profile[key];
    if (!value?.startsWith("blob:")) continue;
    // A cover picked from the gallery reuses that photo's uploaded URL.
    const fromGallery = next.media.find((m) => m.url === value);
    const uploaded = fromGallery ? ws.media.find((m) => m.id === fromGallery.id)?.url : (await upload(sb, ws.id, value, `${key === "logoUrl" ? "logo" : "portada"}-${Date.now()}`)).url;
    revokeLocalUrl(value);
    ws = { ...ws, profile: { ...ws.profile, [key]: uploaded ?? null } };
  }
  return ws;
}

export async function syncWorkspace(sb: SupabaseClient, prev: ProviderWorkspace, nextInput: ProviderWorkspace): Promise<ProviderWorkspace> {
  const next = await uploadLocalImages(sb, nextInput);
  const id = next.id;

  // Upserts go parents-first; deletions go children-first so references never dangle.
  const pending: { table: string; removed: string[] }[] = [];
  for (const { table, rows } of COLLECTIONS) {
    const before = new Map(rows(prev).map((r) => [r.id as string, r]));
    const after = rows(next);
    const changed = after.filter((r) => !same(before.get(r.id as string), r));
    const removed = [...before.keys()].filter((k) => !after.some((r) => r.id === k));
    if (changed.length) {
      const { error } = await sb.from(table).upsert(changed as Row[]);
      if (error) throw error;
    }
    if (removed.length) pending.push({ table, removed });
  }
  for (const { table, removed } of pending.reverse()) {
    if (table === "media") {
      const paths = prev.media.filter((m) => removed.includes(m.id) && m.storagePath).map((m) => m.storagePath!);
      if (paths.length) await sb.storage.from(MEDIA_BUCKET).remove(paths);
    }
    const { error } = await sb.from(table).delete().in("id", removed).eq("provider_id", id);
    if (error) throw error;
  }

  const before = prev.availability.overrides;
  const after = next.availability.overrides;
  const setDays = Object.entries(after).filter(([d, s]) => before[d] !== s);
  const clearedDays = Object.keys(before).filter((d) => !(d in after));
  if (setDays.length) {
    const { error } = await sb.from("availability_overrides").upsert(setDays.map(([day, state]) => ({ provider_id: id, day, state })));
    if (error) throw error;
  }
  if (clearedDays.length) {
    const { error } = await sb.from("availability_overrides").delete().eq("provider_id", id).in("day", clearedDays);
    if (error) throw error;
  }

  if (!same(providerRow(prev), providerRow(next))) {
    const { error } = await sb.from("providers").update(providerRow(next)).eq("id", id);
    if (error) throw error;
  }
  if (!same(settingsRow(prev), settingsRow(next))) {
    const { error } = await sb.from("provider_settings").upsert(settingsRow(next));
    if (error) throw error;
  }
  return next;
}
