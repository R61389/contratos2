"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { whatsappLink } from "@/lib/format";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { Emblem } from "@/components/provider/emblem";

export function ProviderCta({ provider }: { provider: Provider }) {
  return (
    <section className="relative px-4 py-24 sm:px-6 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10"
      >
        <Image src={provider.heroImage} alt="" fill sizes="100vw" className="object-cover blur-sm" />
        <div className="absolute inset-0 bg-ink/80" />
        <motion.div
          aria-hidden
          style={{ x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full bg-volt/20 blur-[120px]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-25 sm:-right-16 sm:-top-16">
          <Emblem variant={provider.emblem} className="h-80 w-80 sm:h-[26rem] sm:w-[26rem]" />
        </div>
        <div className="noise absolute inset-0 opacity-40" />

        <div className="relative flex flex-col items-center px-6 py-20 text-center sm:px-12 sm:py-28">
          <span className="rounded-full border border-volt/30 bg-volt/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-volt">
            {provider.fullName}
          </span>
          <h2 className="mt-6 max-w-3xl text-balance font-general text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            ¿Listo para darle la <span className="text-volt">mejor vibra</span> a tu celebración?
          </h2>
          <p className="mt-5 max-w-xl text-balance text-ink-light/80">
            Asegura tu fecha hoy. Respondemos en {provider.responseTime}.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <MagneticButton size="lg" asChild>
              <a href="#disponibilidad">
                <CalendarCheck className="h-4 w-4" />
                Reservar fecha
              </a>
            </MagneticButton>
            <MagneticButton size="lg" variant="secondary" asChild>
              <a
                href={whatsappLink(provider.whatsapp, `Hola ${provider.fullName}, quiero consultar por mi evento (vi el perfil en VIBRA).`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Consultar por WhatsApp
              </a>
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
