import type { Metadata } from "next";
import { PROVIDERS } from "@/lib/providers";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { EventBuilder } from "@/components/builder/event-builder";

export const metadata: Metadata = {
  title: "Organiza tu evento — VIBRA",
  description: "Elige el tipo de evento, la fecha y los servicios, y arma tu celebración con proveedores disponibles y precios al instante.",
};

export default function OrganizarPage() {
  return (
    <main className="relative overflow-x-clip">
      <Navbar />
      <EventBuilder providers={PROVIDERS} />
      <Footer />
    </main>
  );
}
