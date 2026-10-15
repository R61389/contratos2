/**
 * Demonstration workspaces. Every person, venue, price and number here is invented for the demo; nothing is
 * real customer data. Dates are relative to the day the panel opens so the demo always looks current.
 */
import { getProvider } from "@/lib/providers";
import type {
  Addon,
  BookingRequest,
  MediaItem,
  MonthlyStat,
  Package,
  PanelNotification,
  ProviderWorkspace,
  RequestStatus,
  Service,
} from "@/lib/panel/types";
import { dateKey, MONTHS } from "@/lib/panel/format";

export const DEMO_PROVIDER_IDS = ["eclipse", "catering-gourmet", "nightflow", "andes-craft"] as const;
export type DemoProviderId = (typeof DEMO_PROVIDER_IDS)[number];

function daysFrom(base: Date, n: number) {
  return dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n));
}

function hoursAgo(base: Date, h: number) {
  return new Date(base.getTime() - h * 3600_000).toISOString();
}

function mediaFrom(slug: string, prefix: string): MediaItem[] {
  const p = getProvider(slug);
  if (!p) return [];
  return p.gallery.map((g, i) => ({
    id: `${prefix}_m${i + 1}`,
    url: g.src,
    title: g.alt,
    alt: g.alt,
    source: "demo" as const,
  }));
}

function months(base: Date, visits: number[], requests: number[]): MonthlyStat[] {
  return visits.map((v, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - (visits.length - 1 - i), 1);
    return { month: `${MONTHS[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`, visits: v, requests: requests[i] };
  });
}

interface ReqSeed {
  id: string;
  in: number;
  start: string;
  end: string;
  client: string;
  event: string;
  venue: string;
  guests: number | null;
  service: number;
  price: number;
  message: string;
  status: RequestStatus;
  received: number;
  days?: number;
}

function requests(base: Date, services: Service[], seeds: ReqSeed[]): BookingRequest[] {
  return seeds.map((s) => {
    const service = services[s.service];
    const history: BookingRequest["history"] = [{ at: hoursAgo(base, s.received), label: "Solicitud recibida en VIBRA" }];
    if (s.status === "aceptada") history.push({ at: hoursAgo(base, s.received - 2), label: "Aceptaste la solicitud" });
    if (s.status === "confirmada") {
      history.push({ at: hoursAgo(base, s.received - 2), label: "Aceptaste la solicitud" });
      history.push({ at: hoursAgo(base, Math.max(1, s.received - 20)), label: "El cliente confirmó la reserva" });
    }
    if (s.status === "rechazada") history.push({ at: hoursAgo(base, s.received - 3), label: "Rechazaste la solicitud", note: "Fecha ya comprometida" });
    if (s.status === "cancelada") history.push({ at: hoursAgo(base, s.received - 30), label: "El cliente canceló la reserva" });
    if (s.status === "modificacion") history.push({ at: hoursAgo(base, s.received - 4), label: "Solicitaste cambios en las condiciones" });
    return {
      id: s.id,
      clientName: s.client,
      eventType: s.event,
      date: daysFrom(base, s.in),
      start: s.start,
      end: s.end,
      days: s.days ?? 1,
      venue: s.venue,
      guests: s.guests,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? "Servicio personalizado",
      proposedPrice: s.price,
      message: s.message,
      status: s.status,
      source: "vibra",
      changeRequest: s.status === "modificacion" ? "Confirmar si el salón tiene toma trifásica para el equipo." : undefined,
      rejectReason: s.status === "rechazada" ? "Fecha ya comprometida" : undefined,
      history,
      receivedAt: hoursAgo(base, s.received),
    };
  });
}

function service(partial: Partial<Service> & Pick<Service, "id" | "name" | "category" | "description" | "pricingMode">, base: Date): Service {
  return {
    coverId: null,
    galleryIds: [],
    basePrice: null,
    durationHours: 4,
    includes: [],
    excludes: [],
    capacity: "",
    conditions: "",
    status: "publicado",
    updatedAt: hoursAgo(base, 72),
    ...partial,
  };
}

