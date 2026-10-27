/**
 * Public provider data for the site's pages.
 *
 * Without Supabase configured, the static profiles in lib/providers.ts are used as they are.
 * With Supabase, the database decides who is listed (only published providers) and what the provider edits from the
 * panel: name, texts, photos, music, packages, price, promotion and contact. The static profile, when there is one,
 * still supplies what the panel doesn't manage yet (team, reviews, videos, catering menus' details).
 * If the database can't be reached, the static profiles are shown so the site never goes blank.
 */
import { cache } from "react";
import { PROVIDERS, type EmblemVariant, type GalleryItem, type Package, type Provider, type Track } from "@/lib/providers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicClient } from "@/lib/supabase/server";
import { MONTHS } from "@/lib/panel/format";

type Row = Record<string, unknown>;

interface ProviderRow {
  slug: string;
  kind: string;
  business_name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string;
  zone: string;
  phone: string;
  years_experience: number;
  rating: number;
  reviews_count: number;
  base_price: number;
  pricing_mode: string;
  media: Row[];
  music_tracks: Row[];
  packages: Row[];
  promotions: Row[];
}

/** Kinds the public pages know how to show today. */
const CATEGORY: Partial<Record<string, Provider["category"]>> = {
  musica: "Grupo Musical",
  dj: "DJ",
  catering: "Catering",
  bebidas: "Bebidas",
};

const EMBLEM: Record<Provider["category"], EmblemVariant> = {
  Artista: "waves",
  "Grupo Musical": "waves",
  DJ: "vinyl",
  Catering: "cloche",
  Bebidas: "hop",
};


const UNIT: Partial<Record<string, string>> = { persona: "por persona", hora: "por hora" };

const num = (v: unknown) => Number(v ?? 0);
const today = () => new Date().toISOString().slice(0, 10);

/** "+591 7000 0000" or "70000000" → "59170000000" */
function whatsapp(phone: string, fallback: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return fallback;
  return digits.length === 8 ? `591${digits}` : digits;
}

