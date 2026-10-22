"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProviderWorkspace } from "@/lib/panel/types";
import { createDemoWorkspace, createDemoWorkspaces, DEMO_PROVIDER_IDS, type DemoProviderId } from "@/lib/panel/demo-data";
import { revokeAll, revokeWorkspaceUrls } from "@/lib/panel/object-urls";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBrowserClient } from "@/lib/supabase/client";
import { loadWorkspace, loadWorkspaces } from "@/lib/panel/repository";
import { explainError, syncWorkspace } from "@/lib/panel/sync";
import { useToast } from "@/components/panel/ui/toaster";

/**
 * The panel's single source of truth.
 * - Demo mode (no Supabase configured): demo workspaces that live in this tab only.
 * - Live mode: the signed-in user's providers, loaded from Supabase. Every change shows at once and is saved
 *   in the background, one save at a time; if the server refuses it, the provider is reloaded from the database.
 * Every write names the provider it belongs to and can only replace that provider's workspace.
 */

export type PanelMode = "demo" | "live";
export type SaveState = "idle" | "saving" | "saved" | "error";

interface State {
  activeId: string;
  order: string[];
  workspaces: Record<string, ProviderWorkspace>;
}

type Change = (ws: ProviderWorkspace) => { ws?: ProviderWorkspace; error?: string } | ProviderWorkspace;

interface PanelApi {
  ws: ProviderWorkspace;
  activeId: string;
  mode: PanelMode;
  saveState: SaveState;
  providers: { id: string; name: string; kind: ProviderWorkspace["kind"]; logoUrl: string | null }[];
  switchProvider: (id: string) => void;
  /** Applies a change to the active provider; returns an error message when the change is refused. */
  run: (change: Change) => string | null;
  /** Demo only: back to the initial demo data for the active provider. */
  resetActive: () => void;
  signOut: () => Promise<void>;
}

const PanelContext = createContext<PanelApi | null>(null);
const ACTIVE_KEY = "vibra:panel-provider";

type Phase = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string } | { kind: "unlinked"; email: string };

/** Puts the permanent URLs of freshly uploaded photos into what the screen shows. */
function withUploads(current: ProviderWorkspace, saved: ProviderWorkspace): ProviderWorkspace {
  const urls = new Map(saved.media.map((m) => [m.id, m]));
  return {
    ...current,
    media: current.media.map((m) => (m.url.startsWith("blob:") && urls.get(m.id) ? { ...m, url: urls.get(m.id)!.url, storagePath: urls.get(m.id)!.storagePath, source: "demo" } : m)),
    profile: {
      ...current.profile,
      logoUrl: current.profile.logoUrl?.startsWith("blob:") ? saved.profile.logoUrl : current.profile.logoUrl,
      coverUrl: current.profile.coverUrl?.startsWith("blob:") ? saved.profile.coverUrl : current.profile.coverUrl,
    },
  };
}