function notifications(base: Date, items: [string, string, number, string][]): PanelNotification[] {
  return items.map(([title, body, h, href], i) => ({ id: `n${i}`, title, body, at: hoursAgo(base, h), read: i > 1, href }));
}

/* ───────────── Grupo Musical Eclipse ───────────── */

function eclipse(base: Date): ProviderWorkspace {
  const media = mediaFrom("grupo-musical-eclipse", "ecl");
  const services = [
    service({ id: "ecl_s1", name: "Show en vivo para bodas", category: "musica", pricingMode: "paquete", basePrice: 2500, durationHours: 4, description: "Rock, pop latino y cumbia en vivo con sonido profesional. Armamos el repertorio contigo, incluida la canción de entrada.", coverId: media[2]?.id ?? null, galleryIds: [media[0]?.id, media[6]?.id].filter(Boolean) as string[], includes: ["Cuatro músicos", "Sonido para 200 personas", "Repertorio personalizado"], excludes: ["Escenario o tarima", "Transporte fuera de Cochabamba"], capacity: "Hasta 300 invitados", conditions: "Necesitamos acceso al salón dos horas antes para la prueba de sonido." }, base),
    service({ id: "ecl_s2", name: "Set acústico para ceremonias", category: "musica", pricingMode: "evento", basePrice: 1200, durationHours: 1.5, description: "Formato íntimo de voz y guitarras para ceremonias, cócteles y cenas.", coverId: media[7]?.id ?? null, includes: ["Dos músicos", "Sonido compacto"], excludes: ["Iluminación"], capacity: "Hasta 120 invitados" }, base),
    service({ id: "ecl_s3", name: "Show corporativo", category: "musica", pricingMode: "cotizacion", basePrice: null, durationHours: 3, description: "Presentación a la medida de lanzamientos, aniversarios y fiestas de fin de año.", coverId: media[4]?.id ?? null, status: "borrador", includes: ["Repertorio adaptado a la marca"], excludes: [], capacity: "Según el salón" }, base),
  ];
  const addons: Addon[] = [
    { id: "ecl_a1", name: "Hora extra de show", price: 600, unit: "hora" },
    { id: "ecl_a2", name: "Iluminación de escenario", price: 450, unit: "evento" },
    { id: "ecl_a3", name: "Chispas frías para la entrada", price: 380, unit: "evento" },
  ];
  const packages: Package[] = [
    { id: "ecl_p1", name: "Paquete Básico", price: 2500, pricingMode: "paquete", previousPrice: null, discountPct: 0, durationHours: 3, capacity: "Hasta 120 invitados", benefits: ["Show de 3 horas", "Sonido básico", "Repertorio personalizado"], addonIds: ["ecl_a1"], highlighted: false },
    { id: "ecl_p2", name: "Paquete Fiesta", price: 3500, pricingMode: "paquete", previousPrice: null, discountPct: 10, durationHours: 4, capacity: "Hasta 200 invitados", benefits: ["Show de 4 horas", "Sonido profesional", "Hora loca con cotillón", "Canción de entrada"], addonIds: ["ecl_a1", "ecl_a2"], highlighted: true },
    { id: "ecl_p3", name: "Paquete Premium", price: 5000, pricingMode: "paquete", previousPrice: 5600, discountPct: 0, durationHours: 5, capacity: "Hasta 300 invitados", benefits: ["Show de 5 horas", "Sonido e iluminación de concierto", "Set acústico para la ceremonia", "Coordinador de show"], addonIds: ["ecl_a3"], highlighted: false },
  ];
  return {
    id: "eclipse",
    publicSlug: "grupo-musical-eclipse",
    kind: "musica",
    verified: true,
    rating: 4.9,
    reviewsCount: 186,
    profile: {
      businessName: "Grupo Musical Eclipse",
      tagline: "Rock, pop latino y cumbia en vivo con producción de nivel festival.",
      logoUrl: null,
      coverUrl: getProvider("grupo-musical-eclipse")?.heroImage ?? null,
      description: "Cuatro músicos cochabambinos con más de una década sobre los escenarios. Mezclamos rock, pop latino y cumbia con un show de luces y sonido que convierte cualquier celebración en un concierto.",
      categories: ["musica"],
      city: "Cochabamba",
      zone: "Zona Norte",
      phone: "+591 700 00001",
      socials: { instagram: "eclipse.demo", facebook: "", tiktok: "eclipse.demo", youtube: "" },
      yearsExperience: 11,
      featuredServiceIds: ["ecl_s1", "ecl_s2"],
      faqs: [
        { id: "ecl_f1", question: "¿Tocan fuera de Cochabamba?", answer: "Sí, cotizamos el transporte y el hospedaje aparte." },
        { id: "ecl_f2", question: "¿Podemos elegir las canciones?", answer: "Claro. Te enviamos el repertorio y armamos juntos la lista de la noche." },
      ],
      published: true,
    },
    services,
    pricing: { basePrice: 2500, pricingMode: "paquete", minimumOrder: 2000, depositPct: 30, paymentTerms: "Anticipo del 30 % para reservar la fecha; saldo el día del evento.", discountEnabled: true, discountPct: 10, discountFrom: daysFrom(base, -5), discountTo: daysFrom(base, 40) },
    packages,
    addons,
    tiers: [
      { id: "ecl_t1", basis: "horas", min: 1, max: 3, price: 2500 },
      { id: "ecl_t2", basis: "horas", min: 4, max: 5, price: 3500 },
      { id: "ecl_t3", basis: "horas", min: 6, max: null, price: 5000 },
    ],
    media,
    galleryOrder: media.map((m) => m.id),
    coverMediaId: media[2]?.id ?? null,
    availability: { restDays: [1], hours: { start: "18:00", end: "02:00" }, overrides: { [daysFrom(base, 12)]: "bloqueada" }, updatedAt: hoursAgo(base, 30) },
    requests: requests(base, services, [
      { id: "ecl_r1", in: 9, start: "20:00", end: "00:00", client: "Valeria R.", event: "Boda", venue: "Jardín de eventos, Tiquipaya", guests: 180, service: 0, price: 3500, message: "Queremos el Paquete Fiesta y una canción especial para el vals. ¿Pueden tocar una de Soda Stereo?", status: "pendiente", received: 3 },
      { id: "ecl_r2", in: 16, start: "21:00", end: "01:00", client: "Diego F.", event: "Fiesta de empresa", venue: "Salón de eventos, Av. América", guests: 120, service: 2, price: 4200, message: "Fiesta de fin de año para nuestro equipo. Necesitamos factura.", status: "pendiente", received: 20 },
      { id: "ecl_r3", in: 23, start: "19:00", end: "23:00", client: "Camila T.", event: "Quinceañero", venue: "Club social, El Prado", guests: 150, service: 0, price: 3150, message: "¿El descuento de este mes aplica al Paquete Fiesta?", status: "aceptada", received: 40 },
      { id: "ecl_r4", in: 5, start: "20:00", end: "00:00", client: "Andrés M.", event: "Aniversario", venue: "Casa de campo, Quillacollo", guests: 90, service: 0, price: 2500, message: "Celebramos 25 años de casados.", status: "confirmada", received: 120 },
      { id: "ecl_r5", in: 30, start: "17:00", end: "18:30", client: "Lucía H.", event: "Ceremonia civil", venue: "Hotel en zona Recoleta", guests: 60, service: 1, price: 1200, message: "Solo para la ceremonia y el brindis.", status: "confirmada", received: 200 },
      { id: "ecl_r6", in: 9, start: "22:00", end: "02:00", client: "Sofía A.", event: "Cumpleaños", venue: "Quinta en Vinto", guests: 80, service: 0, price: 2500, message: "¿Tienen libre ese sábado tarde?", status: "modificacion", received: 50 },
      { id: "ecl_r7", in: -10, start: "20:00", end: "00:00", client: "Martín V.", event: "Graduación", venue: "Salón en Sacaba", guests: 220, service: 0, price: 5000, message: "Promoción de ingeniería.", status: "confirmada", received: 600 },
      { id: "ecl_r8", in: 2, start: "20:00", end: "23:00", client: "Paola G.", event: "Cumpleaños", venue: "Departamento, Cala Cala", guests: 40, service: 1, price: 1200, message: "Algo tranquilo para una cena.", status: "rechazada", received: 70 },
    ]),
    promotions: [
      { id: "ecl_pr1", name: "Lunes a jueves −15 %", description: "Para eventos entre semana.", type: "porcentaje", value: 15, start: daysFrom(base, -10), end: daysFrom(base, 45), serviceIds: ["ecl_s1", "ecl_s2"], conditions: "Válido de lunes a jueves.", active: true },
      { id: "ecl_pr2", name: "Bodas de verano", description: "Bs 400 menos en el Paquete Premium.", type: "monto", value: 400, start: daysFrom(base, 30), end: daysFrom(base, 120), serviceIds: ["ecl_s1"], conditions: "Bodas entre diciembre y febrero.", active: false },
    ],
    stats: months(base, [820, 910, 760, 1040, 1180, 1320, 1250, 1490, 1610, 1540, 1730, 1880], [18, 21, 15, 24, 27, 31, 29, 34, 37, 33, 39, 42]),
    notifications: notifications(base, [
      ["Nueva solicitud de Valeria R.", "Boda para 180 invitados", 3, "/panel/solicitudes?id=ecl_r1"],
      ["Nueva solicitud de Diego F.", "Fiesta de empresa", 20, "/panel/solicitudes?id=ecl_r2"],
      ["Andrés M. confirmó su reserva", "Aniversario en Quillacollo", 100, "/panel/solicitudes?id=ecl_r4"],
      ["Tu perfil recibió 120 visitas esta semana", "Un 18 % más que la semana pasada", 160, "/panel/estadisticas"],
    ]),
    settings: { email: "eclipse@demo.vibra", notifyEmail: true, notifyWhatsapp: true, weeklySummary: true, autoDecline: false },
  };
}

