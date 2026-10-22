"use client";

import { useState } from "react";
import { Check, RotateCcw, ShieldAlert } from "lucide-react";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { Card, DemoNote, SectionHeader } from "@/components/panel/ui/misc";
import { ConfirmDialog, PanelButton } from "@/components/panel/ui/modal";
import { Field, Switch, TextInput } from "@/components/panel/ui/fields";
import type { PanelSettings } from "@/lib/panel/types";

export function SettingsSection() {
  const { ws, run, resetActive, mode } = usePanel();
  const toast = useToast();
  const [email, setEmail] = useState(ws.settings.email);
  const [submitted, setSubmitted] = useState(false);
  const [resetting, setResetting] = useState(false);
  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "Escribe un correo válido";

  function toggle(key: keyof Omit<PanelSettings, "email">, value: boolean, label: string) {
    run((w) => ({ ...w, settings: { ...w.settings, [key]: value } }));
    toast({ tone: "success", title: `${label}: ${value ? "activado" : "desactivado"}` });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Configuración" description="Tu cuenta, tus avisos y las herramientas de la demostración." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-general text-base font-semibold text-white">Cuenta</h2>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (emailError) return;
              run((w) => ({ ...w, settings: { ...w.settings, email: email.trim() } }));
              toast({ tone: "success", title: "Correo actualizado", description: "En la demo no se envía ningún correo de verificación." });
              setSubmitted(false);
            }}
          >
            <Field label="Correo de la cuenta" htmlFor="st-email" error={submitted ? emailError : null} hint="Correo ficticio de la demo">
              <TextInput id="st-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={submitted && !!emailError} />
            </Field>
            <PanelButton type="submit" variant="primary" className="self-start" disabled={email.trim() === ws.settings.email}>
              <Check className="h-4 w-4" /> Guardar correo
            </PanelButton>
          </form>
          <DemoNote className="mt-5">La contraseña, el inicio de sesión y la verificación del correo se implementarán junto con la autenticación real.</DemoNote>
        </Card>

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <h2 className="font-general text-base font-semibold text-white">Notificaciones</h2>
          <Switch checked={ws.settings.notifyEmail} onChange={(v) => toggle("notifyEmail", v, "Avisos por correo")} label="Avisos por correo" description="Nuevas solicitudes y cambios de estado." />
          <Switch checked={ws.settings.notifyWhatsapp} onChange={(v) => toggle("notifyWhatsapp", v, "Avisos por WhatsApp")} label="Avisos por WhatsApp" description="Un mensaje cuando llega una solicitud nueva." />
          <Switch checked={ws.settings.weeklySummary} onChange={(v) => toggle("weeklySummary", v, "Resumen semanal")} label="Resumen semanal" description="Visitas, solicitudes y reservas de la semana." />
          <Switch
            checked={ws.settings.autoDecline}
            onChange={(v) => toggle("autoDecline", v, "Rechazo automático")}
            label="Rechazar solicitudes en fechas bloqueadas"
            description="Responde con amabilidad cuando piden un día que bloqueaste."
          />
          <DemoNote>{mode === "demo" ? "Las preferencias se guardan en la demo, pero todavía no se envía ningún aviso real." : "Tus preferencias quedan guardadas; los avisos por correo y WhatsApp llegarán en una próxima versión."}</DemoNote>
        </Card>
      </div>

      <Card className="border-red-400/20 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          <div className="flex-1">
            <h2 className="font-general text-base font-semibold text-white">{mode === "demo" ? "Herramientas de la demostración" : "Visibilidad del perfil"}</h2>
            <p className="mt-1 text-sm text-ink-mid">
              {mode === "demo" ? (
                <>
                  Vuelve a los datos iniciales de <span className="text-white">{ws.profile.businessName}</span>. Los otros proveedores de la demo no se modifican.
                </>
              ) : (
                "Un perfil despublicado deja de aparecer en el directorio y su página pública deja de mostrarse."
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {mode === "demo" && (
                <PanelButton variant="danger" onClick={() => setResetting(true)}>
                  <RotateCcw className="h-4 w-4" /> Restablecer datos de este proveedor
                </PanelButton>
              )}
              <PanelButton
                onClick={() => {
                  const next = !ws.profile.published;
                  run((w) => ({ ...w, profile: { ...w.profile, published: next } }));
                  toast({ tone: "success", title: next ? "Perfil publicado" : "Perfil despublicado" });
                }}
              >
                {ws.profile.published ? "Despublicar perfil" : "Publicar perfil"}
              </PanelButton>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title="¿Restablecer los datos?"
        confirmLabel="Restablecer"
        description="Se perderán los servicios, fotos, precios y respuestas que cambiaste en esta sesión para este proveedor."
        onConfirm={() => {
          resetActive();
          toast({ tone: "success", title: "Datos restablecidos" });
        }}
      />
    </div>
  );
}
