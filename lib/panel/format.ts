import type { PricingMode, ProviderKind, RequestStatus } from "@/lib/panel/types";

export { formatBs } from "@/lib/format";

export const KIND_LABEL: Record<ProviderKind, string> = {
  musica: "Grupo musical",
  dj: "DJ",
  catering: "Catering",
  bebidas: "Bebidas y cervecería",
  fotografia: "Fotografía",
  decoracion: "Decoración",
  sonido: "Sonido e iluminación",
  salon: "Salón de eventos",
  otro: "Otro servicio",
};

export const PRICING_LABEL: Record<PricingMode, string> = {
  evento: "Por evento",
  hora: "Por hora",
  persona: "Por persona",
  paquete: "Por paquete",
  cotizacion: "Cotización personalizada",
};

export const PRICING_SUFFIX: Record<PricingMode, string> = {
  evento: "por evento",
  hora: "por hora",
  persona: "por persona",
  paquete: "por paquete",
  cotizacion: "",
};

/** Charging modes that make sense for each kind of provider. */
export const PRICING_BY_KIND: Record<ProviderKind, PricingMode[]> = {
  musica: ["evento", "hora", "paquete", "cotizacion"],
  dj: ["evento", "hora", "paquete", "cotizacion"],
  catering: ["persona", "paquete", "cotizacion"],
  bebidas: ["evento", "persona", "paquete", "cotizacion"],
  fotografia: ["evento", "hora", "paquete", "cotizacion"],
  decoracion: ["evento", "paquete", "cotizacion"],
  sonido: ["evento", "hora", "paquete", "cotizacion"],
  salon: ["evento", "hora", "persona", "cotizacion"],
  otro: ["evento", "hora", "persona", "paquete", "cotizacion"],
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pendiente: "Pendiente",
  modificacion: "Modificación solicitada",
  aceptada: "Aceptada · espera al cliente",
  confirmada: "Reserva confirmada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function priceLabel(price: number | null, mode: PricingMode) {
  if (mode === "cotizacion" || price === null) return "Cotización";
  const suffix = PRICING_SUFFIX[mode];
  return `Bs ${Math.round(price).toLocaleString("es-BO")}${suffix ? ` ${suffix}` : ""}`;
}

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function longDate(key: string) {
  const d = parseDateKey(key);
  const w = WEEKDAYS[d.getDay()];
  return `${w[0].toUpperCase()}${w.slice(1)} ${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(key: string) {
  const d = parseDateKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function relativeTime(iso: string, now = new Date()) {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "ahora";
  if (diff < 60) return `hace ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
