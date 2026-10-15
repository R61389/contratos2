"use client";

import { PanelStoreProvider } from "@/components/panel/store";
import { PanelShell } from "@/components/panel/shell";
import { ToastProvider } from "@/components/panel/ui/toaster";

function PanelSkeleton() {
  return (
    <div className="flex min-h-svh bg-ink" aria-busy="true" aria-label="Cargando el panel">
      <div className="hidden w-[272px] shrink-0 border-r border-white/[0.06] bg-[#111111] lg:block" />
      <div className="flex-1 p-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/[0.05]" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

export function PanelApp({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PanelStoreProvider fallback={<PanelSkeleton />}>
        <PanelShell>{children}</PanelShell>
      </PanelStoreProvider>
    </ToastProvider>
  );
}
