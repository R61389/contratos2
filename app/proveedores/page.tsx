import type { Metadata } from "next";
import { Suspense } from "react";
import { PROVIDERS } from "@/lib/providers";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ProviderDirectory } from "@/components/directory/provider-directory";

export const metadata: Metadata = {
  title: "Proveedores — VIBRA",
  description: "Músicos, DJs, catering y bebidas verificados en Cochabamba. Compara precios, calificaciones y disponibilidad.",
};

export default function ProveedoresPage() {
  return (
    <main className="relative overflow-x-clip">
      <Navbar />
      {/* The filters live in the URL, which is only readable on the client. */}
      <Suspense>
        <ProviderDirectory providers={PROVIDERS} />
      </Suspense>
      <Footer />
    </main>
  );
}