/* ───────────── Catering Gourmet ───────────── */

function cateringGourmet(base: Date): ProviderWorkspace {
  const media = mediaFrom("catering-gourmet", "cat");
  const services = [
    service({ id: "cat_s1", name: "Menú tradicional", category: "catering", pricingMode: "persona", basePrice: 45, durationHours: 5, description: "Sopa de maní, pique macho o picante de pollo, y postre casero. Los sabores de Cochabamba servidos a la mesa.", coverId: media[9]?.id ?? null, includes: ["Entrada, fondo y postre", "Vajilla y mantelería", "Meseros"], excludes: ["Bebidas alcohólicas"], capacity: "De 50 a 400 personas", conditions: "Confirmar el número final de invitados 5 días antes." }, base),
    service({ id: "cat_s2", name: "Menú premium", category: "catering", pricingMode: "persona", basePrice: 75, durationHours: 6, description: "Cuatro tiempos de autor con producto del valle y emplatado de restaurante.", coverId: media[3]?.id ?? null, includes: ["Cóctel de bienvenida", "Cuatro tiempos", "Estación de postres", "Degustación previa"], excludes: ["Decoración floral"], capacity: "De 80 a 300 personas" }, base),
    service({ id: "cat_s3", name: "Menú personalizado", category: "catering", pricingMode: "cotizacion", basePrice: null, durationHours: 6, description: "Diseñamos el menú contigo: estaciones, show cooking o cena degustación.", coverId: media[1]?.id ?? null, includes: ["Reunión de diseño del menú"], excludes: [], capacity: "Según el evento" }, base),
    service({ id: "cat_s4", name: "Coffee break ejecutivo", category: "catering", pricingMode: "persona", basePrice: 25, durationHours: 2, description: "Café de especialidad, salteñas y bocaditos dulces para reuniones.", coverId: media[7]?.id ?? null, includes: ["Café y té", "Dos bocaditos salados", "Un dulce"], excludes: ["Servicio en mesa"], capacity: "Desde 20 personas" }, base),
  ];
  const addons: Addon[] = [
    { id: "cat_a1", name: "Barra de jugos naturales", price: 8, unit: "persona" },
    { id: "cat_a2", name: "Mesa de postres", price: 12, unit: "persona" },
    { id: "cat_a3", name: "Mesero adicional", price: 150, unit: "evento" },
  ];
  const packages: Package[] = [
    { id: "cat_p1", name: "Menú tradicional", price: 45, pricingMode: "persona", previousPrice: null, discountPct: 0, durationHours: 5, capacity: "Desde 50 personas", benefits: ["Tres tiempos", "Vajilla y mantelería", "Meseros"], addonIds: ["cat_a1"], highlighted: false },
    { id: "cat_p2", name: "Menú premium", price: 75, pricingMode: "persona", previousPrice: 85, discountPct: 0, durationHours: 6, capacity: "Desde 80 personas", benefits: ["Cuatro tiempos de autor", "Cóctel de bienvenida", "Degustación previa"], addonIds: ["cat_a1", "cat_a2"], highlighted: true },
    { id: "cat_p3", name: "Menú personalizado", price: null, pricingMode: "cotizacion", previousPrice: null, discountPct: 0, durationHours: 6, capacity: "A medida", benefits: ["Menú diseñado contigo", "Show cooking opcional"], addonIds: ["cat_a3"], highlighted: false },
  ];
  return {
    id: "catering-gourmet",
    publicSlug: "catering-gourmet",
    kind: "catering",
    verified: true,
    rating: 4.9,
    reviewsCount: 241,
    profile: {
      businessName: "Catering Gourmet",
      tagline: "Cocina de autor con productos del valle, servida como en un restaurante.",
      logoUrl: getProvider("catering-gourmet")?.subject.src ?? null,
      coverUrl: getProvider("catering-gourmet")?.heroImage ?? null,
      description: "Un equipo de chefs formados en Lima y Buenos Aires que reinterpreta la cocina cochabambina con técnica contemporánea. Menús a medida, servicio de mesa y degustación previa.",
      categories: ["catering"],
      city: "Cochabamba",
      zone: "Recoleta",
      phone: "+591 700 00002",
      socials: { instagram: "cateringgourmet.demo", facebook: "cateringgourmet.demo", tiktok: "", youtube: "" },
      yearsExperience: 12,
      featuredServiceIds: ["cat_s2", "cat_s1"],
      faqs: [
        { id: "cat_f1", question: "¿Tienen opciones vegetarianas?", answer: "Sí, y también sin gluten. Avísanos al confirmar el número de invitados." },
        { id: "cat_f2", question: "¿Incluyen la vajilla?", answer: "Todos los menús incluyen vajilla, mantelería y meseros." },
      ],
      published: true,
    },
    services,
    pricing: { basePrice: 45, pricingMode: "persona", minimumOrder: 2250, depositPct: 40, paymentTerms: "Anticipo del 40 % al confirmar el menú; saldo 48 horas antes del evento.", discountEnabled: false, discountPct: 0, discountFrom: daysFrom(base, 0), discountTo: daysFrom(base, 30) },
    packages,
    addons,
    tiers: [
      { id: "cat_t1", basis: "invitados", min: 50, max: 99, price: 75 },
      { id: "cat_t2", basis: "invitados", min: 100, max: 199, price: 70 },
      { id: "cat_t3", basis: "invitados", min: 200, max: null, price: 65 },
    ],
    media,
    galleryOrder: media.map((m) => m.id),
    coverMediaId: media[3]?.id ?? null,
    availability: { restDays: [], hours: { start: "08:00", end: "23:59" }, overrides: {}, updatedAt: hoursAgo(base, 400) },
    requests: requests(base, services, [
      { id: "cat_r1", in: 7, start: "13:00", end: "17:00", client: "Gabriela O.", event: "Boda", venue: "Jardín de eventos, Tiquipaya", guests: 180, service: 1, price: 13500, message: "¿Podemos hacer una degustación la semana que viene?", status: "pendiente", received: 5 },
      { id: "cat_r2", in: 3, start: "09:30", end: "11:30", client: "Rodrigo P.", event: "Reunión de directorio", venue: "Oficinas, Av. Ballivián", guests: 35, service: 3, price: 875, message: "Coffee break para 35 personas a las 9:30.", status: "pendiente", received: 26 },
      { id: "cat_r3", in: 14, start: "20:00", end: "00:00", client: "Fernando R.", event: "Aniversario", venue: "Hotel en zona Recoleta", guests: 120, service: 0, price: 5400, message: "Menú tradicional con opción vegetariana para 15 personas.", status: "aceptada", received: 60 },
      { id: "cat_r4", in: 21, start: "19:00", end: "23:00", client: "Andrea M.", event: "Cumpleaños 50", venue: "Casa particular, Queru Queru", guests: 70, service: 1, price: 5250, message: "Cena de cuatro tiempos.", status: "confirmada", received: 150 },
      { id: "cat_r5", in: 11, start: "12:00", end: "16:00", client: "Martín V.", event: "Bautizo", venue: "Salón parroquial, Sarco", guests: 90, service: 0, price: 4050, message: "Almuerzo después de la ceremonia.", status: "confirmada", received: 300 },
      { id: "cat_r6", in: 28, start: "19:00", end: "23:00", client: "Natalia V.", event: "Cena de gala", venue: "Club social, El Prado", guests: 250, service: 2, price: 22000, message: "Necesitamos estaciones y show cooking.", status: "modificacion", received: 80 },
    ]),
    promotions: [
      { id: "cat_pr1", name: "Eventos corporativos −15 %", description: "Para empresas e instituciones.", type: "porcentaje", value: 15, start: daysFrom(base, -20), end: daysFrom(base, 70), serviceIds: ["cat_s1", "cat_s2", "cat_s4"], conditions: "Con factura a nombre de la empresa.", active: true },
    ],
    stats: months(base, [1100, 1240, 1180, 1390, 1460, 1520, 1610, 1580, 1720, 1890, 1950, 2100], [22, 25, 23, 28, 30, 33, 35, 31, 38, 41, 44, 47]),
    notifications: notifications(base, [
      ["Nueva solicitud de Gabriela O.", "Boda para 180 invitados", 5, "/panel/solicitudes?id=cat_r1"],
      ["Nueva solicitud de Rodrigo P.", "Coffee break para 35", 26, "/panel/solicitudes?id=cat_r2"],
      ["Tu calendario necesita revisión", "No lo actualizas hace más de dos semanas", 48, "/panel/calendario"],
    ]),
    settings: { email: "gourmet@demo.vibra", notifyEmail: true, notifyWhatsapp: false, weeklySummary: true, autoDecline: false },
  };
}

