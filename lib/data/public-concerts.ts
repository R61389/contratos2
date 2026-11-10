/**
 * Concerts for the public pages, each with its artist's public profile.
 * Same rules as public-providers: with Supabase the database decides (only published concerts of published artists);
 * without it, or if the database can't be read (for example, before the concerts migration runs), lib/concerts.ts is used.
 */
import { cache } from "react";
import { CONCERTS, type Concert } from "@/lib/concerts";
import type { Provider } from "@/lib/providers";
import { getPublicProviders } from "@/lib/data/public-providers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicClient } from "@/lib/supabase/server";

export interface ConcertView extends Concert {
  artist: Provider;
}

type Row = Record<string, unknown>;

function fromRow(r: Row): Concert {
  return {
    slug: r.slug as string,
    artistSlug: (r.providers as { slug: string }).slug,
    title: r.title as string,
    description: (r.description as string) ?? "",
    date: r.date as string,
    start: r.start_time as string,
    end: r.end_time as string,
    venue: r.venue as string,
    city: (r.city as string) ?? "",
    address: (r.address as string) ?? "",
    posterUrl: (r.poster_url as string) ?? null,
    ticketUrl: (r.ticket_url as string) ?? null,
    price: r.price === null || r.price === undefined ? null : Number(r.price),
    interested: Number(r.interested_count ?? 0),
  };
}

async function readConcerts(): Promise<Concert[]> {
  if (!isSupabaseConfigured()) return CONCERTS;
  const { data, error } = await getPublicClient()
    .from("concerts")
    .select("slug, title, description, date, start_time, end_time, venue, city, address, poster_url, ticket_url, price, interested_count, providers!inner(slug)")
    .eq("published", true);
  if (error || !data) {
    console.error("No se pudieron leer los conciertos; se muestran los datos estáticos.", error?.message);
    return CONCERTS;
  }
  return (data as Row[]).map(fromRow);
}

/** Every concert whose artist is on the site, soonest first. Cached per request. */
export const getPublicConcerts = cache(async (): Promise<ConcertView[]> => {
  const [concerts, providers] = await Promise.all([readConcerts(), getPublicProviders()]);
  const bySlug = new Map(providers.map((p) => [p.slug, p]));
  return concerts
    .filter((c) => bySlug.has(c.artistSlug))
    .map((c) => ({ ...c, artist: bySlug.get(c.artistSlug)! }))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
});

export async function getPublicConcert(slug: string) {
  return (await getPublicConcerts()).find((c) => c.slug === slug);
}

export async function getArtistConcerts(artistSlug: string) {
  return (await getPublicConcerts()).filter((c) => c.artistSlug === artistSlug);
}
