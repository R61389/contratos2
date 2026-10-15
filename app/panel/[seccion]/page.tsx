import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Requests } from "@/components/panel/sections/requests";
import { Services } from "@/components/panel/sections/services";
import { Pricing } from "@/components/panel/sections/pricing";
import { Gallery } from "@/components/panel/sections/gallery";
import { CalendarSection } from "@/components/panel/sections/calendar";
import { Promotions } from "@/components/panel/sections/promotions";
import { ProfileEditor } from "@/components/panel/sections/profile-editor";
import { Stats } from "@/components/panel/sections/stats";
import { SettingsSection } from "@/components/panel/sections/settings";

const SECTIONS = {
  solicitudes: Requests,
  servicios: Services,
  precios: Pricing,
  galeria: Gallery,
  calendario: CalendarSection,
  promociones: Promotions,
  perfil: ProfileEditor,
  estadisticas: Stats,
  configuracion: SettingsSection,
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((seccion) => ({ seccion }));
}

export default async function PanelSectionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  const Section = SECTIONS[seccion as keyof typeof SECTIONS];
  if (!Section) notFound();
  // Some sections read ?id= or ?fecha= from the URL, which needs a Suspense boundary.
  return (
    <Suspense>
      <Section />
    </Suspense>
  );
}