/* ───────────── DJ NightFlow ───────────── */

function nightflow(base: Date): ProviderWorkspace {
  const media = mediaFrom("dj-nightflow", "dj");
  const services = [
    service({ id: "dj_s1", name: "Set para fiestas", category: "dj", pricingMode: "evento", basePrice: 1800, durationHours: 5, description: "Reggaetón, house y clásicos latinos con transiciones limpias y luces sincronizadas.", coverId: media[0]?.id ?? null, includes: ["Equipo DJ profesional", "Luces LED", "Playlist acordada"], excludes: ["Pantalla LED"], capacity: "Hasta 250 invitados" }, base),
    service({ id: "dj_s2", name: "Hora extra", category: "dj", pricingMode: "hora", basePrice: 350, durationHours: 1, description: "Para cuando la pista no quiere parar.", coverId: media[3]?.id ?? null, includes: ["Música continua"], excludes: [], capacity: "" }, base),
  ];
  const addons: Addon[] = [
    { id: "dj_a1", name: "Máquina de humo", price: 200, unit: "evento" },
    { id: "dj_a2", name: "Pantalla LED con visuales", price: 900, unit: "evento" },
  ];
  const packages: Package[] = [
    { id: "dj_p1", name: "Set Esencial", price: 1800, pricingMode: "paquete", previousPrice: null, discountPct: 0, durationHours: 5, capacity: "Hasta 150", benefits: ["Equipo profesional", "Luces LED"], addonIds: ["dj_a1"], highlighted: false },
    { id: "dj_p2", name: "Set Club", price: 2900, pricingMode: "paquete", previousPrice: null, discountPct: 0, durationHours: 6, capacity: "Hasta 250", benefits: ["Sonido line array", "Show de luces sincronizado", "Hora loca"], addonIds: ["dj_a1", "dj_a2"], highlighted: true },
  ];
  return {
    id: "nightflow",
    publicSlug: "dj-nightflow",
    kind: "dj",
    verified: true,
    rating: 5.0,
    reviewsCount: 214,
    profile: {
      businessName: "DJ NightFlow",
      tagline: "Sets que leen la pista y no la sueltan hasta el amanecer.",
      logoUrl: getProvider("dj-nightflow")?.subject.src ?? null,
      coverUrl: getProvider("dj-nightflow")?.heroImage ?? null,
      description: "Residente de los clubes más exigentes de Cochabamba. Combino reggaetón, house y clásicos latinos con transiciones limpias y un show de luces sincronizado.",
      categories: ["dj"],
      city: "Cochabamba",
      zone: "Centro",
      phone: "+591 700 00003",
      socials: { instagram: "nightflow.demo", facebook: "", tiktok: "nightflow.demo", youtube: "nightflow.demo" },
      yearsExperience: 8,
      featuredServiceIds: ["dj_s1"],
      faqs: [{ id: "dj_f1", question: "¿Aceptas pedidos durante la fiesta?", answer: "Sí, siempre que mantengan la pista arriba." }],
      published: true,
    },
    services,
    pricing: { basePrice: 1800, pricingMode: "evento", minimumOrder: 1500, depositPct: 50, paymentTerms: "50 % para reservar y 50 % al terminar el montaje.", discountEnabled: false, discountPct: 0, discountFrom: daysFrom(base, 0), discountTo: daysFrom(base, 30) },
    packages,
    addons,
    tiers: [
      { id: "dj_t1", basis: "horas", min: 1, max: 5, price: 1800 },
      { id: "dj_t2", basis: "horas", min: 6, max: null, price: 2400 },
    ],
    media,
    galleryOrder: media.map((m) => m.id),
    coverMediaId: media[0]?.id ?? null,
    availability: { restDays: [0], hours: { start: "20:00", end: "04:00" }, overrides: {}, updatedAt: hoursAgo(base, 10) },
    requests: requests(base, services, [
      { id: "dj_r1", in: 4, start: "22:00", end: "03:00", client: "Mariana C.", event: "Boda", venue: "Salón de eventos, Tiquipaya", guests: 200, service: 0, price: 2900, message: "Después de la banda, desde las 22:00.", status: "pendiente", received: 2 },
      { id: "dj_r2", in: 4, start: "21:00", end: "01:00", client: "Javier S.", event: "Fiesta privada", venue: "Quinta en Vinto", guests: 80, service: 0, price: 1800, message: "¿Puedes ese viernes?", status: "pendiente", received: 6 },
      { id: "dj_r3", in: 10, start: "21:00", end: "02:00", client: "Daniela P.", event: "Graduación", venue: "Discoteca, El Prado", guests: 300, service: 0, price: 3300, message: "Necesitamos visuales con el logo de la promo.", status: "confirmada", received: 220 },
    ]),
    promotions: [],
    stats: months(base, [1500, 1620, 1580, 1750, 1900, 2050, 2200, 2150, 2310, 2400, 2550, 2700], [30, 32, 28, 35, 38, 41, 44, 40, 46, 49, 52, 55]),
    notifications: notifications(base, [
      ["Nueva solicitud de Mariana C.", "Boda para 200 invitados", 2, "/panel/solicitudes?id=dj_r1"],
      ["Nueva solicitud de Javier S.", "Fiesta privada", 6, "/panel/solicitudes?id=dj_r2"],
    ]),
    settings: { email: "nightflow@demo.vibra", notifyEmail: false, notifyWhatsapp: true, weeklySummary: false, autoDecline: false },
  };
}

