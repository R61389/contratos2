"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ProviderWorkspace } from "@/lib/panel/types";
import { createDemoWorkspace, createDemoWorkspaces, DEMO_PROVIDER_IDS, type DemoProviderId } from "@/lib/panel/demo-data";
import { revokeAll, revokeWorkspaceUrls } from "@/lib/panel/object-urls";

/**
 * Session-only store for the demo. Every write names the provider it belongs to and can only replace that
 * provider's workspace, so switching the demo provider mid-action can never write into another one. When a
 * backend exists, `run` becomes the place that calls the API for the active provider.
 */

interface State {
  activeId: DemoProviderId;
  workspaces: Record<DemoProviderId, ProviderWorkspace>;
}

type Change = (ws: ProviderWorkspace) => { ws?: ProviderWorkspace; error?: string } | ProviderWorkspace;

interface PanelApi {
  ws: ProviderWorkspace;
  activeId: DemoProviderId;
  providers: { id: DemoProviderId; name: string; kind: ProviderWorkspace["kind"]; logoUrl: string | null }[];
  switchProvider: (id: DemoProviderId) => void;
  /** Applies a change to the active provider; returns an error message when the change is refused. */
  run: (change: Change) => string | null;
  resetActive: () => void;
}

const PanelContext = createContext<PanelApi | null>(null);
const ACTIVE_KEY = "vibra:panel-provider";

export function PanelStoreProvider({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const ref = useRef<State | null>(null);

  const commit = useCallback((next: State) => {
    ref.current = next;
    setState(next);
  }, []);

  // Built on the client only: demo dates are relative to the visitor's "today".
  useEffect(() => {
    let activeId: DemoProviderId = "eclipse";
    try {
      const saved = sessionStorage.getItem(ACTIVE_KEY) as DemoProviderId | null;
      if (saved && DEMO_PROVIDER_IDS.includes(saved)) activeId = saved;
    } catch {}
    commit({ activeId, workspaces: createDemoWorkspaces() });
    return () => revokeAll();
  }, [commit]);

  const switchProvider = useCallback(
    (id: DemoProviderId) => {
      if (!ref.current) return;
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
      if (next.id !== current.workspaces[owner].id) return "Ese cambio pertenece a otro proveedor.";
      commit({ ...current, workspaces: { ...current.workspaces, [owner]: next } });
      return null;
    },
    [commit]
  );

  const resetActive = useCallback(() => {
    const current = ref.current;
    if (!current) return;
    revokeWorkspaceUrls(current.workspaces[current.activeId]);
    commit({ ...current, workspaces: { ...current.workspaces, [current.activeId]: createDemoWorkspace(current.activeId) } });
  }, [commit]);

  const api = useMemo<PanelApi | null>(() => {
    if (!state) return null;
    return {
      ws: state.workspaces[state.activeId],
      activeId: state.activeId,
      providers: DEMO_PROVIDER_IDS.map((id) => ({
        id,
        name: state.workspaces[id].profile.businessName,
        kind: state.workspaces[id].kind,
        logoUrl: state.workspaces[id].profile.logoUrl,
      })),
      switchProvider,
      run,
      resetActive,
    };
  }, [state, switchProvider, run, resetActive]);

  if (!api) return <>{fallback}</>;
  return <PanelContext.Provider value={api}>{children}</PanelContext.Provider>;
}

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel must be used inside <PanelStoreProvider>");
  return ctx;
}
