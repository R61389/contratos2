export type EmblemVariant =
  | "eclipse"
  | "waves"
  | "vinyl"
  | "pulse"
  | "cloche"
  | "crown"
  | "peaks"
  | "hop";

export type GalleryTag =
  | "Fotos"
  | "Escenarios"
  | "Eventos"
  | "Público"
  | "Buffets"
  | "Decoración"
  | "Mesas"
  | "Chef en acción";

export type GalleryShape = "landscape" | "portrait" | "square" | "tall";

export interface GalleryItem {
  src: string;
  alt: string;
  tag: GalleryTag;
  width: number;
  height: number;
}

export interface VideoItem {
  src: string;
  poster: string;
  title: string;
  subtitle: string;
}

export interface TeamMember {
  name: string;
  role: string;
  years?: number;
  photo: string;
  cutout?: boolean;
}

/** Either an audio file the provider owns, or an embeddable video from their official YouTube channel. */
export type Track = {
  title: string;
  /** Defaults to the provider's name; set it when the recording is by someone else. */
  artist?: string;
} & ({ src: string; youtubeId?: never } | { youtubeId: string; src?: never });

export interface Review {
  name: string;
  event: string;
  date: string;
  rating: number;
  quote: string;
}

export interface Package {
  name: string;
  price: number;
  unit?: string;
  duration: string;
  perks: string[];
  recommended?: boolean;
}

export interface MenuCourses {
  entradas: string[];
  principal: string[];
  postres: string[];
  bebidas: string[];
}

export interface CateringMenu {
  id: string;
  name: string;
  tagline: string;
  image: string;
  pricePerPerson: number;
  minGuests: number;
  serviceTime: string;
  badge?: string;
  courses: MenuCourses;
}

export interface Testimonial extends Review {
  photo: string;
  guests: number;
}

/** Extra content for catering companies; when present the profile uses the gastronomy layout. */
export interface CateringDetails {
  heroWords: [string, string];
  guestsServed: number;
  satisfaction: number;
  menus: CateringMenu[];
  /** One waiter is assigned per this many guests. */
  guestsPerWaiter: number;
  /** Size of the service staff, shared across same-day events. */
  staffPool: number;
  corporateDiscount: number;
  weekdayDiscount: number;
  perks: { title: string; description: string }[];
  testimonials: Testimonial[];
}

export interface Provider {
  slug: string;
  name: string;
  fullName: string;
  category: "Artista" | "Grupo Musical" | "DJ" | "Catering" | "Bebidas";
  kicker: string;
  heroWord: string;
  tagline: string;
  bio: string;
  tags: string[];
  rating: number;
  reviewsCount: number;
  eventsCount: number;
  yearsActive: number;
  responseTime: string;
  location: string;
  heroImage: string;
  emblem: EmblemVariant;
  /** Official artwork; when present it replaces the generated emblem. */
  logo?: { src: string; width: number; height: number; alt: string };
  /** Played while the visitor is on the profile. */
  music?: { cover: string; tracks: Track[] };
  subject: {
    src: string;
    width: number;
    height: number;
    alt: string;
    heightPct: number;
    anchor: "center" | "right";
  };
  price: {
    from: number;
    unit?: string;
    includes: string[];
    monthlyBookings: number;
  };
  promo: {
    discount: number;
    title: string;
    description: string;
    validUntil: string;
  };
  gallery: GalleryItem[];
  videos: VideoItem[];
  teamTitle: string;
  team: TeamMember[];
  reviews: Review[];
  packages: Package[];
  whatsapp: string;
  catering?: CateringDetails;
}

// Placeholder contact number; replace per provider when onboarding.
const WHATSAPP = "59170000000";

function unsplash(id: string, w: number, h: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
}

const SHAPES: Record<GalleryShape, [number, number]> = {
  landscape: [1200, 800],
  portrait: [960, 1200],
  square: [1000, 1000],
  tall: [800, 1200],
};

function photo(id: string, tag: GalleryTag, alt: string, shape: GalleryShape): GalleryItem {
  const [width, height] = SHAPES[shape];
  return { src: unsplash(id, width, height), alt, tag, width, height };
}

