import type { Provider } from "@/lib/providers";

export type DayStatus = "available" | "few" | "booked";

export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const WEEKDAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function hash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

// Weekends book up faster, so they skew towards "booked"/"few".
const THRESHOLDS: Record<number, [number, number]> = {
  0: [0.2, 0.45],
  1: [0.06, 0.18],
  2: [0.06, 0.18],
  3: [0.08, 0.2],
  4: [0.1, 0.25],
  5: [0.35, 0.65],
  6: [0.55, 0.85],
};

export function dayStatus(slug: string, date: Date): DayStatus {
  const r = hash(`${slug}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  const [booked, few] = THRESHOLDS[date.getDay()];
  if (r < booked) return "booked";
  if (r < few) return "few";
  return "available";
}

export function estimatePrice(provider: Provider, date: Date) {
  const base = provider.price.from;
  const day = date.getDay();
  const lines: { label: string; amount: number; accent?: boolean }[] = [
    { label: "Precio base", amount: base },
  ];
  let total = base;
  if (day >= 1 && day <= 4) {
    const discount = -(base * provider.promo.discount) / 100;
    lines.push({ label: `Oferta lunes a jueves (−${provider.promo.discount}%)`, amount: discount, accent: true });
    total += discount;
  } else if (day === 5 || day === 6) {
    const surcharge = base * 0.1;
    lines.push({ label: "Alta demanda fin de semana (+10%)", amount: surcharge });
    total += surcharge;
  }
  return { lines, total };
}

export function formatLongDate(date: Date) {
  const weekday = WEEKDAYS_LONG[date.getDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}
