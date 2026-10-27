/**
 * Translation between database rows and the panel's ProviderWorkspace, in both directions.
 * The panel screens only know ProviderWorkspace; this file is the only place that knows the tables.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Addon,
  BookingRequest,
  Faq,
  MediaItem,
  MusicTrack,
  Package,
  PanelNotification,
  PriceTier,
  Promotion,
  ProviderKind,
  ProviderWorkspace,
  Service,
} from "@/lib/panel/types";

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const hhmm = (v: unknown) => String(v ?? "00:00").slice(0, 5);

/* ───────────── rows → workspace ───────────── */

/** Postgres returns "2026-10-22T12:00:00+00:00"; the panel compares and shows the JavaScript ISO form. */
function iso(v: unknown) {
  return v ? new Date(v as string).toISOString() : new Date().toISOString();
}

export function rowsToWorkspace(r: {
  provider: Row;
  settings: Row | null;
  media: Row[];
  services: Row[];
  packages: Row[];
  addons: Row[];
  tiers: Row[];
  music: Row[];
  promotions: Row[];
  faqs: Row[];
  overrides: Row[];
  requests: Row[];
  notifications: Row[];
}): ProviderWorkspace {
  const p = r.provider;
  const media: MediaItem[] = r.media.map((m) => ({
    id: m.id as string,
    url: m.url as string,
    title: (m.title as string) ?? "",
    alt: (m.alt as string) ?? "",
    source: "demo",
    storagePath: (m.storage_path as string) ?? undefined,
  }));
  const socials = (p.socials as Record<string, string>) ?? {};
  return {
    id: p.id as string,
    publicSlug: p.slug as string,
    kind: p.kind as ProviderKind,
    verified: Boolean(p.verified),
    rating: Number(p.rating ?? 0),
    reviewsCount: Number(p.reviews_count ?? 0),
    profile: {
      businessName: p.business_name as string,
      tagline: (p.tagline as string) ?? "",
      logoUrl: (p.logo_url as string) ?? null,
      coverUrl: (p.cover_url as string) ?? null,
      description: (p.description as string) ?? "",
      categories: (p.categories as ProviderKind[]) ?? [],
      city: (p.city as string) ?? "",
      zone: (p.zone as string) ?? "",
      phone: (p.phone as string) ?? "",
      socials: { instagram: socials.instagram ?? "", facebook: socials.facebook ?? "", tiktok: socials.tiktok ?? "", youtube: socials.youtube ?? "" },
      yearsExperience: Number(p.years_experience ?? 0),
      featuredServiceIds: (p.featured_service_ids as string[]) ?? [],
      faqs: r.faqs.map((f): Faq => ({ id: f.id as string, question: f.question as string, answer: f.answer as string })),
      published: Boolean(p.published),
    },
    services: r.services.map(
      (s): Service => ({
        id: s.id as string,
        name: s.name as string,
        category: s.category as ProviderKind,
        description: (s.description as string) ?? "",
        coverId: (s.cover_media_id as string) ?? null,
        galleryIds: (s.gallery_media_ids as string[]) ?? [],
        basePrice: num(s.base_price),
        pricingMode: s.pricing_mode as Service["pricingMode"],
        durationHours: Number(s.duration_hours),
        includes: (s.includes as string[]) ?? [],
        excludes: (s.excludes as string[]) ?? [],
        capacity: (s.capacity as string) ?? "",
        conditions: (s.conditions as string) ?? "",
        status: s.status as Service["status"],
        updatedAt: iso(s.updated_at),
      })
    ),
    pricing: {
      basePrice: Number(p.base_price ?? 0),
      pricingMode: p.pricing_mode as Service["pricingMode"],
      minimumOrder: Number(p.minimum_order ?? 0),
      depositPct: Number(p.deposit_pct ?? 0),
      paymentTerms: (p.payment_terms as string) ?? "",
      discountEnabled: Boolean(p.discount_enabled),
      discountPct: Number(p.discount_pct ?? 0),
      discountFrom: (p.discount_from as string) ?? "",
      discountTo: (p.discount_to as string) ?? "",
    },
    packages: r.packages.map(
      (k): Package => ({
        id: k.id as string,
        name: k.name as string,
        price: num(k.price),
        pricingMode: k.pricing_mode as Package["pricingMode"],
        previousPrice: num(k.previous_price),
        discountPct: Number(k.discount_pct ?? 0),
        durationHours: Number(k.duration_hours),
        capacity: (k.capacity as string) ?? "",
        benefits: (k.benefits as string[]) ?? [],
        addonIds: (k.addon_ids as string[]) ?? [],
        highlighted: Boolean(k.highlighted),
      })
    ),
    addons: r.addons.map((a): Addon => ({ id: a.id as string, name: a.name as string, price: Number(a.price), unit: a.unit as Addon["unit"] })),
    tiers: r.tiers.map((t): PriceTier => ({ id: t.id as string, basis: t.basis as PriceTier["basis"], min: Number(t.min), max: num(t.max), price: Number(t.price) })),
    media,
    galleryOrder: media.map((m) => m.id),
    coverMediaId: (p.cover_media_id as string) ?? null,
    music: r.music.map((m): MusicTrack => ({ id: m.id as string, title: m.title as string, youtubeId: m.youtube_id as string })),
    availability: {
      restDays: ((p.rest_days as number[]) ?? []).map(Number),
      hours: { start: (p.hours_start as string) ?? "09:00", end: (p.hours_end as string) ?? "23:00" },
      overrides: Object.fromEntries(r.overrides.map((o) => [o.day as string, o.state as "disponible" | "bloqueada"])),
      updatedAt: iso(p.availability_updated_at),
    },
    requests: r.requests.map(
      (b): BookingRequest => ({
        id: b.id as string,
        clientName: b.client_name as string,
        eventType: b.event_type as string,
        date: b.event_date as string,
        start: hhmm(b.start_time),
        end: hhmm(b.end_time),
        days: Number(b.days ?? 1),
        venue: (b.venue as string) ?? "",
        guests: num(b.guests),
        serviceId: (b.service_id as string) ?? null,
        serviceName: (b.service_name as string) ?? "",
        proposedPrice: Number(b.proposed_price),
        message: (b.message as string) ?? "",
        status: b.status as BookingRequest["status"],
        source: b.source as BookingRequest["source"],
        counterOffer: (b.counter_offer as BookingRequest["counterOffer"]) ?? undefined,
        changeRequest: (b.change_request as string) ?? undefined,
        rejectReason: (b.reject_reason as string) ?? undefined,
        history: (b.history as BookingRequest["history"]) ?? [],
        receivedAt: iso(b.received_at),
      })
    ),
    promotions: r.promotions.map(
      (pr): Promotion => ({
        id: pr.id as string,
        name: pr.name as string,
        description: (pr.description as string) ?? "",
        type: pr.type as Promotion["type"],
        value: Number(pr.value),
        start: pr.start_date as string,
        end: pr.end_date as string,
        serviceIds: (pr.service_ids as string[]) ?? [],
        conditions: (pr.conditions as string) ?? "",
        active: Boolean(pr.active),
      })
    ),
    // Real visit tracking doesn't exist yet; the statistics screen says so instead of inventing numbers.
    stats: [],
    notifications: r.notifications.map(
      (n): PanelNotification => ({ id: n.id as string, title: n.title as string, body: (n.body as string) ?? "", at: iso(n.created_at), read: Boolean(n.read), href: (n.href as string) ?? "/panel" })
    ),
    settings: {
      email: (r.settings?.email as string) ?? "",
      notifyEmail: Boolean(r.settings?.notify_email ?? true),
      notifyWhatsapp: Boolean(r.settings?.notify_whatsapp ?? false),
      weeklySummary: Boolean(r.settings?.weekly_summary ?? true),
      autoDecline: Boolean(r.settings?.auto_decline ?? false),
    },
  };
}