function hero(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=80`;
}

function clip(id: number, title: string, subtitle: string): VideoItem {
  return {
    src: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
    poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
    title,
    subtitle,
  };
}

function portrait(id: string) {
  return unsplash(id, 720, 900);
}

const MUSIC_GALLERY: GalleryItem[] = [
  photo("photo-1493225457124-a3eb161ffa5f", "Escenarios", "Vocalista entre humo y luces de escenario", "portrait"),
  photo("photo-1501386761578-eac5c94b800a", "Público", "Público cantando en primera fila", "landscape"),
  photo("photo-1470229722913-7c0e2dbbafd3", "Escenarios", "Escenario iluminado frente a una multitud", "landscape"),
  photo("photo-1504898770365-14faca6a7320", "Fotos", "Artista envuelta en humo rosa", "tall"),
  photo("photo-1516450360452-9312f5e86fc7", "Eventos", "Concierto con luces de colores", "square"),
  photo("photo-1429962714451-bb934ecdc4ec", "Público", "Público formando corazones con las manos", "landscape"),
  photo("photo-1557787163-1635e2efb160", "Escenarios", "Reflectores sobre el público", "portrait"),
  photo("photo-1511671782779-c97d3d27a1d4", "Fotos", "Micrófono clásico con luces de fondo", "square"),
  photo("photo-1459749411175-04bf5292ceea", "Eventos", "Show con luces doradas", "landscape"),
  photo("photo-1514320291840-2e0a9bf2a9ae", "Escenarios", "Escenario listo para la prueba de sonido", "tall"),
];

const DJ_GALLERY: GalleryItem[] = [
  photo("photo-1470225620780-dba8ba36b745", "Fotos", "Manos del DJ sobre los platos con luz violeta", "landscape"),
  photo("photo-1493676304819-0d7a8d026dcf", "Escenarios", "DJ frente a un festival al aire libre", "tall"),
  photo("photo-1642178225043-f299072af862", "Fotos", "Controlador DJ iluminado", "square"),
  photo("photo-1574391884720-bbc3740c59d1", "Eventos", "Pista de baile en penumbra", "portrait"),
  photo("photo-1514525253161-7a46d19cd819", "Público", "Láseres de colores sobre el público", "landscape"),
  photo("photo-1492684223066-81342ee5ff30", "Eventos", "Lluvia de confeti en el escenario", "square"),
  photo("photo-1533174072545-7a4b6ad7a6c3", "Público", "Festival nocturno con luces blancas", "tall"),
  photo("photo-1505236858219-8359eb29e329", "Público", "Confeti sobre la multitud", "landscape"),
];

const CATERING_GALLERY: GalleryItem[] = [
  photo("photo-1555244162-803834f70033", "Buffets", "Buffet con fuentes de acero y guarniciones", "landscape"),
  photo("photo-1600565193348-f74bd3c7ccdf", "Chef en acción", "Chef flameando en la cocina", "tall"),
  photo("photo-1511795409834-ef04bbd61622", "Decoración", "Mesa con flores y cristalería", "portrait"),
  photo("photo-1467003909585-2f8a72700288", "Fotos", "Salmón sellado con vegetales frescos", "square"),
  photo("photo-1464366400600-7168b8af9bc3", "Mesas", "Salón montado para un banquete", "landscape"),
  photo("photo-1577106263724-2c8e03bfe9cf", "Chef en acción", "Emplatado con pinzas de precisión", "portrait"),
  photo("photo-1528605248644-14dd04022da1", "Eventos", "Invitados compartiendo una cena larga", "landscape"),
  photo("photo-1540914124281-342587941389", "Buffets", "Tabla de tostadas y bocaditos", "square"),
  photo("photo-1519225421980-715cb0215aed", "Decoración", "Mesa larga decorada para boda", "tall"),
  photo("photo-1529692236671-f1f6cf9683ba", "Fotos", "Corte de carne a la parrilla", "landscape"),
  photo("photo-1550966871-3ed3cdb5ed0c", "Mesas", "Mesas vestidas frente al ventanal", "portrait"),
  photo("photo-1577219491135-ce391730fb2c", "Chef en acción", "Chef concentrado en el pase", "square"),
  photo("photo-1414235077428-338989a2e8c0", "Eventos", "Plato de autor servido en mesa de gala", "landscape"),
  photo("photo-1563805042-7684c019e1cb", "Fotos", "Postre en copa con chocolate", "tall"),
];

function dish(id: string) {
  return unsplash(id, 1400, 1000);
}

const CATERING_MENUS: CateringMenu[] = [
  {
    id: "buffet-ejecutivo",
    name: "Buffet Ejecutivo",
    tagline: "Práctico, abundante y servido a tiempo para tu equipo.",
    image: dish("photo-1555244162-803834f70033"),
    pricePerPerson: 85,
    minGuests: 50,
    serviceTime: "4 horas",
    courses: {
      entradas: ["Ensalada César con crutones", "Crema de zapallo con semillas"],
      principal: ["Pollo al romero con papas doradas", "Lomo saltado al wok", "Arroz pilaf con almendras"],
      postres: ["Mousse de maracuyá", "Brownie tibio"],
      bebidas: ["Limonada de hierbabuena", "Jugos naturales del valle", "Café y té"],
    },
  },
  {
    id: "buffet-premium",
    name: "Buffet Premium",
    tagline: "Estaciones de autor y emplatados que se sienten de restaurante.",
    image: dish("photo-1467003909585-2f8a72700288"),
    pricePerPerson: 140,
    minGuests: 80,
    serviceTime: "6 horas",
    badge: "Más elegido",
    courses: {
      entradas: ["Tiradito de trucha del Titicaca", "Burrata con tomates confitados", "Canapés del chef"],
      principal: ["Salmón sellado con beurre blanc", "Medallón de lomo en reducción de vino", "Risotto de hongos andinos"],
      postres: ["Mesa de postres de autor", "Tartaleta de frutos rojos", "Macarons de la casa"],
      bebidas: ["Cóctel de bienvenida", "Estación de limonadas", "Vino de Tarija (copa de brindis)"],
    },
  },
  {
    id: "parrillada",
    name: "Parrillada",
    tagline: "Fuego, cortes seleccionados y parrilleros en vivo.",
    image: dish("photo-1555939594-58d7cb561ad1"),
    pricePerPerson: 120,
    minGuests: 40,
    serviceTime: "5 horas",
    courses: {
      entradas: ["Chorizo artesanal con chimichurri", "Provoleta a la parrilla", "Ensaladas de estación"],
      principal: ["Bife de chorizo y picaña", "Costillas de cerdo glaseadas", "Papas rústicas y choclo asado"],
      postres: ["Panqueques con dulce de leche", "Frutas a la brasa"],
      bebidas: ["Refrescos y agua saborizada", "Chicha morada", "Cerveza artesanal (opcional)"],
    },
  },
  {
    id: "menu-tradicional",
    name: "Menú Tradicional",
    tagline: "Los sabores de Cochabamba, cocinados como en casa.",
    image: dish("photo-1594041680534-e8c8cdebd659"),
    pricePerPerson: 75,
    minGuests: 50,
    serviceTime: "4 horas",
    courses: {
      entradas: ["Sopa de maní con papas fritas", "Llajua y pan de batán"],
      principal: ["Pique macho", "Lechón al horno con camote", "Picante de pollo con chuño"],
      postres: ["Helado de canela", "Buñuelos con miel de caña"],
      bebidas: ["Mocochinchi", "Somó", "Café de los Yungas"],
    },
  },
  {
    id: "menu-internacional",
    name: "Menú Internacional",
    tagline: "Un recorrido por Italia, Perú y el Mediterráneo en cuatro tiempos.",
    image: dish("photo-1563379926898-05f4575a45d8"),
    pricePerPerson: 160,
    minGuests: 60,
    serviceTime: "6 horas",
    badge: "Gourmet",
    courses: {
      entradas: ["Ceviche clásico de pescado", "Carpaccio de res con rúcula", "Hummus y pan pita"],
      principal: ["Linguine a los frutos del mar", "Pollo tikka masala con arroz basmati", "Lomo Wellington"],
      postres: ["Tiramisú", "Crème brûlée", "Suspiro limeño"],
      bebidas: ["Sangría sin alcohol", "Agua de Jamaica", "Selección de vinos (opcional)"],
    },
  },
  {
    id: "coffee-break",
    name: "Coffee Break",
    tagline: "Pausas que se recuerdan, para reuniones y lanzamientos.",
    image: dish("photo-1509042239860-f550ce710b93"),
    pricePerPerson: 35,
    minGuests: 20,
    serviceTime: "2 horas",
    courses: {
      entradas: ["Mini sándwiches gourmet", "Empanadas de queso"],
      principal: ["Salteñas de pollo y carne", "Wraps de vegetales asados"],
      postres: ["Alfajores de maicena", "Cupcakes y galletas de mantequilla"],
      bebidas: ["Café de especialidad", "Selección de tés", "Jugos naturales"],
    },
  },
];

function scaleMenus(factor: number): CateringMenu[] {
  return CATERING_MENUS.map((m) => ({ ...m, pricePerPerson: Math.round((m.pricePerPerson * factor) / 5) * 5 }));
}

const CATERING_PERKS: CateringDetails["perks"] = [
  { title: "Degustación sin costo", description: "Para eventos desde 150 invitados." },
  { title: "Coffee break 2×1", description: "Reuniones de lunes a jueves." },
  { title: "Torta de cortesía", description: "En bodas con Buffet Premium." },
];

function testimonials(reviews: Review[]): Testimonial[] {
  const photos = [
    "photo-1519225421980-715cb0215aed",
    "photo-1414235077428-338989a2e8c0",
    "photo-1528605248644-14dd04022da1",
    "photo-1464366400600-7168b8af9bc3",
    "photo-1511795409834-ef04bbd61622",
  ];
  const guests = [180, 120, 90, 150, 70];
  return reviews.map((r, i) => ({ ...r, photo: unsplash(photos[i % photos.length], 1200, 1400), guests: guests[i % guests.length] }));
}

const BEER_GALLERY: GalleryItem[] = [
  photo("photo-1608270586620-248524c67de9", "Fotos", "Jarra de cerveza dorada sobre fondo negro", "square"),
  photo("photo-1535958636474-b021ee887b13", "Escenarios", "Cerveza servida desde el grifo", "tall"),
  photo("photo-1566633806327-68e152aaf26d", "Eventos", "Cerveza artesanal con picoteo", "landscape"),
  photo("photo-1559818454-1b46997bfe30", "Fotos", "Degustación de estilos sobre la barra", "tall"),
  photo("photo-1584225064785-c62a8b43d148", "Escenarios", "Tabla de degustación en la barra", "landscape"),
  photo("photo-1575037614876-c38a4d44f5b8", "Público", "Amigos brindando con cerveza", "landscape"),
  photo("photo-1586993451228-09818021e309", "Fotos", "Salpicadura de cerveza en jarra", "portrait"),
  photo("photo-1571613316887-6f8d5cbf7ef7", "Fotos", "Espuma y burbujas en primer plano", "square"),
  photo("photo-1543007630-9710e4a00a20", "Escenarios", "Barra iluminada lista para el evento", "tall"),
];

const MUSIC_VIDEOS: VideoItem[] = [
  clip(14756, "Noche de rock", "Presentación en vivo"),
  clip(486, "Solo de guitarra", "Fiesta de graduación"),
  clip(48509, "Todos a coro", "Concierto privado"),
  clip(472, "Batería al máximo", "Boda en Tiquipaya"),
  clip(11942, "Escenario principal", "Festival de verano"),
  clip(14084, "La pista explota", "Quinceañero"),
];

const DJ_VIDEOS: VideoItem[] = [
  clip(4187, "Set con pantallas LED", "Presentación en vivo"),
  clip(832, "Noche de club", "Fiesta privada"),
  clip(4026, "Festival al aire libre", "Open air"),
  clip(42421, "Mezcla en vivo", "Evento corporativo"),
  clip(4126, "Set híbrido", "Graduación"),
  clip(4344, "La pista llena", "Boda"),
];

const FOOD_VIDEOS: VideoItem[] = [
  clip(4672, "Servicio a la mesa", "Cena de gala"),
  clip(44001, "Estación de pizzas", "Cumpleaños"),
  clip(3806, "Cocina en vivo", "Show cooking"),
  clip(10420, "Ingredientes frescos", "Detrás de escena"),
  clip(48636, "El brindis", "Boda"),
];

const BEER_VIDEOS: VideoItem[] = [
  clip(8710, "Barra de grifos", "Presentación en vivo"),
  clip(8692, "El servido perfecto", "Detrás de escena"),
  clip(52410, "Golden Ale", "Lanzamiento"),
  clip(24839, "Brindis artesanal", "Fiesta de empresa"),
  clip(8711, "Ambiente de barra", "Boda"),
  clip(48636, "Celebración", "Aniversario"),
];

const MUSIC_REVIEWS: Review[] = [
  { name: "Valeria Rocha", event: "Boda", date: "Septiembre 2026", rating: 5, quote: "Desde la primera canción la pista no se vació. El sonido impecable y el repertorio exactamente lo que pedimos." },
  { name: "Diego Fernández", event: "Fiesta de empresa", date: "Agosto 2026", rating: 5, quote: "Puntuales, profesionales y con una energía increíble. Nuestro equipo todavía habla del show." },
  { name: "Camila Torrez", event: "Quinceañero", date: "Julio 2026", rating: 5, quote: "Prepararon una sorpresa con la canción favorita de mi hija. Fue el momento más emotivo de la noche." },
  { name: "Luis Mendoza", event: "Cumpleaños 30", date: "Junio 2026", rating: 4, quote: "Gran show y mucha interacción con el público. Repetiríamos sin dudarlo." },
  { name: "Sofía Antezana", event: "Graduación", date: "Mayo 2026", rating: 5, quote: "Se sintió como un concierto de verdad. Luces, sonido y actitud de nivel festival." },
];

const DJ_REVIEWS: Review[] = [
  { name: "Mariana Céspedes", event: "Boda", date: "Septiembre 2026", rating: 5, quote: "Leyó a la gente toda la noche. Pasó de cumbia a electrónica sin que nadie dejara de bailar." },
  { name: "Javier Salazar", event: "Fiesta privada", date: "Agosto 2026", rating: 5, quote: "Equipo de primera y las luces LED cambiaron por completo el ambiente del salón." },
  { name: "Daniela Paz", event: "Graduación", date: "Julio 2026", rating: 5, quote: "Armamos la playlist juntos y la mezcló perfecto. Súper atento a cada pedido." },
  { name: "Rodrigo Arce", event: "Evento corporativo", date: "Junio 2026", rating: 4, quote: "Muy profesional, llegó con tiempo para la prueba de sonido. Recomendado." },
  { name: "Paola Guzmán", event: "Cumpleaños", date: "Mayo 2026", rating: 5, quote: "La mejor fiesta que organicé. La pista estuvo llena hasta el final." },
];

const CATERING_REVIEWS: Review[] = [
  { name: "Gabriela Ortiz", event: "Boda", date: "Septiembre 2026", rating: 5, quote: "Cada plato llegó perfecto y a tiempo para 180 invitados. La presentación fue de restaurante de autor." },
  { name: "Martín Villarroel", event: "Cena corporativa", date: "Agosto 2026", rating: 5, quote: "El servicio de mesa impecable y la degustación previa nos ayudó a elegir sin dudas." },
  { name: "Lucía Herrera", event: "Bautizo", date: "Julio 2026", rating: 5, quote: "Se adaptaron a invitados vegetarianos y celíacos sin ningún problema." },
  { name: "Fernando Rojas", event: "Aniversario", date: "Junio 2026", rating: 4, quote: "Comida deliciosa y abundante. El equipo muy amable durante todo el evento." },
  { name: "Andrea Molina", event: "Cumpleaños 50", date: "Mayo 2026", rating: 5, quote: "Los invitados pidieron el contacto del chef. No hay mejor reseña que esa." },
];

const BEER_REVIEWS: Review[] = [
  { name: "Carlos Aguilar", event: "Fiesta de empresa", date: "Septiembre 2026", rating: 5, quote: "La barra de grifos fue el centro de la fiesta. Cuatro estilos y todos espectaculares." },
  { name: "Natalia Vega", event: "Boda", date: "Agosto 2026", rating: 5, quote: "El bartender explicó cada estilo a los invitados. Un detalle que hizo la diferencia." },
  { name: "Sergio Quispe", event: "Cumpleaños", date: "Julio 2026", rating: 5, quote: "Cerveza siempre fría y servida perfecto. Se nota la pasión por el oficio." },
  { name: "Mónica Lazo", event: "Despedida de soltero", date: "Junio 2026", rating: 4, quote: "Excelente variedad y muy buen precio por litro. Volveremos a contratar." },
  { name: "Ricardo Soria", event: "Aniversario", date: "Mayo 2026", rating: 5, quote: "La degustación guiada fue el momento más divertido de la noche." },
];

export const PROVIDERS: Provider[] = [
  {
    slug: "luis-vega",
    name: "Luis Vega",
    fullName: "Luis Vega",
    category: "Artista",
    kicker: "Regional Mexicano",
    heroWord: "LUIS VEGA",
    tagline: "Regional mexicano en vivo: corridos, románticas y los éxitos que todos cantan.",
    bio: "Cantautor boliviano de regional mexicano y corridos, elegido Artista Masculino del Año en los Bolivia Music Awards 2023 y 2024. Un show con banda completa, pensado para que tus invitados canten de principio a fin, con repertorio a la medida de tu celebración.",
    tags: ["Regional mexicano", "Corridos", "Banda en vivo", "Bodas", "Quinceañeros", "Fiestas privadas"],
    rating: 4.9,
    reviewsCount: 152,
    eventsCount: 180,
    yearsActive: 10,
    responseTime: "menos de 2 h",
    location: "Santa Cruz de la Sierra, Bolivia",
    heroImage: hero("photo-1459749411175-04bf5292ceea"),
    emblem: "eclipse",
    logo: {
      src: "/proveedores/luis-vega/logo.webp",
      width: 512,
      height: 547,
      alt: "Logo de Luis Vega — Puro Papel & Lápiz",
    },
    music: {
      cover: "/proveedores/luis-vega/cover.webp",
      // Official videos from youtube.com/@luisvega_oficial, played through YouTube's embed player.
      tracks: [
        { title: "La Foto", youtubeId: "AA2HFtHbe_A" },
        { title: "Bailando Conmigo", youtubeId: "Ip0dvXGhaoY" },
        { title: "Me Va Mejor Con el Alcohol", youtubeId: "wXQlMs6QDxA" },
      ],
    },
    subject: {
      src: "/proveedores/luis-vega/subject.webp",
      width: 497,
      height: 1600,
      alt: "Luis Vega con sombrero vaquero y traje verde",
      heightPct: 90,
      anchor: "center",
    },
    price: {
      from: 12000,
      includes: ["Show de 2 horas", "Banda completa", "Sonido profesional", "Repertorio a elección"],
      monthlyBookings: 9,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: MUSIC_GALLERY,
    videos: MUSIC_VIDEOS,
    teamTitle: "Luis Vega y su banda",
    team: [
      { name: "Luis Vega", role: "Voz principal", photo: "/proveedores/luis-vega/integrante.webp", cutout: true },
      { name: "Requinto", role: "Banda en vivo", photo: portrait("photo-1510915361894-db8b60106cb1") },
      { name: "Trompetas", role: "Banda en vivo", photo: portrait("photo-1511192336575-5a79af67a629") },
      { name: "Batería", role: "Banda en vivo", photo: portrait("photo-1519892300165-cb5542fb47c7") },
    ],
    reviews: MUSIC_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 12000, duration: "1 h 30 min", perks: ["Show acústico", "Sonido profesional", "Repertorio a elección"] },
      { name: "Paquete Premium", price: 18500, duration: "2 horas", recommended: true, perks: ["Show con banda completa", "Sonido e iluminación de concierto", "Canción dedicada en vivo", "Repertorio a elección"] },
      { name: "Paquete VIP", price: 26000, duration: "2 h 30 min", perks: ["Todo lo del Premium", "Pantalla LED y efectos", "Foto y saludo con los festejados", "Coordinador de show"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "delicias-catering",
    name: "Delicias",
    fullName: "Delicias Eventos y Catering",
    category: "Catering",
    kicker: "Eventos y catering",
    heroWord: "GOURMET",
    tagline: "Alta cocina para bodas, empresas y celebraciones: del primer bocado al último brindis.",
    bio: "Doce años llevando la cocina de autor a los salones, jardines y oficinas de Cochabamba. Diseñamos cada menú contigo, cocinamos con producto del valle y llegamos con un equipo de chefs, parrilleros y meseros que cuida cada detalle, desde el montaje hasta la limpieza final.",
    tags: ["Buffet", "Parrilla", "Cocina de autor", "Coffee break", "Bodas", "Corporativos"],
    rating: 4.9,
    reviewsCount: 318,
    eventsCount: 500,
    yearsActive: 12,
    responseTime: "menos de 1 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1555939594-58d7cb561ad1"),
    emblem: "cloche",
    logo: {
      src: "/proveedores/delicias-catering/logo.webp",
      width: 1009,
      height: 756,
      alt: "Logo de Delicias Eventos y Catering",
    },
    subject: {
      src: "/proveedores/delicias-catering/subject.webp",
      width: 1295,
      height: 998,
      alt: "Chef de Delicias con pizzas artesanales, costillas y panes recién horneados",
      heightPct: 61,
      anchor: "center",
    },
    price: {
      from: 35,
      unit: "por persona",
      includes: ["Menú a elección", "Vajilla y mantelería", "Personal de servicio", "Montaje y limpieza"],
      monthlyBookings: 21,
    },
    promo: {
      discount: 15,
      title: "Eventos corporativos",
      description: "En cualquier menú para empresas e instituciones.",
      validUntil: "31 de diciembre",
    },
    gallery: CATERING_GALLERY,
    videos: FOOD_VIDEOS,
    teamTitle: "La brigada",
    team: [
      { name: "Chef ejecutivo", role: "Cocina, horno y parrilla", years: 20, photo: "/proveedores/delicias-catering/chef.webp", cutout: true },
      { name: "Chef Laura Méndez", role: "Pastelería", years: 9, photo: portrait("photo-1577219491135-ce391730fb2c") },
      { name: "Chef Pablo Rivas", role: "Parrilla y fuegos", years: 11, photo: portrait("photo-1600565193348-f74bd3c7ccdf") },
    ],
    reviews: CATERING_REVIEWS,
    packages: [],
    whatsapp: WHATSAPP,
    catering: {
      heroWords: ["GOURMET", "CATERING"],
      guestsServed: 15000,
      satisfaction: 98,
      menus: CATERING_MENUS,
      guestsPerWaiter: 15,
      staffPool: 28,
      corporateDiscount: 15,
      weekdayDiscount: 10,
      perks: CATERING_PERKS,
      testimonials: testimonials(CATERING_REVIEWS),
    },
  },
  {
    slug: "grupo-musical-eclipse",
    name: "Eclipse",
    fullName: "Grupo Musical Eclipse",
    category: "Grupo Musical",
    kicker: "Grupo Musical",
    heroWord: "ECLIPSE",
    tagline: "Rock, pop latino y cumbia en vivo con producción de nivel festival.",
    bio: "Cuatro músicos cochabambinos con más de una década sobre los escenarios. Mezclamos rock, pop latino y cumbia con un show de luces y sonido que convierte cualquier celebración en un concierto.",
    tags: ["Rock", "Pop latino", "Cumbia", "Bodas", "Quinceañeros", "Corporativos"],
    rating: 4.9,
    reviewsCount: 186,
    eventsCount: 250,
    yearsActive: 11,
    responseTime: "menos de 1 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1499364615650-ec38552f4f34"),
    emblem: "eclipse",
    subject: {
      src: "/proveedores/grupo-musical-eclipse/subject.webp",
      width: 1600,
      height: 1000,
      alt: "Integrantes del Grupo Musical Eclipse con sus instrumentos",
      heightPct: 74,
      anchor: "center",
    },
    price: {
      from: 3500,
      includes: ["Sonido básico", "4 horas de show", "Animación", "Repertorio personalizado"],
      monthlyBookings: 18,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: MUSIC_GALLERY,
    videos: MUSIC_VIDEOS,
    teamTitle: "Integrantes",
    team: [
      { name: "Mateo Rojas", role: "Guitarra líder", years: 12, photo: "/proveedores/grupo-musical-eclipse/integrantes/1.webp", cutout: true },
      { name: "Diego Vargas", role: "Batería", years: 11, photo: "/proveedores/grupo-musical-eclipse/integrantes/2.webp", cutout: true },
      { name: "Sebastián Claros", role: "Voz y guitarra", years: 8, photo: "/proveedores/grupo-musical-eclipse/integrantes/3.webp", cutout: true },
      { name: "Rodrigo Arce", role: "Bajo", years: 14, photo: "/proveedores/grupo-musical-eclipse/integrantes/4.webp", cutout: true },
    ],
    reviews: MUSIC_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 3500, duration: "4 horas", perks: ["Sonido básico", "Animación", "Repertorio personalizado", "1 set de 90 minutos"] },
      { name: "Paquete Premium", price: 5800, duration: "5 horas", recommended: true, perks: ["Sonido profesional e iluminación", "Hora loca con cotillón", "Repertorio personalizado", "DJ entre sets", "Ensayo de canción especial"] },
      { name: "Paquete VIP", price: 8900, duration: "6 horas", perks: ["Todo lo del Premium", "Pantalla LED y efectos", "Set acústico para la ceremonia", "Chispas frías y humo bajo", "Coordinador de show"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "grupo-musical-fusion",
    name: "Fusión",
    fullName: "Grupo Musical Fusión",
    category: "Grupo Musical",
    kicker: "Grupo Musical",
    heroWord: "FUSIÓN",
    tagline: "Cumbia, salsa y folklore con una sección de vientos que levanta a todos.",
    bio: "Fusión nació en los patios de Cochabamba y hoy es la banda favorita de bodas y prestes. Vientos en vivo, coreografías y un repertorio que recorre toda Latinoamérica.",
    tags: ["Cumbia", "Salsa", "Folklore", "Bodas", "Prestes"],
    rating: 4.8,
    reviewsCount: 132,
    eventsCount: 180,
    yearsActive: 9,
    responseTime: "menos de 2 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1524368535928-5b5e00ddc76b"),
    emblem: "waves",
    subject: {
      src: "/proveedores/grupo-musical-fusion/subject.webp",
      width: 644,
      height: 1073,
      alt: "Vocalista de Grupo Musical Fusión tocando la guitarra",
      heightPct: 86,
      anchor: "center",
    },
    price: {
      from: 3200,
      includes: ["Sonido básico", "4 horas de show", "Sección de vientos", "Repertorio personalizado"],
      monthlyBookings: 14,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: MUSIC_GALLERY,
    videos: MUSIC_VIDEOS,
    teamTitle: "Integrantes",
    team: [
      { name: "Carlos Montaño", role: "Voz y guitarra", years: 10, photo: portrait("photo-1598387993441-a364f854c3e1") },
      { name: "Bruno Siles", role: "Voz principal", years: 9, photo: portrait("photo-1460723237483-7a6dc9d0b212") },
      { name: "Ernesto Lara", role: "Saxofón", years: 15, photo: portrait("photo-1415201364774-f6f0bb35f28f") },
      { name: "Iván Céspedes", role: "Trompeta", years: 7, photo: portrait("photo-1511192336575-5a79af67a629") },
    ],
    reviews: MUSIC_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 3200, duration: "4 horas", perks: ["Sonido básico", "Sección de vientos", "Repertorio personalizado"] },
      { name: "Paquete Premium", price: 5200, duration: "5 horas", recommended: true, perks: ["Sonido profesional e iluminación", "Bailarinas para la entrada", "Hora loca", "Repertorio personalizado"] },
      { name: "Paquete VIP", price: 7900, duration: "6 horas", perks: ["Todo lo del Premium", "Banda de bronces para la entrada", "Pantalla LED", "Coordinador de show"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "dj-nightflow",
    name: "NightFlow",
    fullName: "DJ NightFlow",
    category: "DJ",
    kicker: "DJ · Productor",
    heroWord: "NIGHTFLOW",
    tagline: "Sets que leen la pista y no la sueltan hasta el amanecer.",
    bio: "Residente de los clubes más exigentes de Cochabamba. NightFlow combina reggaetón, house y clásicos latinos con transiciones limpias y un show de luces sincronizado.",
    tags: ["House", "Reggaetón", "Clásicos", "Bodas", "Clubes"],
    rating: 5.0,
    reviewsCount: 214,
    eventsCount: 320,
    yearsActive: 8,
    responseTime: "menos de 30 min",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1514525253161-7a46d19cd819"),
    emblem: "vinyl",
    subject: {
      src: "/proveedores/dj-nightflow/subject.webp",
      width: 1420,
      height: 1039,
      alt: "DJ NightFlow con audífonos mezclando en vivo",
      heightPct: 70,
      anchor: "center",
    },
    price: {
      from: 1800,
      includes: ["Equipo DJ profesional", "5 horas de música", "Luces LED", "Playlist personalizada"],
      monthlyBookings: 22,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: DJ_GALLERY,
    videos: DJ_VIDEOS,
    teamTitle: "El equipo detrás del show",
    team: [
      { name: "Álvaro Peña", role: "DJ principal", years: 8, photo: portrait("photo-1516873240891-4bf014598ab4") },
      { name: "Lucas Ibáñez", role: "Visuales y luces", years: 6, photo: portrait("photo-1470225620780-dba8ba36b745") },
      { name: "Marco Zurita", role: "Ingeniero de sonido", years: 10, photo: portrait("photo-1642178225043-f299072af862") },
    ],
    reviews: DJ_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 1800, duration: "5 horas", perks: ["Equipo DJ profesional", "Luces LED", "Playlist personalizada"] },
      { name: "Paquete Premium", price: 2900, duration: "6 horas", recommended: true, perks: ["Sonido line array", "Show de luces sincronizado", "Máquina de humo", "Hora loca"] },
      { name: "Paquete VIP", price: 4500, duration: "8 horas", perks: ["Todo lo del Premium", "Pantalla LED con visuales", "Cabina iluminada", "Saxofonista en vivo"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "dj-electrowave",
    name: "ElectroWave",
    fullName: "DJ ElectroWave",
    category: "DJ",
    kicker: "DJ · Electrónica",
    heroWord: "ELECTROWAVE",
    tagline: "Electrónica, tech house y visuales para fiestas que se sienten festival.",
    bio: "ElectroWave lleva la energía de los festivales a tu evento: equipo de última generación, visuales en tiempo real y sets construidos a medida de tu público.",
    tags: ["Tech house", "EDM", "Visuales", "Graduaciones", "Corporativos"],
    rating: 4.7,
    reviewsCount: 98,
    eventsCount: 140,
    yearsActive: 6,
    responseTime: "menos de 1 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1540039155733-5bb30b53aa14"),
    emblem: "pulse",
    subject: {
      src: "/proveedores/dj-electrowave/subject.webp",
      width: 1600,
      height: 969,
      alt: "Controlador DJ iluminado de ElectroWave",
      heightPct: 60,
      anchor: "right",
    },
    price: {
      from: 1600,
      includes: ["Controlador profesional", "5 horas de música", "Visuales básicos", "Playlist personalizada"],
      monthlyBookings: 12,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: DJ_GALLERY,
    videos: DJ_VIDEOS,
    teamTitle: "El equipo detrás del show",
    team: [
      { name: "Nicolás Terrazas", role: "DJ principal", years: 6, photo: portrait("photo-1493676304819-0d7a8d026dcf") },
      { name: "Bianca Ugarte", role: "VJ y visuales", years: 5, photo: portrait("photo-1574391884720-bbc3740c59d1") },
      { name: "Óscar Flores", role: "Técnico de sonido", years: 9, photo: portrait("photo-1470225620780-dba8ba36b745") },
    ],
    reviews: DJ_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 1600, duration: "5 horas", perks: ["Controlador profesional", "Visuales básicos", "Playlist personalizada"] },
      { name: "Paquete Premium", price: 2600, duration: "6 horas", recommended: true, perks: ["Sonido profesional", "Láseres y luces robóticas", "Visuales en pantalla", "Hora loca"] },
      { name: "Paquete VIP", price: 4200, duration: "8 horas", perks: ["Todo lo del Premium", "Escenario con truss", "CO2 y chispas frías", "Segundo DJ invitado"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "catering-gourmet",
    name: "Gourmet",
    fullName: "Catering Gourmet",
    category: "Catering",
    kicker: "Catering de autor",
    heroWord: "GOURMET",
    tagline: "Cocina de autor con productos del valle, servida como en un restaurante.",
    bio: "Un equipo de chefs formados en Lima y Buenos Aires que reinterpreta la cocina cochabambina con técnica contemporánea. Menús a medida, servicio de mesa y degustación previa.",
    tags: ["Cocina de autor", "Menú degustación", "Opciones veganas", "Bodas", "Corporativos"],
    rating: 4.9,
    reviewsCount: 241,
    eventsCount: 410,
    yearsActive: 12,
    responseTime: "menos de 1 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1414235077428-338989a2e8c0"),
    emblem: "cloche",
    subject: {
      src: "/proveedores/catering-gourmet/subject.webp",
      width: 1600,
      height: 770,
      alt: "Costillas glaseadas con guarnición de Catering Gourmet",
      heightPct: 40,
      anchor: "center",
    },
    price: {
      from: 90,
      unit: "por persona",
      includes: ["Menú de 3 tiempos", "Vajilla y mantelería", "Personal de servicio", "Degustación previa"],
      monthlyBookings: 16,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: CATERING_GALLERY,
    videos: FOOD_VIDEOS,
    teamTitle: "Nuestro equipo",
    team: [
      { name: "Chef Ana Guzmán", role: "Chef ejecutiva", years: 14, photo: portrait("photo-1581299894007-aaa50297cf16") },
      { name: "Chef Pablo Rivas", role: "Parrilla y fuegos", years: 11, photo: portrait("photo-1600565193348-f74bd3c7ccdf") },
      { name: "Chef Tomás Ledezma", role: "Cocina caliente", years: 8, photo: portrait("photo-1577219491135-ce391730fb2c") },
    ],
    reviews: CATERING_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 90, unit: "por persona", duration: "Hasta 5 horas", perks: ["Menú de 3 tiempos", "Vajilla y mantelería", "Personal de servicio"] },
      { name: "Paquete Premium", price: 130, unit: "por persona", duration: "Hasta 6 horas", recommended: true, perks: ["Menú de 4 tiempos", "Cóctel de bienvenida", "Estación de postres", "Degustación previa"] },
      { name: "Paquete VIP", price: 180, unit: "por persona", duration: "Hasta 8 horas", perks: ["Menú degustación de 6 tiempos", "Show cooking en vivo", "Maridaje de vinos", "Maître dedicado"] },
    ],
    whatsapp: WHATSAPP,
    catering: {
      heroWords: ["GOURMET", "CATERING"],
      guestsServed: 12000,
      satisfaction: 97,
      menus: scaleMenus(1.1),
      guestsPerWaiter: 15,
      staffPool: 22,
      corporateDiscount: 15,
      weekdayDiscount: 10,
      perks: CATERING_PERKS,
      testimonials: testimonials(CATERING_REVIEWS),
    },
  },
  {
    slug: "catering-premium",
    name: "Premium",
    fullName: "Catering Premium",
    category: "Catering",
    kicker: "Catering",
    heroWord: "PREMIUM",
    tagline: "Estaciones de comida, horno a leña y buffets que se convierten en experiencia.",
    bio: "Especialistas en eventos grandes: estaciones temáticas, horno a leña móvil y buffets diseñados para que cada invitado elija su propia experiencia.",
    tags: ["Buffet", "Horno a leña", "Estaciones", "Fiestas", "Matrimonios"],
    rating: 4.8,
    reviewsCount: 167,
    eventsCount: 290,
    yearsActive: 10,
    responseTime: "menos de 2 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1555244162-803834f70033"),
    emblem: "crown",
    subject: {
      src: "/proveedores/catering-premium/subject.webp",
      width: 1600,
      height: 1312,
      alt: "Pizza artesanal de horno a leña de Catering Premium",
      heightPct: 46,
      anchor: "center",
    },
    price: {
      from: 120,
      unit: "por persona",
      includes: ["Buffet de 3 estaciones", "Personal de servicio", "Vajilla completa", "Montaje y limpieza"],
      monthlyBookings: 11,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: CATERING_GALLERY,
    videos: FOOD_VIDEOS,
    teamTitle: "Nuestro equipo",
    team: [
      { name: "Chef Ramiro Ortiz", role: "Chef ejecutivo", years: 16, photo: portrait("photo-1600565193348-f74bd3c7ccdf") },
      { name: "Chef Laura Méndez", role: "Pastelería", years: 9, photo: portrait("photo-1577219491135-ce391730fb2c") },
      { name: "Chef Hugo Torrico", role: "Horno a leña", years: 12, photo: portrait("photo-1581299894007-aaa50297cf16") },
    ],
    reviews: CATERING_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 120, unit: "por persona", duration: "Hasta 5 horas", perks: ["Buffet de 3 estaciones", "Personal de servicio", "Vajilla completa"] },
      { name: "Paquete Premium", price: 160, unit: "por persona", duration: "Hasta 6 horas", recommended: true, perks: ["5 estaciones temáticas", "Horno a leña en vivo", "Mesa de postres", "Bebidas sin alcohol"] },
      { name: "Paquete VIP", price: 220, unit: "por persona", duration: "Hasta 8 horas", perks: ["Todo lo del Premium", "Barra de cócteles", "Snack de medianoche", "Coordinador de banquete"] },
    ],
    whatsapp: WHATSAPP,
    catering: {
      heroWords: ["PREMIUM", "CATERING"],
      guestsServed: 9500,
      satisfaction: 97,
      menus: scaleMenus(1.2),
      guestsPerWaiter: 15,
      staffPool: 20,
      corporateDiscount: 15,
      weekdayDiscount: 10,
      perks: CATERING_PERKS,
      testimonials: testimonials(CATERING_REVIEWS),
    },
  },
  {
    slug: "cerveceria-andes-craft",
    name: "Andes Craft",
    fullName: "Cervecería Andes Craft",
    category: "Bebidas",
    kicker: "Cervecería artesanal",
    heroWord: "ANDES",
    tagline: "Cerveza artesanal de altura, servida desde nuestra barra móvil de grifos.",
    bio: "Elaboramos en pequeños lotes con agua de deshielo y maltas seleccionadas. Llevamos nuestra barra móvil con cuatro grifos y un bartender que guía la degustación.",
    tags: ["IPA", "Golden Ale", "Stout", "Barra móvil", "Degustaciones"],
    rating: 4.9,
    reviewsCount: 121,
    eventsCount: 205,
    yearsActive: 7,
    responseTime: "menos de 1 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1535958636474-b021ee887b13"),
    emblem: "peaks",
    subject: {
      src: "/proveedores/cerveceria-andes-craft/subject.webp",
      width: 1328,
      height: 1068,
      alt: "Jarra de cerveza artesanal Andes Craft con espuma",
      heightPct: 58,
      anchor: "center",
    },
    price: {
      from: 1500,
      includes: ["Barra móvil 4 horas", "4 estilos de cerveza", "50 litros incluidos", "Bartender certificado"],
      monthlyBookings: 15,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: BEER_GALLERY,
    videos: BEER_VIDEOS,
    teamTitle: "Maestros cerveceros",
    team: [
      { name: "Joaquín Prado", role: "Maestro cervecero", years: 9, photo: portrait("photo-1607631568010-a87245c0daf8") },
      { name: "Elena Camacho", role: "Sommelier de cerveza", years: 6, photo: portrait("photo-1583394293214-28ded15ee548") },
    ],
    reviews: BEER_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 1500, duration: "4 horas", perks: ["Barra móvil", "4 estilos de cerveza", "50 litros incluidos"] },
      { name: "Paquete Premium", price: 2400, duration: "5 horas", recommended: true, perks: ["6 grifos", "90 litros incluidos", "Degustación guiada", "Vasos personalizados"] },
      { name: "Paquete VIP", price: 3800, duration: "6 horas", perks: ["Todo lo del Premium", "150 litros incluidos", "Cerveza de edición especial", "Maridaje con picoteo"] },
    ],
    whatsapp: WHATSAPP,
  },
  {
    slug: "cerveceria-valle-beer",
    name: "Valle Beer",
    fullName: "Cervecería Valle Beer",
    category: "Bebidas",
    kicker: "Cervecería artesanal",
    heroWord: "VALLE",
    tagline: "Tablas de degustación y estilos frutales hechos con fruta del valle.",
    bio: "Valle Beer celebra los sabores de Cochabamba: cervezas de durazno, frutilla y maracuyá junto a clásicos bien hechos. Ideales para brindis y fiestas al aire libre.",
    tags: ["Frutales", "Lager", "Degustación", "Al aire libre", "Brindis"],
    rating: 4.6,
    reviewsCount: 88,
    eventsCount: 130,
    yearsActive: 5,
    responseTime: "menos de 2 h",
    location: "Cochabamba, Bolivia",
    heroImage: hero("photo-1575037614876-c38a4d44f5b8"),
    emblem: "hop",
    subject: {
      src: "/proveedores/cerveceria-valle-beer/subject.webp",
      width: 1591,
      height: 769,
      alt: "Tabla de degustación de cervezas Valle Beer",
      heightPct: 40,
      anchor: "center",
    },
    price: {
      from: 1300,
      includes: ["Barra 4 horas", "3 estilos frutales", "40 litros incluidos", "Tablas de degustación"],
      monthlyBookings: 9,
    },
    promo: {
      discount: 15,
      title: "Oferta del mes",
      description: "Eventos realizados entre lunes y jueves.",
      validUntil: "31 de octubre",
    },
    gallery: BEER_GALLERY,
    videos: BEER_VIDEOS,
    teamTitle: "Maestros cerveceros",
    team: [
      { name: "Fabiola Rocha", role: "Maestra cervecera", years: 7, photo: portrait("photo-1583394293214-28ded15ee548") },
      { name: "Gonzalo Arnez", role: "Bartender", years: 5, photo: portrait("photo-1607631568010-a87245c0daf8") },
    ],
    reviews: BEER_REVIEWS,
    packages: [
      { name: "Paquete Básico", price: 1300, duration: "4 horas", perks: ["Barra con 3 grifos", "3 estilos frutales", "40 litros incluidos"] },
      { name: "Paquete Premium", price: 2100, duration: "5 horas", recommended: true, perks: ["5 estilos", "80 litros incluidos", "Tablas de degustación", "Brindis especial"] },
      { name: "Paquete VIP", price: 3300, duration: "6 horas", perks: ["Todo lo del Premium", "130 litros incluidos", "Cerveza con etiqueta personalizada", "Bartender adicional"] },
    ],
    whatsapp: WHATSAPP,
  },
];

export function getProvider(slug: string) {
  return PROVIDERS.find((p) => p.slug === slug);
}
