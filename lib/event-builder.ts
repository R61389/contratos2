import type { Provider } from "@/lib/providers";
import { dayStatus, estimatePrice, type DayStatus } from "@/lib/availability";

export type EventTypeId = "boda" | "quinceanero" | "cumpleanos" | "corporativo" | "graduacion" | "fiesta";
export type ServiceId = "musica" | "dj" | "catering" | "bebidas";

export interface EventType {
  id: EventTypeId;
  label: string;
  image: string;
  /** Services suggested when this type is chosen. */
  services: ServiceId[];
  guests: number;
}

export interface Service {
  id: ServiceId;
  label: string;
  description: string;
  categories: Provider["category"][];
}

function photo(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1100&q=75`;
}

export const EVENT_TYPES: EventType[] = [
  { id: "boda", label: "Boda", image: photo("photo-1519225421980-715cb0215aed"), services: ["musica", "dj", "catering", "bebidas"], guests: 150 },
  { id: "quinceanero", label: "Quinceañero", image: photo("photo-1492684223066-81342ee5ff30"), services: ["musica", "dj", "catering"], guests: 120 },
  { id: "cumpleanos", label: "Cumpleaños", image: photo("photo-1530103862676-de8c9debad1d"), services: ["dj", "catering", "bebidas"], guests: 60 },
  { id: "corporativo", label: "Evento corporativo", image: photo("photo-1464366400600-7168b8af9bc3"), services: ["catering", "bebidas", "dj"], guests: 100 },
  { id: "graduacion", label: "Graduación", image: photo("photo-1514525253161-7a46d19cd819"), services: ["dj", "catering", "bebidas"], guests: 200 },
  { id: "fiesta", label: "Fiesta privada", image: photo("photo-1575037614876-c38a4d44f5b8"), services: ["dj", "bebidas", "catering"], guests: 50 },
];

export const SERVICES: Service[] = [
  { id: "musica", label: "Música en vivo", description: "Artistas y grupos musicales", categories: ["Artista", "Grupo Musical"] },
  { id: "dj", label: "DJ", description: "Sets a medida para la pista", categories: ["DJ"] },
  { id: "catering", label: "Catering", description: "Menús por persona", categories: ["Catering"] },
  { id: "bebidas", label: "Bebidas", description: "Cerveza artesanal y barra", categories: ["Bebidas"] },
];

/** The home page's packages, as a starting point for the builder. */
export const PACKAGES: Record<string, { label: string; services: ServiceId[]; guests: number }> = {
  basico: { label: "Paquete Básico", services: ["dj"], guests: 40 },
  fiesta: { label: "Paquete Fiesta", services: ["dj", "catering"], guests: 50 },
  completo: { label: "Paquete Completo", services: ["musica", "dj", "catering"], guests: 120 },
  premium: { label: "Paquete Premium", services: ["musica", "dj", "catering", "bebidas"], guests: 150 },
};

/** Shown so the visitor knows they exist, but no provider offers them yet. */
export const UPCOMING_SERVICES = ["Fotografía", "Decoración", "Sonido", "Iluminación"];

export const GUESTS = { min: 20, max: 500, step: 10 };

export function suggestedBudget(guests: number) {
  return Math.round((guests * 260) / 500) * 500;
}

/** The menu a caterer is quoted with: its featured menu when it takes this many guests, else the cheapest that does. */
export function eventMenu(provider: Provider, guests: number) {
  const menus = provider.catering?.menus;
  if (!menus) return null;
  const fits = menus.filter((m) => m.minGuests <= guests);
  const pool = fits.length ? fits : menus;
  return pool.find((m) => m.badge) ?? pool.reduce((a, b) => (b.pricePerPerson < a.pricePerPerson ? b : a));
}

/** Price of a provider for this event: per-person providers scale with guests; the date adds its discount or surcharge. */
export function eventPrice(provider: Provider, guests: number, date: Date | null) {
  const perUnit = eventMenu(provider, guests)?.pricePerPerson ?? provider.price.from;
  const dated = date ? estimatePrice({ ...provider, price: { ...provider.price, from: perUnit } }, date).total : perUnit;
  return provider.price.unit ? dated * guests : dated;
}

export interface Option {
  provider: Provider;
  price: number;
  status: DayStatus | null;
}

/** Providers for a service, best first: free on the date, then best rated, then cheapest. */
export function optionsFor(service: Service, providers: Provider[], guests: number, date: Date | null): Option[] {
  const rank: Record<DayStatus, number> = { available: 0, few: 1, booked: 2 };
  return providers
    .filter((p) => service.categories.includes(p.category))
    .map((p) => ({ provider: p, price: eventPrice(p, guests, date), status: date ? dayStatus(p.slug, date) : null }))
    .sort(
      (a, b) =>
        (a.status ? rank[a.status] : 0) - (b.status ? rank[b.status] : 0) ||
        b.provider.rating - a.provider.rating ||
        a.price - b.price
    );
}

/** How many of the given providers are not booked on a date. */
export function freeProviders(providers: Provider[], date: Date) {
  return providers.filter((p) => dayStatus(p.slug, date) !== "booked").length;
}
