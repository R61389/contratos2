"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import type { Addon, Package, PriceTier, PricingMode, PricingSettings } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { Card, DemoNote, EmptyState, SectionHeader } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { ChipGroup, Field, ListEditor, MoneyInput, Select, Switch, TextArea, TextInput } from "@/components/panel/ui/fields";
import { formatBs, PRICING_BY_KIND, PRICING_LABEL, PRICING_SUFFIX, uid } from "@/lib/panel/format";
import { applyPercent, parseAmount, parsePercent } from "@/lib/panel/logic";
import { cn } from "@/lib/utils";

/* ───────────── Base price and payment terms ───────────── */

function BaseCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const p = ws.pricing;
  const [base, setBase] = useState(String(p.basePrice));
  const [mode, setMode] = useState<PricingMode>(p.pricingMode);
  const [minimum, setMinimum] = useState(String(p.minimumOrder));
  const [deposit, setDeposit] = useState(String(p.depositPct));
  const [terms, setTerms] = useState(p.paymentTerms);
  const [submitted, setSubmitted] = useState(false);

  const baseR = mode === "cotizacion" ? { value: 0, error: null } : parseAmount(base);
  const minR = parseAmount(minimum, { allowEmpty: true });
  const depR = parsePercent(deposit || "0");
  const errors = { base: baseR.error, minimum: minR.error, deposit: depR.error };
  const dirty = base !== String(p.basePrice) || mode !== p.pricingMode || minimum !== String(p.minimumOrder) || deposit !== String(p.depositPct) || terms !== p.paymentTerms;
  const depositAmount = baseR.value && depR.value ? (baseR.value * depR.value) / 100 : 0;

  function save() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return toast({ tone: "error", title: "Revisa los importes", description: "Usa números positivos; el anticipo va de 0 a 100 %." });
    run((w) => ({
      ...w,
      pricing: { ...w.pricing, basePrice: baseR.value ?? 0, pricingMode: mode, minimumOrder: minR.value ?? 0, depositPct: depR.value ?? 0, paymentTerms: terms.trim() },
    }));
    toast({ tone: "success", title: "Tarifa base actualizada" });
    setSubmitted(false);
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-general text-lg font-semibold text-white">Precio base y condiciones de pago</h2>
      <p className="mt-1 text-sm text-ink-mid">Es el “desde” que ven los clientes en tu tarjeta de VIBRA.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Precio base" htmlFor="pr-base" error={submitted ? errors.base : null}>
          <MoneyInput id="pr-base" value={mode === "cotizacion" ? "" : base} onChange={(e) => setBase(e.target.value)} disabled={mode === "cotizacion"} invalid={submitted && !!errors.base} />
        </Field>
        <Field label="Modalidad" htmlFor="pr-mode">
          <Select id="pr-mode" value={mode} onChange={(e) => setMode(e.target.value as PricingMode)}>
            {PRICING_BY_KIND[ws.kind].map((m) => (
              <option key={m} value={m}>
                {PRICING_LABEL[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contratación mínima" htmlFor="pr-min" error={submitted ? errors.minimum : null} hint="Monto mínimo por evento">
          <MoneyInput id="pr-min" value={minimum} onChange={(e) => setMinimum(e.target.value)} invalid={submitted && !!errors.minimum} />
        </Field>
        <Field label="Anticipo (%)" htmlFor="pr-dep" error={submitted ? errors.deposit : null} hint={depositAmount ? `Sobre el precio base: ${formatBs(depositAmount)}` : "Porcentaje para reservar"}>
          <TextInput id="pr-dep" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} invalid={submitted && !!errors.deposit} />
        </Field>
      </div>
      <Field label="Condiciones de pago" htmlFor="pr-terms" className="mt-4">
        <TextArea id="pr-terms" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Anticipo para reservar la fecha; saldo el día del evento." className="min-h-[72px]" />
      </Field>
      <div className="mt-4 flex justify-end">
        <PanelButton variant="primary" disabled={!dirty} onClick={save}>
          <Check className="h-4 w-4" /> Guardar cambios
        </PanelButton>
      </div>
    </Card>
  );
}

/* ───────────── Packages ───────────── */

type PkgDraft = Omit<Package, "price" | "previousPrice" | "discountPct" | "durationHours"> & { price: string; previousPrice: string; discountPct: string; durationHours: string };

function toPkgDraft(p: Package): PkgDraft {
  return { ...p, price: p.price === null ? "" : String(p.price), previousPrice: p.previousPrice === null ? "" : String(p.previousPrice), discountPct: String(p.discountPct), durationHours: String(p.durationHours) };
}

function PackageForm({ initial, onClose }: { initial: PkgDraft; onClose: () => void }) {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof PkgDraft>(k: K, v: PkgDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const quote = d.pricingMode === "cotizacion";
  const price = quote ? { value: null, error: null } : parseAmount(d.price);
  const prev = parseAmount(d.previousPrice, { allowEmpty: true });
  const disc = parsePercent(d.discountPct || "0");
  const hours = Number(d.durationHours.replace(",", "."));
  const errors = {
    name: d.name.trim().length < 2 ? "Ponle un nombre" : null,
    price: price.error ?? (!quote && !price.value ? "El precio debe ser mayor a cero" : null),
    previousPrice: prev.error ?? (prev.value !== null && price.value !== null && prev.value <= price.value ? "Debe ser mayor que el precio actual" : null),
    discount: disc.error,
    duration: !Number.isFinite(hours) || hours <= 0 ? "Indica una duración mayor a cero" : null,
  };
  const final = price.value !== null ? applyPercent(price.value, disc.value ?? 0) : null;

  function save() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const pkg: Package = {
      ...d,
      id: d.id || uid("p"),
      name: d.name.trim(),
      price: quote ? null : price.value,
      previousPrice: quote ? null : prev.value,
      discountPct: quote ? 0 : disc.value ?? 0,
      durationHours: hours,
    };
    const exists = ws.packages.some((p) => p.id === pkg.id);
    run((w) => ({
      ...w,
      packages: (exists ? w.packages.map((p) => (p.id === pkg.id ? pkg : p)) : [...w.packages, pkg]).map((p) => (pkg.highlighted && p.id !== pkg.id ? { ...p, highlighted: false } : p)),
    }));
    toast({ tone: "success", title: exists ? "Paquete actualizado" : "Paquete creado", description: pkg.name });
    onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={initial.id ? `Editar ${initial.name}` : "Nuevo paquete"}
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton variant="primary" onClick={save}>
            Guardar paquete
          </PanelButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="pk-name" error={submitted ? errors.name : null}>
            <TextInput id="pk-name" value={d.name} onChange={(e) => set("name", e.target.value)} invalid={submitted && !!errors.name} autoFocus />
          </Field>
          <Field label="Modalidad" htmlFor="pk-mode">
            <Select id="pk-mode" value={d.pricingMode} onChange={(e) => set("pricingMode", e.target.value as PricingMode)}>
              {Array.from(new Set<PricingMode>(["paquete", ...PRICING_BY_KIND[ws.kind]])).map((m) => (
                <option key={m} value={m}>
                  {PRICING_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Precio" htmlFor="pk-price" error={submitted ? errors.price : null}>
            <MoneyInput id="pk-price" value={quote ? "" : d.price} disabled={quote} onChange={(e) => set("price", e.target.value)} invalid={submitted && !!errors.price} />
          </Field>
          <Field label="Descuento (%)" htmlFor="pk-disc" error={submitted ? errors.discount : null}>
            <TextInput id="pk-disc" inputMode="decimal" value={quote ? "" : d.discountPct} disabled={quote} onChange={(e) => set("discountPct", e.target.value)} invalid={submitted && !!errors.discount} />
          </Field>
          <Field label="Precio anterior" htmlFor="pk-prev" error={submitted ? errors.previousPrice : null} hint="Opcional, se muestra tachado">
            <MoneyInput id="pk-prev" value={quote ? "" : d.previousPrice} disabled={quote} onChange={(e) => set("previousPrice", e.target.value)} invalid={submitted && !!errors.previousPrice} />
          </Field>
        </div>

        {!quote && (
          <motion.div layout className="flex flex-wrap items-center gap-3 rounded-2xl border border-volt/30 bg-volt/[0.06] px-4 py-3 text-sm">
            <span className="text-ink-mid">Precio original</span>
            <span className="text-white">{price.value !== null ? formatBs(price.value) : "—"}</span>
            <ArrowRight className="h-4 w-4 text-ink-mid" />
            <span className="text-ink-mid">Descuento</span>
            <span className="text-white">{disc.value ?? 0} %</span>
            <ArrowRight className="h-4 w-4 text-ink-mid" />
            <span className="text-ink-mid">Precio final</span>
            <motion.span key={final ?? "x"} initial={{ scale: 1.15, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-general text-lg font-semibold text-volt">
              {final !== null ? formatBs(final) : "—"}
            </motion.span>
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duración (horas)" htmlFor="pk-dur" error={submitted ? errors.duration : null}>
            <TextInput id="pk-dur" inputMode="decimal" value={d.durationHours} onChange={(e) => set("durationHours", e.target.value)} invalid={submitted && !!errors.duration} />
          </Field>
          <Field label="Capacidad" htmlFor="pk-cap">
            <TextInput id="pk-cap" value={d.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Hasta 200 invitados" />
          </Field>
        </div>
        <Field label="Beneficios incluidos">
          <ListEditor label="Beneficios" items={d.benefits} onChange={(v) => set("benefits", v)} placeholder="Hora loca con cotillón" />
        </Field>
        {ws.addons.length > 0 && (
          <Field label="Servicios adicionales disponibles">
            <ChipGroup label="Adicionales del paquete" value={d.addonIds} onChange={(v) => set("addonIds", v)} options={ws.addons.map((a) => ({ value: a.id, label: `${a.name} · ${formatBs(a.price)}` }))} />
          </Field>
        )}
        <Switch checked={d.highlighted} onChange={(v) => set("highlighted", v)} label="Destacar como el más elegido" description="Solo un paquete puede estar destacado." />
        {/* Lets Enter submit; the visible button lives in the dialog footer. */}
        <button type="submit" hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

function PackagesCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [editing, setEditing] = useState<PkgDraft | null>(null);
  const [deleting, setDeleting] = useState<Package | null>(null);
  const blank: PkgDraft = { id: "", name: "", price: "", pricingMode: "paquete", previousPrice: "", discountPct: "0", durationHours: "4", capacity: "", benefits: [], addonIds: [], highlighted: false };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-general text-lg font-semibold text-white">Paquetes</h2>
          <p className="mt-1 text-sm text-ink-mid">Combina lo que ofreces en opciones fáciles de comparar.</p>
        </div>
        <PanelButton variant="primary" size="sm" onClick={() => setEditing(blank)}>
          <Plus className="h-4 w-4" /> Nuevo paquete
        </PanelButton>
      </div>
      {ws.packages.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Sparkles} title="Sin paquetes todavía" description="Tres opciones (básica, intermedia y completa) suelen funcionar mejor." />
        </div>
      ) : (
        <motion.ul layout className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {ws.packages.map((pk) => {
              const final = pk.price !== null ? applyPercent(pk.price, pk.discountPct) : null;
              const crossed = pk.discountPct > 0 ? pk.price : pk.previousPrice;
              return (
                <motion.li key={pk.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <div className={cn("relative flex h-full flex-col rounded-2xl border p-4", pk.highlighted ? "border-volt/50 bg-volt/[0.05]" : "border-white/[0.08] bg-white/[0.02]")}>
                    {pk.highlighted && (
                      <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-volt px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                        <Star className="h-3 w-3" /> Más elegido
                      </span>
                    )}
                    <p className="font-medium text-white">{pk.name}</p>
                    <p className="mt-2 font-general text-2xl font-semibold text-white">{pk.pricingMode === "cotizacion" || final === null ? "Cotización" : formatBs(final)}</p>
                    <p className="min-h-[18px] text-xs text-ink-mid">
                      {crossed && pk.pricingMode !== "cotizacion" ? <span className="line-through">{formatBs(crossed)}</span> : null}
                      {pk.discountPct > 0 && <span className="ml-2 text-volt">−{pk.discountPct} %</span>}
                      {PRICING_SUFFIX[pk.pricingMode] && pk.pricingMode !== "paquete" && <span className="ml-2">{PRICING_SUFFIX[pk.pricingMode]}</span>}
                    </p>
                    <p className="mt-2 text-xs text-ink-mid">
                      {pk.durationHours} h{pk.capacity ? ` · ${pk.capacity}` : ""}
                    </p>
                    <ul className="mt-3 flex flex-1 flex-col gap-1 text-sm text-ink-light">
                      {pk.benefits.map((b) => (
                        <li key={b} className="flex gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-volt" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {pk.addonIds.length > 0 && <p className="mt-3 text-xs text-ink-mid">+ {pk.addonIds.length} adicional(es) disponibles</p>}
                    <div className="mt-4 flex gap-2">
                      <PanelButton size="sm" className="flex-1" onClick={() => setEditing(toPkgDraft(pk))}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </PanelButton>
                      <PanelButton size="sm" variant="ghost" aria-label={`Eliminar ${pk.name}`} onClick={() => setDeleting(pk)}>
                        <Trash2 className="h-4 w-4" />
                      </PanelButton>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
      {editing && <PackageForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar este paquete?"
        description={deleting?.name}
        onConfirm={() => {
          if (!deleting) return;
          run((w) => ({ ...w, packages: w.packages.filter((p) => p.id !== deleting.id) }));
          toast({ tone: "success", title: "Paquete eliminado" });
        }}
      />
    </Card>
  );
}

/* ───────────── Add-ons ───────────── */

function AddonsCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<Addon["unit"]>("evento");
  const [submitted, setSubmitted] = useState(false);
  const pr = parseAmount(price);
  const errors = { name: name.trim().length < 2 ? "Escribe un nombre" : null, price: pr.error };

  function add() {
    setSubmitted(true);
    if (errors.name || errors.price) return;
    const addon: Addon = { id: uid("a"), name: name.trim(), price: pr.value ?? 0, unit };
    run((w) => ({ ...w, addons: [...w.addons, addon] }));
    toast({ tone: "success", title: "Adicional agregado", description: addon.name });
    setName("");
    setPrice("");
    setSubmitted(false);
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-general text-lg font-semibold text-white">Servicios adicionales</h2>
      <p className="mt-1 text-sm text-ink-mid">Extras con costo que el cliente puede sumar a un paquete.</p>
      <ul className="mt-4 flex flex-col divide-y divide-white/[0.06]">
        <AnimatePresence initial={false}>
          {ws.addons.map((a) => (
            <motion.li key={a.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-white">{a.name}</span>
              <span className="flex items-center gap-3">
                <span className="text-sm text-ink-light">
                  {formatBs(a.price)} <span className="text-xs text-ink-mid">por {a.unit}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Eliminar ${a.name}`}
                  onClick={() => {
                    run((w) => ({ ...w, addons: w.addons.filter((x) => x.id !== a.id), packages: w.packages.map((p) => ({ ...p, addonIds: p.addonIds.filter((id) => id !== a.id) })) }));
                    toast({ tone: "success", title: "Adicional eliminado", description: a.name });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {ws.addons.length === 0 && <li className="py-3 text-sm text-ink-mid">Aún no tienes adicionales.</li>}
      </ul>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_7.5rem_auto] sm:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Field label="Nombre" htmlFor="ad-name" error={submitted ? errors.name : null}>
          <TextInput id="ad-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hora extra" invalid={submitted && !!errors.name} />
        </Field>
        <Field label="Precio" htmlFor="ad-price" error={submitted ? errors.price : null}>
          <MoneyInput id="ad-price" value={price} onChange={(e) => setPrice(e.target.value)} invalid={submitted && !!errors.price} />
        </Field>
        <Field label="Por" htmlFor="ad-unit">
          <Select id="ad-unit" value={unit} onChange={(e) => setUnit(e.target.value as Addon["unit"])}>
            <option value="evento">evento</option>
            <option value="hora">hora</option>
            <option value="persona">persona</option>
          </Select>
        </Field>
        <PanelButton type="submit" variant="secondary" className="sm:mt-[26px]">
          <Plus className="h-4 w-4" /> Agregar
        </PanelButton>
      </form>
    </Card>
  );
}

/* ───────────── Tiers by duration or guests ───────────── */

function TiersCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [rows, setRows] = useState(() => ws.tiers.map((t) => ({ ...t, min: String(t.min), max: t.max === null ? "" : String(t.max), price: String(t.price) })));
  const [submitted, setSubmitted] = useState(false);

  const checked = rows.map((r) => {
    const min = Number(r.min);
    const max = r.max.trim() ? Number(r.max) : null;
    const price = parseAmount(r.price);
    let error: string | null = null;
    if (!Number.isInteger(min) || min < 0) error = "El mínimo debe ser un número entero positivo";
    else if (max !== null && (!Number.isInteger(max) || max < min)) error = "El máximo debe ser mayor o igual al mínimo";
    else if (price.error) error = `Precio: ${price.error.toLowerCase()}`;
    return { row: r, min, max, price: price.value, error };
  });

  function save() {
    setSubmitted(true);
    if (checked.some((c) => c.error)) return toast({ tone: "error", title: "Revisa las tarifas", description: "Hay filas con valores inválidos." });
    const tiers: PriceTier[] = checked.map((c) => ({ id: c.row.id, basis: c.row.basis, min: c.min, max: c.max, price: c.price ?? 0 }));
    run((w) => ({ ...w, tiers }));
    toast({ tone: "success", title: "Tarifas guardadas" });
    setSubmitted(false);
  }

  const update = (id: string, patch: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-general text-lg font-semibold text-white">Precios por duración o invitados</h2>
      <p className="mt-1 text-sm text-ink-mid">Define cuánto cobras según las horas de servicio o el número de invitados.</p>
      <div className="mt-4 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {checked.map(({ row, error }) => (
            <motion.div key={row.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/[0.06] p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[7.5rem_1fr_1fr_1.3fr_auto] sm:items-center">
                <Select aria-label="Según" value={row.basis} onChange={(e) => update(row.id, { basis: e.target.value as PriceTier["basis"] })}>
                  <option value="horas">Horas</option>
                  <option value="invitados">Invitados</option>
                </Select>
                <TextInput aria-label="Desde" inputMode="numeric" value={row.min} onChange={(e) => update(row.id, { min: e.target.value })} placeholder="Desde" />
                <TextInput aria-label="Hasta" inputMode="numeric" value={row.max} onChange={(e) => update(row.id, { max: e.target.value })} placeholder="Sin límite" />
                <MoneyInput aria-label="Precio" value={row.price} onChange={(e) => update(row.id, { price: e.target.value })} />
                <button
                  type="button"
                  aria-label="Quitar fila"
                  onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                  className="col-span-2 flex h-10 items-center justify-center rounded-xl text-ink-mid hover:bg-white/5 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:col-span-1 sm:w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {submitted && error && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                  {error}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && <p className="text-sm text-ink-mid">Sin tarifas escalonadas: se usa el precio base.</p>}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <PanelButton size="sm" onClick={() => setRows((rs) => [...rs, { id: uid("t"), basis: ws.kind === "catering" ? "invitados" : "horas", min: "", max: "", price: "" }])}>
          <Plus className="h-4 w-4" /> Agregar tarifa
        </PanelButton>
        <PanelButton size="sm" variant="primary" onClick={save}>
          <Check className="h-4 w-4" /> Guardar tarifas
        </PanelButton>
      </div>
    </Card>
  );
}

/* ───────────── General discount ───────────── */

function DiscountCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const p = ws.pricing;
  const [enabled, setEnabled] = useState(p.discountEnabled);
  const [pct, setPct] = useState(String(p.discountPct));
  const [from, setFrom] = useState(p.discountFrom);
  const [to, setTo] = useState(p.discountTo);
  const [submitted, setSubmitted] = useState(false);
  const pctR = parsePercent(pct);
  const errors = {
    pct: enabled ? pctR.error ?? (pctR.value === 0 ? "Debe ser mayor a 0 %" : pctR.value === 100 ? "Un descuento del 100 % deja el precio en cero" : null) : null,
    dates: enabled && (!from || !to) ? "Indica ambas fechas" : enabled && from > to ? "La fecha de inicio debe ser anterior a la de fin" : null,
  };

  function save(next: Partial<PricingSettings> = {}) {
    setSubmitted(true);
    const on = next.discountEnabled ?? enabled;
    if (on && (errors.pct || errors.dates)) return;
    run((w) => ({ ...w, pricing: { ...w.pricing, discountEnabled: on, discountPct: pctR.value ?? 0, discountFrom: from, discountTo: to, ...next } }));
    toast({ tone: "success", title: on ? "Descuento activo" : "Descuento desactivado" });
  }

  return (
    <Card className="p-5 sm:p-6">
      <Switch
        checked={enabled}
        onChange={(v) => {
          setEnabled(v);
          if (!v) save({ discountEnabled: false });
        }}
        label="Descuento general"
        description="Se aplica sobre el precio base durante las fechas que elijas."
      />
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label="Descuento (%)" htmlFor="dc-pct" error={submitted ? errors.pct : null}>
                <TextInput id="dc-pct" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} invalid={submitted && !!errors.pct} />
              </Field>
              <Field label="Desde" htmlFor="dc-from" error={submitted ? errors.dates : null}>
                <TextInput id="dc-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="[color-scheme:dark]" />
              </Field>
              <Field label="Hasta" htmlFor="dc-to">
                <TextInput id="dc-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="[color-scheme:dark]" />
              </Field>
            </div>
            {ws.pricing.basePrice > 0 && pctR.value !== null && (
              <p className="mt-4 text-sm text-ink-mid">
                Tu precio base de <span className="text-white">{formatBs(ws.pricing.basePrice)}</span> se mostrará a{" "}
                <span className="font-semibold text-volt">{formatBs(applyPercent(ws.pricing.basePrice, pctR.value))}</span>.
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <PanelButton variant="primary" onClick={() => save({ discountEnabled: true })}>
                <Check className="h-4 w-4" /> Guardar descuento
              </PanelButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function Pricing() {
  const { activeId } = usePanel();
  return (
    <div className="flex flex-col gap-6" key={activeId}>
      <SectionHeader title="Precios y paquetes" description="Tu tarifa base, tus paquetes y los extras. Todos los importes en bolivianos (Bs)." />
      <DemoNote>Los importes de ejemplo son datos de demostración, no precios de mercado verificados.</DemoNote>
      <BaseCard />
      <PackagesCard />
      <div className="grid gap-6 xl:grid-cols-2">
        <AddonsCard />
        <TiersCard />
      </div>
      <DiscountCard />
    </div>
  );
}
