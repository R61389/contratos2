"use client";

import { AtSign, MapPin, Music, Star } from "lucide-react";
import type { ProviderKind, ProviderWorkspace } from "@/lib/panel/types";
import { Thumb } from "@/components/panel/ui/misc";
import { KIND_LABEL, priceLabel, PRICING_SUFFIX, formatBs } from "@/lib/panel/format";
import { applyPercent, isPromoLive, promoPrice } from "@/lib/panel/logic";
import { youtubeThumb } from "@/lib/panel/youtube";
import { cn } from "@/lib/utils";

type Theme = "cinematic" | "gastronomic" | "nocturnal";

export function themeFor(kind: ProviderKind): Theme {
  if (kind === "catering") return "gastronomic";
  if (kind === "dj" || kind === "bebidas") return "nocturnal";
  return "cinematic";
}

const THEME_LABEL: Record<Theme, string> = {
  cinematic: "Cinematográfico",
  gastronomic: "Gastronómico",
  nocturnal: "Nocturno",
};

/** What the visitor would see on VIBRA, rendered from the live workspace so every edit shows up at once. */
export function PublicPreview({ ws, narrow = false }: { ws: ProviderWorkspace; narrow?: boolean }) {
  const theme = themeFor(ws.kind);
  const p = ws.profile;
  const media = (id: string | null) => ws.media.find((m) => m.id === id) ?? null;
  const cover = p.coverUrl ?? media(ws.coverMediaId)?.url ?? null;
  const published = ws.services.filter((s) => s.status === "publicado");
  const featured = [...published].sort((a, b) => Number(p.featuredServiceIds.includes(b.id)) - Number(p.featuredServiceIds.includes(a.id))).slice(0, 4);
  const livePromos = ws.promotions.filter((pr) => isPromoLive(pr));
  const gallery = ws.galleryOrder.map((id) => media(id)).filter(Boolean).slice(0, 6) as NonNullable<ReturnType<typeof media>>[];
  const word = (p.businessName.split(" ").find((w) => w.length > 3) ?? p.businessName).toUpperCase();

  return (
    <div className={cn("overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink text-ink-light", theme === "nocturnal" && "bg-[#0d0d0d]")}>
      {/* Hero */}
      <div className={cn("relative overflow-hidden", narrow ? "h-[360px]" : "h-[420px]")}>
        <Thumb src={cover} alt="" className={cn("absolute inset-0 h-full w-full", theme === "gastronomic" ? "blur-[2px] scale-105" : "")} />
        <div
          className={cn(
            "absolute inset-0",
            theme === "cinematic" && "bg-gradient-to-b from-ink/50 via-ink/40 to-ink",
            theme === "gastronomic" && "bg-gradient-to-b from-ink/70 via-ink/50 to-ink",
            theme === "nocturnal" && "bg-[radial-gradient(ellipse_at_50%_30%,rgba(226,232,0,0.18),transparent_60%),linear-gradient(to_bottom,rgba(13,13,13,0.6),#0d0d0d)]"
          )}
        />
        {theme === "nocturnal" && (
          <div aria-hidden className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(226,232,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,0,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
        )}

        {theme === "cinematic" && (
          <p aria-hidden className="absolute inset-x-0 top-[38%] text-center font-black uppercase leading-none tracking-[-0.05em] text-white/90 [filter:drop-shadow(0_0_24px_rgba(226,232,0,0.3))]" style={{ fontSize: narrow ? "4.2rem" : "6.5rem" }}>
            {word}
          </p>
        )}
        {theme === "nocturnal" && (
          <p aria-hidden className="absolute inset-x-0 top-[34%] text-center font-black uppercase leading-none tracking-tight text-transparent [-webkit-text-stroke:1.5px_rgba(226,232,0,0.85)] [filter:drop-shadow(0_0_18px_rgba(226,232,0,0.5))]" style={{ fontSize: narrow ? "3.6rem" : "5.5rem" }}>
            {word}
          </p>
        )}
        {theme === "gastronomic" && (
          <div className="absolute inset-x-0 top-[22%] flex justify-center">
            <div className="rounded-[1.5rem] border border-white/15 bg-white/[0.07] px-8 py-5 backdrop-blur-xl">
              {p.logoUrl ? <Thumb src={p.logoUrl} alt={`Logo de ${p.businessName}`} className="h-20 w-auto object-contain" /> : <p className="font-serif text-4xl italic text-white">{p.businessName}</p>}
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-6">
          <span className="rounded-full border border-volt/40 bg-volt/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-volt">{KIND_LABEL[ws.kind]}</span>
          <h3 className={cn("mt-3 text-white", theme === "gastronomic" ? "font-serif text-4xl italic" : "font-general text-3xl font-semibold tracking-tight")}>{p.businessName || "Tu nombre comercial"}</h3>
          <p className="mt-1 max-w-lg text-sm text-ink-light/90">{p.tagline || "Agrega una frase que resuma lo que haces."}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-light">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-volt text-volt" />
              {ws.rating.toFixed(1)} ({ws.reviewsCount})
            </span>
            {p.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-volt" />
                {p.city}
                {p.zone ? `, ${p.zone}` : ""}
              </span>
            )}
            {p.yearsExperience > 0 && <span>{p.yearsExperience} años de experiencia</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 p-6">
        {livePromos[0] && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-volt/40 bg-volt/[0.08] p-4 shadow-[0_0_30px_-8px_rgba(226,232,0,0.5)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-volt">Promoción</p>
              <p className="font-general font-semibold text-white">{livePromos[0].name}</p>
              <p className="text-xs text-ink-mid">{livePromos[0].description}</p>
            </div>
            <p className="font-general text-3xl font-bold text-volt">{livePromos[0].type === "porcentaje" ? `−${livePromos[0].value}%` : `−${formatBs(livePromos[0].value)}`}</p>
          </div>
        )}

        {p.description && <p className="text-sm leading-relaxed text-ink-light">{p.description}</p>}

        {ws.music.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <Thumb src={youtubeThumb(ws.music[0].youtubeId)} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-volt">
                <Music className="h-3 w-3" /> Suena en tu perfil
              </p>
              <p className="truncate text-sm text-white">{ws.music[0].title}</p>
              <p className="text-xs text-ink-mid">
                {ws.music.length} {ws.music.length === 1 ? "canción" : "canciones"} en la lista
              </p>
            </div>
          </div>
        )}

        <div>
          <p className={cn("text-white", theme === "gastronomic" ? "font-serif text-2xl italic" : "font-general text-lg font-semibold")}>Servicios</p>
          {featured.length === 0 ? (
            <p className="mt-3 text-sm text-ink-mid">Todavía no hay servicios publicados.</p>
          ) : (
            <div className={cn("mt-3 grid gap-3", narrow ? "grid-cols-1" : "grid-cols-2")}>
              {featured.map((s) => {
                const promo = livePromos.find((pr) => pr.serviceIds.includes(s.id));
                const finalPrice = promo && s.basePrice !== null && s.pricingMode !== "cotizacion" ? promoPrice(s.basePrice, promo).final : null;
                return (
                  <div key={s.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    <Thumb src={media(s.coverId)?.url ?? null} alt="" className="h-28 w-full" />
                    <div className="p-3">
                      <p className={cn("text-white", theme === "gastronomic" ? "font-serif text-xl italic" : "text-sm font-medium")}>{s.name}</p>
                      <p className="mt-1 text-xs text-ink-mid line-clamp-2">{s.description}</p>
                      <p className="mt-2 text-sm">
                        {finalPrice !== null ? (
                          <>
                            <span className="font-semibold text-volt">{formatBs(finalPrice)}</span> <span className="text-xs text-ink-mid line-through">{formatBs(s.basePrice!)}</span>{" "}
                            <span className="text-xs text-ink-mid">{PRICING_SUFFIX[s.pricingMode]}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-white">{priceLabel(s.basePrice, s.pricingMode)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {ws.packages.length > 0 && (
          <div>
            <p className={cn("text-white", theme === "gastronomic" ? "font-serif text-2xl italic" : "font-general text-lg font-semibold")}>Paquetes</p>
            <div className={cn("mt-3 grid gap-3", narrow ? "grid-cols-1" : "grid-cols-3")}>
              {ws.packages.map((pk) => {
                const final = pk.price !== null && pk.discountPct > 0 ? applyPercent(pk.price, pk.discountPct) : pk.price;
                return (
                  <div key={pk.id} className={cn("rounded-2xl border p-4", pk.highlighted ? "border-volt/50 bg-volt/[0.06]" : "border-white/[0.08]")}>
                    <p className="text-sm font-medium text-white">{pk.name}</p>
                    <p className="mt-1 font-general text-xl font-semibold text-white">{pk.pricingMode === "cotizacion" || final === null ? "Cotización" : formatBs(final)}</p>
                    {(pk.discountPct > 0 || pk.previousPrice) && pk.price !== null && (
                      <p className="text-xs text-ink-mid line-through">{formatBs(pk.discountPct > 0 ? pk.price : pk.previousPrice!)}</p>
                    )}
                    <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-mid">
                      {pk.benefits.slice(0, 3).map((b) => (
                        <li key={b}>· {b}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gallery.length > 0 && (
          <div>
            <p className={cn("text-white", theme === "gastronomic" ? "font-serif text-2xl italic" : "font-general text-lg font-semibold")}>Galería</p>
            <div className={cn("mt-3 grid gap-2", narrow ? "grid-cols-2" : "grid-cols-3")}>
              {gallery.map((m) => (
                <Thumb key={m.id} src={m.url} alt={m.alt} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {p.faqs.length > 0 && (
          <div>
            <p className={cn("text-white", theme === "gastronomic" ? "font-serif text-2xl italic" : "font-general text-lg font-semibold")}>Preguntas frecuentes</p>
            <dl className="mt-3 flex flex-col gap-3">
              {p.faqs.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/[0.08] p-3">
                  <dt className="text-sm font-medium text-white">{f.question}</dt>
                  <dd className="mt-1 text-xs text-ink-mid">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {p.socials.instagram && (
          <p className="flex items-center gap-2 text-xs text-ink-mid">
            <AtSign className="h-4 w-4 text-volt" />@{p.socials.instagram.replace(/^@/, "")}
          </p>
        )}
      </div>
      <p className="border-t border-white/[0.06] px-6 py-3 text-[11px] text-ink-mid">Estilo de la página: {THEME_LABEL[theme]} · vista previa con los datos de la demo</p>
    </div>
  );
}
