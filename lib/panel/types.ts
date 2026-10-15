/**
 * Data model of the provider panel. Every record belongs to one provider workspace; the store only ever edits
 * the active workspace, which mirrors how a backend would scope rows by provider id.
 */

export type ProviderKind =
  | "musica"
  | "dj"
  | "catering"
  | "bebidas"
  | "fotografia"
  | "decoracion"
  | "sonido"
  | "salon"
  | "otro";

export type PricingMode = "evento" | "hora" | "persona" | "paquete" | "cotizacion";

export interface MediaItem {
  id: string;
  url: string;
  title: string;
  alt: string;
  /** "local" items are object URLs created in this browser tab and must be revoked when dropped. */
  source: "demo" | "local";
  fileName?: string;
  size?: number;
}

export interface Service {
  id: string;
  name: string;
  category: ProviderKind;
  description: string;
  coverId: string | null;
  galleryIds: string[];
  basePrice: number | null;
  pricingMode: PricingMode;
  durationHours: number;
  includes: string[];
  excludes: string[];
  capacity: string;
  conditions: string;
  status: "borrador" | "publicado";
  updatedAt: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  unit: "evento" | "hora" | "persona";
}

export interface Package {
  id: string;
  name: string;
  price: number | null;
  pricingMode: PricingMode;
  previousPrice: number | null;
  discountPct: number;
  durationHours: number;
  capacity: string;
  benefits: string[];
  addonIds: string[];
  highlighted: boolean;
}

export interface PriceTier {
  id: string;
  basis: "invitados" | "horas";
  min: number;
  max: number | null;
  price: number;
}

export interface PricingSettings {
  basePrice: number;
  pricingMode: PricingMode;
  minimumOrder: number;
  depositPct: number;
  paymentTerms: string;
  discountEnabled: boolean;
  discountPct: number;
  discountFrom: string;
  discountTo: string;
}

export type RequestStatus = "pendiente" | "modificacion" | "aceptada" | "confirmada" | "rechazada" | "cancelada";

export interface RequestEvent {
  at: string;
  label: string;
  note?: string;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  eventType: string;
  /** yyyy-mm-dd */
  date: string;
  start: string;
  end: string;
  /** Number of consecutive days the service runs, for multi-day events. */
  days: number;
  venue: string;
  guests: number | null;
  serviceId: string | null;
  serviceName: string;
  proposedPrice: number;
  message: string;
  status: RequestStatus;
  /** "manual" bookings are entered by the provider from the calendar. */
  source: "vibra" | "manual";
  counterOffer?: { price: number; conditions: string; message: string };
  changeRequest?: string;
  rejectReason?: string;
  history: RequestEvent[];
  receivedAt: string;
}

export type DayOverride = "disponible" | "bloqueada";

export interface Availability {
  /** 0 = domingo … 6 = sábado */
  restDays: number[];
  hours: { start: string; end: string };
  overrides: Record<string, DayOverride>;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "porcentaje" | "monto";
  value: number;
  start: string;
  end: string;
  serviceIds: string[];
  conditions: string;
  active: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface PublicProfile {
  businessName: string;
  tagline: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string;
  categories: ProviderKind[];
  city: string;
  zone: string;
  phone: string;
  socials: { instagram: string; facebook: string; tiktok: string; youtube: string };
  yearsExperience: number;
  featuredServiceIds: string[];
  faqs: Faq[];
  published: boolean;
}

export interface MonthlyStat {
  month: string;
  visits: number;
  requests: number;
}

export interface PanelNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
}

export interface PanelSettings {
  email: string;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  weeklySummary: boolean;
  autoDecline: boolean;
}

export interface ProviderWorkspace {
  id: string;
  /** Slug of the public profile page that already exists on the site. */
  publicSlug: string;
  kind: ProviderKind;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  profile: PublicProfile;
  services: Service[];
  pricing: PricingSettings;
  packages: Package[];
  addons: Addon[];
  tiers: PriceTier[];
  media: MediaItem[];
  /** Media ids in display order; the first one is the main photo. */
  galleryOrder: string[];
  coverMediaId: string | null;
  availability: Availability;
  requests: BookingRequest[];
  promotions: Promotion[];
  stats: MonthlyStat[];
  notifications: PanelNotification[];
  settings: PanelSettings;
}