/* ───────────── workspace → rows ───────────── */

export function providerRow(ws: ProviderWorkspace) {
  const p = ws.profile;
  return {
    business_name: p.businessName,
    tagline: p.tagline,
    description: p.description,
    logo_url: p.logoUrl,
    cover_url: p.coverUrl,
    categories: p.categories,
    city: p.city,
    zone: p.zone,
    phone: p.phone,
    socials: p.socials,
    years_experience: p.yearsExperience,
    featured_service_ids: p.featuredServiceIds,
    published: p.published,
    cover_media_id: ws.coverMediaId,
    base_price: ws.pricing.basePrice,
    pricing_mode: ws.pricing.pricingMode,
    minimum_order: ws.pricing.minimumOrder,
    deposit_pct: ws.pricing.depositPct,
    payment_terms: ws.pricing.paymentTerms,
    discount_enabled: ws.pricing.discountEnabled,
    discount_pct: ws.pricing.discountPct,
    discount_from: ws.pricing.discountFrom || null,
    discount_to: ws.pricing.discountTo || null,
    rest_days: ws.availability.restDays,
    hours_start: ws.availability.hours.start,
    hours_end: ws.availability.hours.end,
    availability_updated_at: ws.availability.updatedAt,
  };
}

export function settingsRow(ws: ProviderWorkspace) {
  const s = ws.settings;
  return { provider_id: ws.id, email: s.email, notify_email: s.notifyEmail, notify_whatsapp: s.notifyWhatsapp, weekly_summary: s.weeklySummary, auto_decline: s.autoDecline };
}

