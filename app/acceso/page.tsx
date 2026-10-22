import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Acceso de proveedores — VIBRA",
  description: "Entra a tu panel de proveedor en VIBRA.",
  robots: { index: false, follow: false },
};

export default function AccesoPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-ink px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
