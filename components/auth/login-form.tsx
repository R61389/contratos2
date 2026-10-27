"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Field, TextInput } from "@/components/panel/ui/fields";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBrowserClient } from "@/lib/supabase/client";

/** Only same-site paths, so the link can't send someone to another website after signing in. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/panel";
}

const button =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-volt px-5 text-sm font-medium text-ink transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-50";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("siguiente"));
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Someone who is already signed in goes straight to the panel.
  useEffect(() => {
    if (!configured) return;
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => data.session && router.replace(next));
  }, [configured, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError("Escribe tu correo y tu contraseña.");
    setBusy(true);
    const { error } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      return setError(error.message.includes("Invalid login") ? "El correo o la contraseña no son correctos." : "No pudimos iniciar sesión. Inténtalo de nuevo en un momento.");
    }
    router.replace(next);
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt text-ink">
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-base font-black tracking-[0.18em] text-white">
          VIB<span className="text-volt">RA</span>
        </span>
      </Link>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h1 className="font-general text-xl font-semibold text-white">Entra a tu panel</h1>
        <p className="mt-1.5 text-sm text-ink-mid">Administra tu perfil, precios, fotos y reservas.</p>

        {configured ? (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Correo" htmlFor="email">
              <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Contraseña" htmlFor="password" error={error}>
              <TextInput id="password" type="password" autoComplete="current-password" value={password} invalid={Boolean(error)} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <button type="submit" disabled={busy} className={button}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Entrando…" : "Entrar"}
            </button>
            <p className="text-center text-xs text-ink-mid">¿Olvidaste tu contraseña o aún no tienes cuenta? Escríbele al equipo de VIBRA.</p>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <p className="rounded-2xl border border-volt/20 bg-volt/[0.07] p-4 text-sm text-ink-light">
              Las cuentas todavía no están activadas en este sitio. Puedes explorar el panel con proveedores de demostración.
            </p>
            <Link href="/panel" className={button}>
              Ver el panel de demostración
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
