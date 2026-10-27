/**
 * Prueba de punta a punta del guardado del panel y de las páginas públicas contra Postgres real (con RLS).
 *
 * Necesita:
 *  - Postgres con supabase/tests/local_stub.sql, las migraciones y supabase/seed.sql aplicados, y los usuarios
 *    eclipse@test.bo (1111…) y otro@test.bo (2222…) vinculados con link_provider_owner a grupo-musical-eclipse y dj-nightflow.
 *  - PostgREST con jwt-secret = SECRET, servido bajo /rest/v1 en http://127.0.0.1:54329 (por ejemplo, detrás de un proxy).
 *
 * Uso: npx tsx supabase/tests/sync_e2e.ts
 * No prueba Auth ni Storage reales: esos sólo existen en un proyecto de Supabase.
 */
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";
const URL = "http://127.0.0.1:54329";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(claims: object) {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ ...claims, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url")}`;
}
const ANON = jwt({ role: "anon" });
process.env.NEXT_PUBLIC_SUPABASE_URL = URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON;
const as = (sub: string) => createClient(URL, ANON, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${jwt({ role: "authenticated", sub })}` } } });

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { console.log(`${ok ? "OK  " : "FAIL"} ${name} ${extra}`); if (!ok) fails++; };
const strip = (ws: object) => JSON.parse(JSON.stringify(ws, (k, v) => (k === "updatedAt" ? undefined : v)));

async function main() {
  const { loadWorkspaces, loadWorkspace } = await import("@/lib/panel/repository");
  const { syncWorkspace, explainError } = await import("@/lib/panel/sync");
  const { getPublicProviders } = await import("@/lib/data/public-providers");
  const { uid } = await import("@/lib/panel/format");

  const eclipseUser = "11111111-1111-4111-a111-111111111111";
  const sb = as(eclipseUser);
  const list = await loadWorkspaces(sb, eclipseUser);
  check("owner loads exactly their provider", list.length === 1 && list[0].publicSlug === "grupo-musical-eclipse", `${list.length}`);
  const ws = list[0];
  check("seeded data present", ws.media.length > 0 && ws.packages.length > 0, `${ws.media.length} fotos, ${ws.packages.length} paquetes, ${ws.music.length} canciones`);

  const serviceId = uid();
  const next = {
    ...ws,
    profile: { ...ws.profile, tagline: "Tagline editado desde el panel", phone: "7123 4567", faqs: [{ id: uid(), question: "¿Viajan?", answer: "Sí" }] },
    pricing: { ...ws.pricing, basePrice: 4321 },
    packages: ws.packages.slice(1),
    music: [{ id: uid(), title: "Nuevo tema", youtubeId: "dQw4w9WgXcQ" }, ...ws.music],
    media: [...ws.media].reverse(),
    galleryOrder: [...ws.galleryOrder].reverse(),
    services: [...ws.services, { id: serviceId, name: "Show acústico", category: "musica" as const, description: "Formato íntimo", coverId: null, galleryIds: [], basePrice: 1500, pricingMode: "evento" as const, durationHours: 2, includes: ["Sonido"], excludes: [], capacity: "", conditions: "", status: "publicado" as const, updatedAt: new Date().toISOString() }],
    promotions: [{ id: uid(), name: "Promo panel", description: "Desde el panel", type: "porcentaje" as const, value: 25, start: "2026-10-01", end: "2026-11-30", serviceIds: [], conditions: "", active: true }],
    requests: [...ws.requests, { id: uid(), clientName: "Ana", eventType: "Boda", date: "2026-12-12", start: "22:00", end: "02:00", days: 1, venue: "Salón X", guests: 120, serviceId, serviceName: "Show acústico", proposedPrice: 1500, message: "", status: "confirmada" as const, source: "manual" as const, history: [{ at: new Date().toISOString(), label: "Creada" }], receivedAt: new Date().toISOString() }],
    availability: { ...ws.availability, overrides: { ...ws.availability.overrides, "2026-12-24": "bloqueada" as const } },
  };
  const saved = await syncWorkspace(sb, ws, next);
  const reloaded = await loadWorkspace(sb, ws.id);
  const a = strip(saved), b = strip(reloaded);
  const diffs = Object.keys(a).filter((k) => k !== "stats" && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  check("saved workspace round-trips through the database", diffs.length === 0, diffs.join(", "));
  if (diffs.length) for (const k of diffs.slice(0, 2)) console.log(k, JSON.stringify(a[k]).slice(0, 400), "\n  vs", JSON.stringify(b[k]).slice(0, 400));

  // Overlapping confirmed booking (crosses midnight) must be refused.
  const clash = { ...reloaded, requests: [...reloaded.requests, { ...next.requests.at(-1)!, id: uid(), clientName: "Luis", date: "2026-12-13", start: "01:00", end: "03:00" }] };
  try { await syncWorkspace(sb, reloaded, clash); check("overlap refused", false); } catch (e) { check("overlap refused", (e as { code?: string }).code === "23P01", explainError(e as Error)); }

  // Deletion syncs.
  const fewer = { ...reloaded, services: reloaded.services.filter((s) => s.id !== serviceId), requests: reloaded.requests.filter((r) => r.serviceId !== serviceId) };
  await syncWorkspace(sb, reloaded, fewer);
  const afterDelete = await loadWorkspace(sb, ws.id);
  check("deleted rows are gone", !afterDelete.services.some((s) => s.id === serviceId));

  // Another provider's owner can't touch Eclipse.
  const other = as("22222222-2222-4222-a222-222222222222");
  const { data: hijack } = await other.from("providers").update({ tagline: "hackeado" }).eq("id", ws.id).select();
  check("other owner can't edit", (hijack ?? []).length === 0);

  // Public pages see the edits.
  let pub = await getPublicProviders();
  const eclipse = pub.find((p) => p.slug === "grupo-musical-eclipse")!;
  check("public profile shows panel edits", eclipse.tagline === "Tagline editado desde el panel" && eclipse.price.from === 4321 && eclipse.whatsapp === "59171234567", `${eclipse.tagline} / ${eclipse.price.from} / ${eclipse.whatsapp}`);
  check("public music from panel", eclipse.music?.tracks[0]?.youtubeId === "dQw4w9WgXcQ");
  check("public packages follow panel", eclipse.packages.length === ws.packages.length - 1, `${eclipse.packages.length}`);
  check("public gallery order follows panel", eclipse.gallery[0]?.src === ws.media.at(-1)?.url);
  check("public promo from panel", eclipse.promo.discount === 25 && eclipse.promo.validUntil === "30 de noviembre", JSON.stringify(eclipse.promo));
  check("10 providers listed", pub.length === 10, `${pub.length}`);

  await syncWorkspace(sb, afterDelete, { ...afterDelete, profile: { ...afterDelete.profile, published: false } });
  pub = await getPublicProviders();
  check("unpublished provider disappears from the site", !pub.some((p) => p.slug === "grupo-musical-eclipse"), `${pub.length}`);

  console.log(fails ? `\n${fails} FALLAS` : "\nTodo OK");
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
