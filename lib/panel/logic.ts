import type { BookingRequest, Promotion, ProviderWorkspace, RequestStatus } from "@/lib/panel/types";
import { dateKey, parseDateKey } from "@/lib/panel/format";

/* ───────────── Money ───────────── */

/** Parses a user-typed amount ("3.500", "3500", "3500,50"). Returns an error message instead of throwing. */
export function parseAmount(raw: string, { allowEmpty = false } = {}): { value: number | null; error: string | null } {
  const text = raw.trim();
  if (!text) return allowEmpty ? { value: null, error: null } : { value: null, error: "Ingresa un monto" };
  // Bolivian notation uses "." for thousands and "," for decimals.
  const normalized = text.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return { value: null, error: "Usa solo números" };
  const value = Number(normalized);
  if (value < 0) return { value: null, error: "El monto no puede ser negativo" };
  return { value: Math.round(value * 100) / 100, error: null };
}

export function parsePercent(raw: string): { value: number | null; error: string | null } {
  const { value, error } = parseAmount(raw);
  if (error || value === null) return { value: null, error: error ?? "Ingresa un porcentaje" };
  if (value > 100) return { value: null, error: "Máximo 100 %" };
  return { value, error: null };
}

export function applyPercent(price: number, pct: number) {
  return Math.max(0, Math.round(price * (1 - pct / 100) * 100) / 100);
}

/** Price after a promotion, never below zero; `invalid` flags a fixed discount larger than the price. */
export function promoPrice(price: number, promo: Pick<Promotion, "type" | "value">) {
  if (promo.type === "porcentaje") return { final: applyPercent(price, promo.value), invalid: promo.value >= 100 };
  const final = price - promo.value;
  return { final: Math.max(0, final), invalid: final <= 0 };
}

export function isPromoLive(promo: Promotion, today = dateKey(new Date())) {
  return promo.active && promo.start <= today && today <= promo.end;
}

/* ───────────── Time and conflicts ───────────── */

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Every calendar day a booking occupies. */
export function requestDays(req: Pick<BookingRequest, "date" | "days">) {
  const first = parseDateKey(req.date);
  return Array.from({ length: Math.max(1, req.days) }, (_, i) => dateKey(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i)));
}

/** End may be past midnight (e.g. 20:00 → 02:00); treat it as the next day. */
function span(req: Pick<BookingRequest, "start" | "end">) {
  const s = toMinutes(req.start);
  let e = toMinutes(req.end);
  if (e <= s) e += 24 * 60;
  return [s, e] as const;
}

export function overlaps(a: BookingRequest, b: BookingRequest) {
  const daysA = new Set(requestDays(a));
  const shared = requestDays(b).some((d) => daysA.has(d));
  if (!shared) return false;
  if (a.days > 1 || b.days > 1) return true;
  const [as, ae] = span(a);
  const [bs, be] = span(b);
  return as < be && bs < ae;
}

export const HOLDS_DATE: RequestStatus[] = ["confirmada"];
export const TENTATIVE: RequestStatus[] = ["pendiente", "modificacion", "aceptada"];

/** A confirmed booking that would clash with `candidate`, if any. */
export function findConflict(requests: BookingRequest[], candidate: BookingRequest) {
  return requests.find((r) => r.id !== candidate.id && HOLDS_DATE.includes(r.status) && overlaps(r, candidate)) ?? null;
}

export type DayState = "disponible" | "ocupado" | "pendiente" | "bloqueada";

export function dayState(ws: ProviderWorkspace, key: string): DayState {
  const onDay = ws.requests.filter((r) => requestDays(r).includes(key));
  if (onDay.some((r) => HOLDS_DATE.includes(r.status))) return "ocupado";
  const override = ws.availability.overrides[key];
  if (override === "bloqueada") return "bloqueada";
  if (override !== "disponible" && ws.availability.restDays.includes(parseDateKey(key).getDay())) return "bloqueada";
  if (onDay.some((r) => TENTATIVE.includes(r.status))) return "pendiente";
  return "disponible";
}

/* ───────────── Profile completeness ───────────── */

export function profileChecklist(ws: ProviderWorkspace) {
  const p = ws.profile;
  const recentCalendar = Date.now() - new Date(ws.availability.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 14;
  return [
    {
      id: "info",
      label: "Información comercial",
      done: Boolean(p.businessName && p.description.length >= 60 && p.phone && p.city && p.logoUrl),
      href: "/panel/perfil",
      hint: "Nombre, descripción, teléfono, ciudad y logotipo",
    },
    {
      id: "services",
      label: "Servicios configurados",
      done: ws.services.some((s) => s.status === "publicado"),
      href: "/panel/servicios",
      hint: "Al menos un servicio publicado",
    },
    {
      id: "photos",
      label: "Fotografías añadidas",
      done: ws.galleryOrder.length >= 6,
      href: "/panel/galeria",
      hint: "Mínimo 6 fotos en la galería",
    },
    {
      id: "prices",
      label: "Precios publicados",
      done: ws.pricing.basePrice > 0 && ws.packages.length > 0,
      href: "/panel/precios",
      hint: "Precio base y al menos un paquete",
    },
    {
      id: "calendar",
      label: "Calendario actualizado",
      done: recentCalendar,
      href: "/panel/calendario",
      hint: "Revisado en las últimas dos semanas",
    },
  ];
}
