"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M15 3h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M14 3v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.5 2.5 2.2 4.2 4.5 4.5" />
    </svg>
  );
}

const COLUMNS = [
  {
    title: "Empresa",
    links: ["Sobre nosotros", "Cómo funciona", "Testimonios", "Blog"],
  },
  {
    title: "Servicios",
    links: ["Grupos musicales", "DJs", "Catering", "Decoración"],
  },
  {
    title: "Contacto",
    links: ["hola@vibra.app", "+591 700 00000", "Cochabamba, Bolivia"],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-ink-light/10 pt-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <a href="#inicio" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-volt text-ink shadow-glow">
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="font-display text-sm font-black tracking-[0.18em] text-white">
                VIB<span className="text-volt">RA</span>
              </span>
            </a>
            <p className="max-w-xs text-sm text-ink-mid">
              Encuentra la mejor vibra para tu celebración: todo tu evento en
              Cochabamba, desde un solo lugar.
            </p>
            <div className="flex gap-3 pt-2">
              {[InstagramIcon, FacebookIcon, TikTokIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Red social"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {COLUMNS.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="flex flex-col gap-4"
            >
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-ink-mid transition-colors hover:text-volt"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-light/10 py-8 text-xs text-ink-mid sm:flex-row">
          <p>© {new Date().getFullYear()} VIBRA. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-volt">
              Términos
            </a>
            <a href="#" className="transition-colors hover:text-volt">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