export function PanelStoreProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const mode: PanelMode = isSupabaseConfigured() ? "live" : "demo";
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<State | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const ref = useRef<State | null>(null);
  /** Last version of each provider known to be in the database. */
  const synced = useRef<Record<string, ProviderWorkspace>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());

  const commit = useCallback((next: State) => {
    ref.current = next;
    setState(next);
  }, []);

  const start = useCallback(
    (workspaces: ProviderWorkspace[]) => {
      let activeId = workspaces[0].id;
      try {
        const saved = sessionStorage.getItem(ACTIVE_KEY);
        if (saved && workspaces.some((w) => w.id === saved)) activeId = saved;
      } catch {}
      synced.current = Object.fromEntries(workspaces.map((w) => [w.id, w]));
      commit({ activeId, order: workspaces.map((w) => w.id), workspaces: Object.fromEntries(workspaces.map((w) => [w.id, w])) });
      setPhase({ kind: "ready" });
    },
    [commit]
  );

  // Built on the client only: demo dates depend on the visitor's "today", and live data needs the session.
  useEffect(() => {
    if (mode === "demo") {
      const demo = createDemoWorkspaces();
      start(DEMO_PROVIDER_IDS.map((id) => demo[id]));
      return () => revokeAll();
    }
    const sb = getBrowserClient();
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace("/acceso?siguiente=/panel");
        return;
      }
      try {
        const workspaces = await loadWorkspaces(sb, user.id);
        if (cancelled) return;
        if (!workspaces.length) setPhase({ kind: "unlinked", email: user.email ?? "" });
        else start(workspaces);
      } catch (e) {
        if (!cancelled) setPhase({ kind: "error", message: (e as Error).message });
      }
    })();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/acceso");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      revokeAll();
    };
  }, [mode, router, start]);

  /** Saves the latest version of a provider, after any save already running. */
  const save = useCallback(
    (owner: string) => {
      setSaveState("saving");
      queue.current = queue.current.then(async () => {
        const latest = ref.current?.workspaces[owner];
        const base = synced.current[owner];
        if (!latest || !base || latest === base) {
          setSaveState("saved");
          return;
        }
        const sb = getBrowserClient();
        try {
          const saved = await syncWorkspace(sb, base, latest);
          synced.current[owner] = saved;
          const current = ref.current;
          if (current && saved !== latest) {
            const patched = withUploads(current.workspaces[owner], saved);
            commit({ ...current, workspaces: { ...current.workspaces, [owner]: patched } });
            if (current.workspaces[owner] === latest) synced.current[owner] = patched;
          }
          setSaveState("saved");
        } catch (e) {
          setSaveState("error");
          toast({ tone: "error", title: "No se guardó el último cambio", description: `${explainError(e as Error)} Recargamos tus datos.` });
          try {
            const fresh = await loadWorkspace(sb, owner);
            synced.current[owner] = fresh;
            const current = ref.current;
            if (current) commit({ ...current, workspaces: { ...current.workspaces, [owner]: fresh } });
          } catch {}
        }
      });
    },
    [commit, toast]
  );

  const switchProvider = useCallback(
    (id: string) => {
      if (!ref.current?.workspaces[id]) return;
      commit({ ...ref.current, activeId: id });
      try {
        sessionStorage.setItem(ACTIVE_KEY, id);
      } catch {}
    },
    [commit]
  );

  const run = useCallback(
    (change: Change) => {
      const current = ref.current;
      if (!current) return "El panel todavía está cargando.";
      const owner = current.activeId;
      const result = change(current.workspaces[owner]);
      const next = "id" in result ? result : result.ws;
      if (!next) return ("error" in result && result.error) || "No se pudo aplicar el cambio.";
      if (next.id !== owner) return "Ese cambio pertenece a otro proveedor.";
      commit({ ...current, workspaces: { ...current.workspaces, [owner]: next } });
      if (mode === "live") save(owner);
      return null;
    },
    [commit, mode, save]
  );

  const resetActive = useCallback(() => {
    const current = ref.current;
    if (!current || mode !== "demo") return;
    revokeWorkspaceUrls(current.workspaces[current.activeId]);
    const fresh = createDemoWorkspace(current.activeId as DemoProviderId);
    commit({ ...current, workspaces: { ...current.workspaces, [current.activeId]: fresh } });
  }, [commit, mode]);

  const signOut = useCallback(async () => {
    if (mode === "live") await getBrowserClient().auth.signOut();
    router.replace(mode === "live" ? "/acceso" : "/");
  }, [mode, router]);

  const api = useMemo<PanelApi | null>(() => {
    if (!state) return null;
    return {
      ws: state.workspaces[state.activeId],
      activeId: state.activeId,
      mode,
      saveState,
      providers: state.order.map((id) => ({
        id,
        name: state.workspaces[id].profile.businessName,
        kind: state.workspaces[id].kind,
        logoUrl: state.workspaces[id].profile.logoUrl,
      })),
      switchProvider,
      run,
      resetActive,
      signOut,
    };
  }, [state, mode, saveState, switchProvider, run, resetActive, signOut]);

  if (phase.kind === "error") return <PanelMessage title="No pudimos cargar tu panel" body={phase.message} action="Reintentar" onAction={() => location.reload()} />;
  if (phase.kind === "unlinked")
    return (
      <PanelMessage
        title="Tu cuenta todavía no administra ningún negocio"
        body={`Entraste como ${phase.email}. Pide a VIBRA que vincule tu cuenta con tu perfil de proveedor y vuelve a entrar.`}
        action="Cerrar sesión"
        onAction={async () => {
          await getBrowserClient().auth.signOut();
          router.replace("/acceso");
        }}
      />
    );
  if (!api) return <>{fallback}</>;
  return <PanelContext.Provider value={api}>{children}</PanelContext.Provider>;
}

function PanelMessage({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-ink px-4">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="font-general text-xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm text-ink-mid">{body}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-volt px-5 text-sm font-medium text-ink hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {action}
        </button>
      </div>
    </div>
  );
}

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used inside <PanelStoreProvider>");
  return ctx;
}
