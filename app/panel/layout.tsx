import type { Metadata } from "next";
import { PanelApp } from "@/components/panel/panel-app";

export const metadata: Metadata = {
  title: "Panel de proveedores — VIBRA",
  description: "Administra tu perfil, servicios, precios, galería, disponibilidad y solicitudes en VIBRA.",
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelApp>{children}</PanelApp>;
}
