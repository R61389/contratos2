/**
 * Genera supabase/seed.sql a partir de los proveedores que hoy viven en lib/providers.ts.
 * Uso: npm run db:seed-sql
 *
 * Los ids salen de un hash del slug, así que el archivo es estable y volver a ejecutarlo no duplica nada.
 * El seed usa "on conflict do nothing": nunca pisa lo que un proveedor ya editó desde el panel.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROVIDERS, type Provider } from "../lib/providers";

function uuidFrom(key: string) {
  const h = createHash("md5").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const q = (v: string | null | undefined) => (v === null || v === undefined ? "null" : `'${v.replace(/'/g, "''")}'`);
const arr = (items: string[]) => (items.length ? `array[${items.map(q).join(", ")}]` : "'{}'");

const KIND: Record<Provider["category"], string> = {
  Artista: "musica",
  "Grupo Musical": "musica",
  DJ: "dj",
  Catering: "catering",
  Bebidas: "bebidas",
};

/** "1 h 30 min" → 1.5, "Hasta 5 horas" → 5 */
function hours(text: string) {
  const h = Number(text.match(/(\d+(?:[.,]\d+)?)\s*h/)?.[1]?.replace(",", ".") ?? 0);
  const min = Number(text.match(/(\d+)\s*min/)?.[1] ?? 0);
  return Math.max(0.5, h + min / 60) || 4;
}

const lines: string[] = [
  "-- Generado por scripts/generate-seed.ts a partir de lib/providers.ts. No editar a mano.",
  "-- Datos de demostración: precios, reseñas y fotos de ejemplo.",
  "",
];

for (const p of PROVIDERS) {
  const id = uuidFrom(`provider:${p.slug}`);
  const kind = KIND[p.category];
  const city = p.location.split(",")[0].trim();
  const mode = p.price.unit === "por persona" ? "persona" : p.packages.length ? "paquete" : "evento";

  lines.push(`-- ${p.fullName}`);
  lines.push(
    `insert into public.providers (id, slug, kind, business_name, tagline, description, logo_url, cover_url, categories, city, years_experience, published, verified, rating, reviews_count, base_price, pricing_mode, deposit_pct, payment_terms) values (` +
      [
        q(id), q(p.slug), q(kind), q(p.fullName), q(p.tagline), q(p.bio), q(p.logo?.src ?? null), q(p.heroImage),
        `array[${q(kind)}]::provider_kind[]`, q(city), p.yearsActive, "true", "true", p.rating, p.reviewsCount, p.price.from, q(mode), 30,
        q("Anticipo del 30 % para reservar la fecha; saldo el día del evento."),
      ].join(", ") +
      ") on conflict (id) do nothing;"
  );

  p.gallery.forEach((g, i) => {
    lines.push(
      `insert into public.media (id, provider_id, url, title, alt, position) values (${q(uuidFrom(`media:${p.slug}:${g.src}`))}, ${q(id)}, ${q(g.src)}, ${q(g.alt)}, ${q(g.alt)}, ${i}) on conflict (id) do nothing;`
    );
  });
  if (p.gallery[0]) lines.push(`update public.providers set cover_media_id = ${q(uuidFrom(`media:${p.slug}:${p.gallery[0].src}`))} where id = ${q(id)} and cover_media_id is null;`);

  p.music?.tracks.forEach((t, i) => {
    if (!t.youtubeId) return;
    lines.push(
      `insert into public.music_tracks (id, provider_id, title, youtube_id, position) values (${q(uuidFrom(`track:${p.slug}:${t.youtubeId}`))}, ${q(id)}, ${q(t.title)}, ${q(t.youtubeId)}, ${i}) on conflict do nothing;`
    );
  });

  const packages = p.catering
    ? p.catering.menus.map((m) => ({ key: m.id, name: m.name, price: m.pricePerPerson, mode: "persona", duration: hours(m.serviceTime), capacity: `Desde ${m.minGuests} invitados`, benefits: [m.tagline], highlighted: Boolean(m.badge) }))
    : p.packages.map((pk) => ({ key: pk.name, name: pk.name, price: pk.price, mode: pk.unit ? "persona" : "paquete", duration: hours(pk.duration), capacity: "", benefits: pk.perks, highlighted: Boolean(pk.recommended) }));
  packages.forEach((pk, i) => {
    lines.push(
      `insert into public.packages (id, provider_id, name, price, pricing_mode, duration_hours, capacity, benefits, highlighted, position) values (${q(uuidFrom(`package:${p.slug}:${pk.key}`))}, ${q(id)}, ${q(pk.name)}, ${pk.price}, ${q(pk.mode)}, ${pk.duration}, ${q(pk.capacity)}, ${arr(pk.benefits)}, ${pk.highlighted}, ${i}) on conflict (id) do nothing;`
    );
  });

  lines.push(
    `insert into public.promotions (id, provider_id, name, description, type, value, start_date, end_date) values (${q(uuidFrom(`promo:${p.slug}`))}, ${q(id)}, ${q(p.promo.title)}, ${q(p.promo.description)}, 'porcentaje', ${p.promo.discount}, '2026-10-01', '2026-12-31') on conflict (id) do nothing;`
  );
  lines.push(`insert into public.provider_settings (provider_id) values (${q(id)}) on conflict do nothing;`);
  lines.push("");
}

const out = join(__dirname, "..", "supabase", "seed.sql");
writeFileSync(out, lines.join("\n"));
console.log(`seed.sql: ${PROVIDERS.length} proveedores`);