/* ───────────── Cervecería Andes Craft ───────────── */

function andesCraft(base: Date): ProviderWorkspace {
  const media = mediaFrom("cerveceria-andes-craft", "and").slice(0, 4);
  const services = [
    service({ id: "and_s1", name: "Barra móvil de grifos", category: "bebidas", pricingMode: "evento", basePrice: 1500, durationHours: 4, description: "Cuatro estilos de cerveza artesanal servidos por un bartender certificado.", coverId: media[1]?.id ?? null, includes: ["Barra móvil", "50 litros", "Bartender"], excludes: ["Vasos personalizados"], capacity: "Hasta 120 invitados" }, base),
    service({ id: "and_s2", name: "Degustación guiada", category: "bebidas", pricingMode: "persona", basePrice: 40, durationHours: 1.5, description: "Seis estilos con maridaje y la historia de cada cerveza.", coverId: media[3]?.id ?? null, includes: ["Seis muestras", "Maridaje"], excludes: [], capacity: "De 10 a 40 personas", status: "borrador" }, base),
  ];
  return {
    id: "andes-craft",
    publicSlug: "cerveceria-andes-craft",
    kind: "bebidas",
    verified: false,
    rating: 4.9,
    reviewsCount: 121,
    profile: {
      businessName: "Cervecería Andes Craft",
      tagline: "Cerveza artesanal de altura, servida desde nuestra barra móvil.",
      logoUrl: null,
      coverUrl: getProvider("cerveceria-andes-craft")?.heroImage ?? null,
      description: "Elaboramos en pequeños lotes.",
      categories: ["bebidas"],
      city: "Cochabamba",
      zone: "",
      phone: "",
      socials: { instagram: "", facebook: "", tiktok: "", youtube: "" },
      yearsExperience: 7,
      featuredServiceIds: [],
      faqs: [],
      published: false,
    },
    services,
    pricing: { basePrice: 1500, pricingMode: "evento", minimumOrder: 0, depositPct: 0, paymentTerms: "", discountEnabled: false, discountPct: 0, discountFrom: daysFrom(base, 0), discountTo: daysFrom(base, 30) },
    packages: [],
    addons: [],
    tiers: [],
    media,
    galleryOrder: media.map((m) => m.id),
    coverMediaId: media[1]?.id ?? null,
    availability: { restDays: [1, 2], hours: { start: "12:00", end: "23:00" }, overrides: {}, updatedAt: hoursAgo(base, 900) },
    requests: requests(base, services, [
      { id: "and_r1", in: 8, start: "19:00", end: "23:00", client: "Carlos A.", event: "Fiesta de empresa", venue: "Terraza, Av. Pando", guests: 100, service: 0, price: 1500, message: "¿Incluyen hielo y mesas altas?", status: "pendiente", received: 12 },
    ]),
    promotions: [],
    stats: months(base, [300, 340, 310, 380, 420, 400, 450, 470, 430, 500, 520, 560], [4, 5, 3, 6, 7, 6, 8, 9, 7, 10, 11, 12]),
    notifications: notifications(base, [["Completa tu perfil para publicarlo", "Faltan la descripción, el teléfono y los precios", 12, "/panel"]]),
    settings: { email: "andescraft@demo.vibra", notifyEmail: true, notifyWhatsapp: false, weeklySummary: false, autoDecline: false },
  };
}

export function createDemoWorkspaces(base = new Date()): Record<DemoProviderId, ProviderWorkspace> {
  return {
    eclipse: eclipse(base),
    "catering-gourmet": cateringGourmet(base),
    nightflow: nightflow(base),
    "andes-craft": andesCraft(base),
  };
}

export function createDemoWorkspace(id: DemoProviderId, base = new Date()) {
  return createDemoWorkspaces(base)[id];
}
