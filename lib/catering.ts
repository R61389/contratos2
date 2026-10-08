import type { CateringDetails, CateringMenu } from "@/lib/providers";
import { dayStatus } from "@/lib/availability";

export const GUEST_MARKS = [50, 100, 150, 200, 300];
export const MIN_GUESTS = 20;
export const MAX_GUESTS = 400;

export interface QuoteLine {
  label: string;
  amount: number;
  accent?: boolean;
}

export function crew(details: CateringDetails, guests: number) {
  return {
    waiters: Math.ceil(guests / details.guestsPerWaiter),
    cooks: Math.ceil(guests / 60) + 1,
  };
}

/** Estimated total for an event; orders under the menu's minimum are billed at the minimum. */
export function quote(
  details: CateringDetails,
  menu: CateringMenu,
  guests: number,
  { corporate = false, date }: { corporate?: boolean; date?: Date | null } = {}
) {
  const billed = Math.max(guests, menu.minGuests);
  const base = billed * menu.pricePerPerson;
  const lines: QuoteLine[] = [
    { label: `${menu.name} · ${billed} × Bs ${menu.pricePerPerson}`, amount: base },
  ];
  let total = base;
  const day = date?.getDay();
  if (day !== undefined && day >= 1 && day <= 4) {
    const off = -(base * details.weekdayDiscount) / 100;
    lines.push({ label: `Lunes a jueves (−${details.weekdayDiscount}%)`, amount: off, accent: true });
    total += off;
  } else if (day === 5 || day === 6) {
    const extra = base * 0.08;
    lines.push({ label: "Alta demanda fin de semana (+8%)", amount: extra });
    total += extra;
  }
  if (corporate) {
    const off = -(total * details.corporateDiscount) / 100;
    lines.push({ label: `Evento corporativo (−${details.corporateDiscount}%)`, amount: off, accent: true });
    total += off;
  }
  return { lines, total, billed, belowMinimum: guests < menu.minGuests };
}

/** Service staff still free on a date; days that are filling up have fewer people left. */
export function staffAvailable(slug: string, date: Date, pool: number) {
  const status = dayStatus(slug, date);
  if (status === "booked") return 0;
  const seed = (date.getDate() * 7 + date.getMonth() * 13) % 5;
  return status === "few" ? Math.round(pool * 0.3) + seed : pool - seed;
}
