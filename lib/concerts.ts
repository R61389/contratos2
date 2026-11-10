/**
 * Conciertos de los artistas de VIBRA. Sin base de datos, la cartelera sale de esta lista; con Supabase, de la tabla
 * `concerts`, que cada artista administra desde su panel. Las horas son de Bolivia (UTC−4, sin horario de verano).
 */

export interface Concert {
  slug: string;
  artistSlug: string;
  title: string;
  description: string;
  /** yyyy-mm-dd */
  date: string;
  /** hh:mm; si `end` es menor que `start`, el concierto termina al día siguiente. */
  start: string;
  end: string;
  venue: string;
  city: string;
  address: string;
  /** Afiche propio del artista; sin él se arma uno con su foto. */
  posterUrl: string | null;
  ticketUrl: string | null;
  /** null: por confirmar · 0: entrada libre */
  price: number | null;
  interested: number;
}

export const CONCERTS: Concert[] = [
  {
    slug: "meraya-en-vivo-universidad-salesiana-2026-11-24",
    artistSlug: "meraya",
    title: "Meraya en vivo",
    description:
      "Una hora de house, indie dance y melodic techno en la Universidad Salesiana. Meraya trae a Cochabamba el sonido de sus sets en rooftops y clubes, con un cierre que sube hasta el techno.",
    date: "2026-11-24",
    start: "10:30",
    end: "11:30",
    venue: "Universidad Salesiana de Bolivia",
    city: "Cochabamba",
    address: "",
    posterUrl: null,
    ticketUrl: null,
    price: null,
    interested: 0,
  },
];

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const BOLIVIA_OFFSET_HOURS = 4;

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

export function concertDate(date: string) {
  const { y, m, d, weekday } = parts(date);
  return {
    day: String(d).padStart(2, "0"),
    month: MONTHS[m - 1],
    monthShort: MONTHS[m - 1].slice(0, 3),
    weekday: WEEKDAYS[weekday],
    year: y,
    /** "martes 24 de noviembre de 2026" */
    long: `${WEEKDAYS[weekday]} ${d} de ${MONTHS[m - 1]} de ${y}`,
  };
}

/** Moment the concert starts or ends, as a real instant. */
export function concertInstant(c: Pick<Concert, "date" | "start" | "end">, which: "start" | "end") {
  const { y, m, d } = parts(c.date);
  const [h, min] = c[which].split(":").map(Number);
  const nextDay = which === "end" && c.end <= c.start ? 1 : 0;
  return new Date(Date.UTC(y, m - 1, d + nextDay, h + BOLIVIA_OFFSET_HOURS, min));
}

export function isUpcoming(c: Pick<Concert, "date" | "start" | "end">, now = new Date()) {
  return concertInstant(c, "end").getTime() > now.getTime();
}

export function isLive(c: Pick<Concert, "date" | "start" | "end">, now = new Date()) {
  return concertInstant(c, "start").getTime() <= now.getTime() && isUpcoming(c, now);
}

export function priceText(price: number | null) {
  if (price === null) return "Acceso por confirmar";
  if (price === 0) return "Entrada libre";
  return `Bs ${Math.round(price).toLocaleString("es-BO")}`;
}

export function placeText(c: Pick<Concert, "venue" | "city" | "address">) {
  return [c.venue, c.address, c.city].filter(Boolean).join(", ");
}

export function mapsUrl(c: Pick<Concert, "venue" | "city" | "address">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeText(c)}, Bolivia`)}`;
}

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(c: Concert, artistName: string, pageUrl: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.title} · ${artistName}`,
    dates: `${stamp(concertInstant(c, "start"))}/${stamp(concertInstant(c, "end"))}`,
    details: `${c.description}\n\n${pageUrl}`,
    location: `${placeText(c)}, Bolivia`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Contents of an .ics file, for Apple Calendar, Outlook and others. */
export function icsFile(c: Concert, artistName: string, pageUrl: string) {
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VIBRA//Conciertos//ES",
    "BEGIN:VEVENT",
    `UID:${c.slug}@vibra`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(concertInstant(c, "start"))}`,
    `DTEND:${stamp(concertInstant(c, "end"))}`,
    `SUMMARY:${esc(`${c.title} · ${artistName}`)}`,
    `DESCRIPTION:${esc(`${c.description}\n\n${pageUrl}`)}`,
    `LOCATION:${esc(`${placeText(c)}, Bolivia`)}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** "Meraya en vivo" + "2026-11-24" → "meraya-en-vivo-2026-11-24" */
export function concertSlug(artistSlug: string, title: string, date: string, suffix = "") {
  const base = `${artistSlug}-${title}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
  return [base, date, suffix].filter(Boolean).join("-");
}