/** Child tables, each with how to turn the workspace into its rows. Order matters: media first (services point at it). */
export const COLLECTIONS: { table: string; rows: (ws: ProviderWorkspace) => Row[] }[] = [
  {
    table: "media",
    rows: (ws) =>
      ws.galleryOrder
        .map((id) => ws.media.find((m) => m.id === id))
        .filter((m): m is MediaItem => Boolean(m))
        .map((m, i) => ({ id: m.id, provider_id: ws.id, url: m.url, storage_path: m.storagePath ?? null, title: m.title, alt: m.alt, position: i })),
  },
  {
    table: "services",
    rows: (ws) =>
      ws.services.map((s, i) => ({
        id: s.id, provider_id: ws.id, name: s.name, category: s.category, description: s.description, cover_media_id: s.coverId, gallery_media_ids: s.galleryIds,
        base_price: s.pricingMode === "cotizacion" ? null : s.basePrice, pricing_mode: s.pricingMode, duration_hours: s.durationHours, includes: s.includes,
        excludes: s.excludes, capacity: s.capacity, conditions: s.conditions, status: s.status, position: i, updated_at: s.updatedAt,
      })),
  },
  { table: "addons", rows: (ws) => ws.addons.map((a, i) => ({ id: a.id, provider_id: ws.id, name: a.name, price: a.price, unit: a.unit, position: i })) },
  {
    table: "packages",
    rows: (ws) =>
      ws.packages.map((k, i) => ({
        id: k.id, provider_id: ws.id, name: k.name, price: k.pricingMode === "cotizacion" ? null : k.price, pricing_mode: k.pricingMode, previous_price: k.previousPrice,
        discount_pct: k.discountPct, duration_hours: k.durationHours, capacity: k.capacity, benefits: k.benefits, addon_ids: k.addonIds, highlighted: k.highlighted, position: i,
      })),
  },
  { table: "price_tiers", rows: (ws) => ws.tiers.map((t, i) => ({ id: t.id, provider_id: ws.id, basis: t.basis, min: t.min, max: t.max, price: t.price, position: i })) },
  { table: "music_tracks", rows: (ws) => ws.music.map((m, i) => ({ id: m.id, provider_id: ws.id, title: m.title, youtube_id: m.youtubeId, position: i })) },
  {
    table: "promotions",
    rows: (ws) =>
      ws.promotions.map((p) => ({
        id: p.id, provider_id: ws.id, name: p.name, description: p.description, type: p.type, value: p.value, start_date: p.start, end_date: p.end,
        service_ids: p.serviceIds, conditions: p.conditions, active: p.active,
      })),
  },
  { table: "faqs", rows: (ws) => ws.profile.faqs.map((f, i) => ({ id: f.id, provider_id: ws.id, question: f.question, answer: f.answer, position: i })) },
  {
    table: "booking_requests",
    rows: (ws) =>
      ws.requests.map((r) => ({
        id: r.id, provider_id: ws.id, client_name: r.clientName, event_type: r.eventType, event_date: r.date, start_time: r.start, end_time: r.end, days: r.days,
        venue: r.venue, guests: r.guests, service_id: r.serviceId, service_name: r.serviceName, proposed_price: r.proposedPrice, message: r.message,
        status: r.status, source: r.source, counter_offer: r.counterOffer ?? null, change_request: r.changeRequest ?? null, reject_reason: r.rejectReason ?? null,
        history: r.history, received_at: r.receivedAt,
      })),
  },
  { table: "notifications", rows: (ws) => ws.notifications.map((n) => ({ id: n.id, provider_id: ws.id, title: n.title, body: n.body, href: n.href, read: n.read, created_at: n.at })) },
];

/* ───────────── Loading ───────────── */

async function all(sb: SupabaseClient, table: string, providerId: string, order?: string) {
  let q = sb.from(table).select("*").eq("provider_id", providerId);
  if (order) q = q.order(order, { ascending: true });
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

/** Every provider the signed-in user manages, fully loaded. */
export async function loadWorkspaces(sb: SupabaseClient, userId: string): Promise<ProviderWorkspace[]> {
  const { data: members, error } = await sb.from("provider_members").select("provider_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const ids = (members ?? []).map((m) => m.provider_id as string);
  return Promise.all(ids.map((id) => loadWorkspace(sb, id)));
}

export async function loadWorkspace(sb: SupabaseClient, providerId: string): Promise<ProviderWorkspace> {
  const [{ data: provider, error }, { data: settings }] = await Promise.all([
    sb.from("providers").select("*").eq("id", providerId).single(),
    sb.from("provider_settings").select("*").eq("provider_id", providerId).maybeSingle(),
  ]);
  if (error || !provider) throw new Error(error?.message ?? "Proveedor no encontrado");
  const [media, services, packages, addons, tiers, music, promotions, faqs, overrides, requests, notifications] = await Promise.all([
    all(sb, "media", providerId, "position"),
    all(sb, "services", providerId, "position"),
    all(sb, "packages", providerId, "position"),
    all(sb, "addons", providerId, "position"),
    all(sb, "price_tiers", providerId, "position"),
    all(sb, "music_tracks", providerId, "position"),
    all(sb, "promotions", providerId, "start_date"),
    all(sb, "faqs", providerId, "position"),
    all(sb, "availability_overrides", providerId),
    all(sb, "booking_requests", providerId, "event_date"),
    all(sb, "notifications", providerId, "created_at"),
  ]);
  return rowsToWorkspace({ provider, settings, media, services, packages, addons, tiers, music, promotions, faqs, overrides, requests, notifications: notifications.reverse() });
}