function longDay(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]}`;
}

function hoursLabel(h: number) {
  return `Hasta ${Number.isInteger(h) ? h : h.toFixed(1)} horas`;
}

/** The promotion running today, if any; the profile shows one at a time. */
function activePromo(row: ProviderRow): Provider["promo"] {
  const now = today();
  const promo = row.promotions
    .filter((p) => p.active && (p.start_date as string) <= now && (p.end_date as string) >= now)
    .sort((a, b) => num(b.value) - num(a.value))[0];
  if (!promo) return { discount: 0, title: "", description: "", validUntil: "" };
  const discount = promo.type === "porcentaje" ? num(promo.value) : row.base_price ? Math.round((num(promo.value) / row.base_price) * 100) : 0;
  return { discount, title: promo.name as string, description: promo.description as string, validUntil: longDay(promo.end_date as string) };
}

function gallery(row: ProviderRow, base?: Provider): GalleryItem[] {
  const known = new Map(base?.gallery.map((g) => [g.src, g]));
  return row.media.map((m) => {
    const url = m.url as string;
    const alt = (m.alt as string) || (m.title as string) || row.business_name;
    return { ...(known.get(url) ?? { tag: "Fotos" as const, width: 1200, height: 900 }), src: url, alt };
  });
}

function tracks(row: ProviderRow, base?: Provider): Track[] {
  // Audio files aren't managed from the panel yet, so they stay; YouTube videos come from the database.
  const audio = base?.music?.tracks.filter((t) => t.src) ?? [];
  const videos = row.music_tracks.map((t) => ({ title: t.title as string, youtubeId: t.youtube_id as string }));
  return [...videos, ...audio];
}

function packages(row: ProviderRow): Package[] {
  return row.packages
    .filter((p) => p.price !== null)
    .map((p) => ({
      name: p.name as string,
      price: num(p.price),
      unit: UNIT[p.pricing_mode as string],
      duration: hoursLabel(num(p.duration_hours)),
      perks: (p.benefits as string[]) ?? [],
      recommended: Boolean(p.highlighted),
    }));
}

/** A profile for a provider that only exists in the database, built from what they filled in the panel. */
function blank(row: ProviderRow, category: Provider["category"]): Provider {
  // Until they upload a cover, the hero borrows the photo of another provider of the same kind.
  const cover = row.cover_url ?? PROVIDERS.find((p) => p.category === category)?.heroImage ?? PROVIDERS[0].heroImage;
  const firstWord = row.business_name.split(" ").sort((a, b) => b.length - a.length)[0] ?? row.business_name;
  return {
    slug: row.slug,
    name: row.business_name,
    fullName: row.business_name,
    category,
    kicker: category,
    heroWord: firstWord.toUpperCase(),
    tagline: row.tagline,
    bio: row.description,
    tags: [category],
    rating: 0,
    reviewsCount: 0,
    eventsCount: 0,
    yearsActive: row.years_experience,
    responseTime: "menos de 24 h",
    location: "",
    heroImage: cover,
    emblem: EMBLEM[category],
    // The hero's cut-out figure; without a logo the hero shows only the name.
    subject: { src: row.logo_url ?? "", width: 1000, height: 1000, alt: row.business_name, heightPct: 62, anchor: "center" },
    price: { from: 0, includes: [], monthlyBookings: 0 },
    promo: { discount: 0, title: "", description: "", validUntil: "" },
    gallery: [],
    videos: [],
    teamTitle: "El equipo",
    team: [],
    reviews: [],
    packages: [],
    whatsapp: "",
  };
}

function merge(row: ProviderRow, base: Provider | undefined): Provider | null {
  const category = base?.category ?? CATEGORY[row.kind];
  if (!category) return null;
  const p = base ?? blank(row, category);
  const music = tracks(row, base);
  const ownPackages = packages(row);
  return {
    ...p,
    name: base && base.name !== base.fullName ? base.name : row.business_name,
    fullName: row.business_name,
    tagline: row.tagline || p.tagline,
    bio: row.description || p.bio,
    location: [row.zone, row.city].filter(Boolean).join(", ") || p.location,
    yearsActive: row.years_experience,
    heroImage: row.cover_url ?? p.heroImage,
    // The official artwork keeps its real size; a logo replaced from the panel is shown square.
    logo: row.logo_url ? (p.logo?.src === row.logo_url ? p.logo : { src: row.logo_url, width: 800, height: 800, alt: `Logo de ${row.business_name}` }) : undefined,
    rating: num(row.rating),
    reviewsCount: row.reviews_count,
    price: { ...p.price, from: num(row.base_price), unit: UNIT[row.pricing_mode] },
    promo: activePromo(row),
    gallery: gallery(row, base),
    music: music.length ? { cover: p.music?.cover ?? row.cover_url ?? p.heroImage, tracks: music } : undefined,
    // Catering menus carry courses and photos the panel doesn't edit yet; only their prices follow the database.
    packages: p.catering ? p.packages : ownPackages,
    catering: p.catering && {
      ...p.catering,
      menus: p.catering.menus.map((m) => {
        const pkg = row.packages.find((x) => x.name === m.name);
        return pkg && pkg.price !== null ? { ...m, pricePerPerson: num(pkg.price) } : m;
      }),
    },
    whatsapp: whatsapp(row.phone, p.whatsapp),
  };
}

const SELECT =
  "slug, kind, business_name, tagline, description, logo_url, cover_url, city, zone, phone, years_experience, rating, reviews_count, base_price, pricing_mode, media(url, title, alt, position), music_tracks(title, youtube_id, position), packages(name, price, pricing_mode, duration_hours, benefits, highlighted, position), promotions(name, description, type, value, start_date, end_date, active)";

/** Every published provider, in the order of the static list first and then by name. Cached per request. */
export const getPublicProviders = cache(async (): Promise<Provider[]> => {
  if (!isSupabaseConfigured()) return PROVIDERS;
  const { data, error } = await getPublicClient()
    .from("providers")
    .select(SELECT)
    .order("business_name")
    .order("position", { referencedTable: "media" })
    .order("position", { referencedTable: "music_tracks" })
    .order("position", { referencedTable: "packages" });
  if (error || !data) {
    console.error("No se pudieron leer los proveedores; se muestran los datos estáticos.", error?.message);
    return PROVIDERS;
  }
  const rows = data as unknown as ProviderRow[];
  const order = new Map(PROVIDERS.map((p, i) => [p.slug, i]));
  return rows
    .sort((a, b) => (order.get(a.slug) ?? PROVIDERS.length) - (order.get(b.slug) ?? PROVIDERS.length))
    .map((row) => merge(row, PROVIDERS.find((p) => p.slug === row.slug)))
    .filter((p): p is Provider => p !== null);
});

export async function getPublicProvider(slug: string): Promise<Provider | undefined> {
  return (await getPublicProviders()).find((p) => p.slug === slug);
}
