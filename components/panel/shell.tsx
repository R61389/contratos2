"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronsUpDown,
  CloudOff,
  ClipboardList,
  ExternalLink,
  FlaskConical,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu as MenuIcon,
  Music,
  Settings,
  Sparkles,
  Store,
  Tags,
  TicketPercent,
  UserRound,
  X,
} from "lucide-react";
import { usePanel } from "@/components/panel/store";
import { Modal, PanelButton } from "@/components/panel/ui/modal";
import { Thumb } from "@/components/panel/ui/misc";
import { KIND_LABEL, relativeTime } from "@/lib/panel/format";
import type { ProviderKind } from "@/lib/panel/types";
import { cn } from "@/lib/utils";

export const NAV: { href: string; label: string; icon: typeof Music; kinds?: ProviderKind[] }[] = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboard },
  { href: "/panel/solicitudes", label: "Solicitudes de reserva", icon: ClipboardList },
  { href: "/panel/servicios", label: "Mis servicios", icon: Store },
  { href: "/panel/precios", label: "Precios y paquetes", icon: Tags },
  { href: "/panel/galeria", label: "Galería multimedia", icon: Images },
  { href: "/panel/musica", label: "Música", icon: Music, kinds: ["musica", "dj"] },
  { href: "/panel/calendario", label: "Calendario y disponibilidad", icon: CalendarDays },
  { href: "/panel/promociones", label: "Promociones y descuentos", icon: TicketPercent },
  { href: "/panel/perfil", label: "Perfil público", icon: UserRound },
  { href: "/panel/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] font-general text-xs font-semibold text-volt" style={{ width: size, height: size }}>
      {url ? <Thumb src={url} alt="" className="h-full w-full object-contain" /> : initials(name)}
    </span>
  );
}

function ProviderSwitcher() {
  const { providers, activeId, switchProvider, mode } = usePanel();
  const router = useRouter();
  const active = providers.find((p) => p.id === activeId)!;
  const label = mode === "demo" ? "Proveedor demo" : "Tu negocio";
  if (providers.length === 1)
    return (
      <div className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5">
        <Avatar name={active.name} url={active.logoUrl} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-volt">{label}</span>
          <span className="block truncate text-sm text-white">{active.name}</span>
        </span>
      </div>
    );
  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-left transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
        <Avatar name={active.name} url={active.logoUrl} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-volt">{label}</span>
          <span className="block truncate text-sm text-white">{active.name}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-mid" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content side="top" align="start" sideOffset={8} className="z-[95] w-[260px] rounded-2xl border border-white/10 bg-[#1c1c1c] p-1.5 shadow-2xl">
          <Menu.Label className="px-3 py-2 text-[11px] text-ink-mid">{mode === "demo" ? "Cambia de proveedor para ver sus propios datos" : "Elige qué negocio administrar"}</Menu.Label>
          {providers.map((p) => (
            <Menu.Item
              key={p.id}
              onSelect={() => {
                switchProvider(p.id);
                router.push("/panel");
              }}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 outline-none data-[highlighted]:bg-white/[0.06]"
            >
              <Avatar name={p.name} url={p.logoUrl} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{p.name}</span>
                <span className="block text-[11px] text-ink-mid">{KIND_LABEL[p.kind]}</span>
              </span>
              {p.id === activeId && <span className="h-2 w-2 rounded-full bg-volt" aria-label="Activo" />}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { ws, mode, signOut } = usePanel();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pending = ws.requests.filter((r) => r.status === "pendiente").length;

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-5 pt-6" onClick={onNavigate}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-volt text-ink">
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-sm font-black tracking-[0.18em] text-white">
          VIB<span className="text-volt">RA</span>
        </span>
        <span className="ml-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-ink-mid">Proveedores</span>
      </Link>

      <nav aria-label="Secciones del panel" className="mt-8 flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-0.5">
          {NAV.filter((n) => !n.kinds || n.kinds.includes(ws.kind)).map(({ href, label, icon: Icon }) => {
            const active = href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
                    active ? "text-white" : "text-ink-mid hover:bg-white/[0.03] hover:text-ink-light"
                  )}
                >
                  {active && (
                    <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  {active && <motion.span layoutId="nav-bar" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-volt" />}
                  <Icon className={cn("relative h-[18px] w-[18px]", active && "text-volt")} />
                  <span className="relative flex-1">{label}</span>
                  {href === "/panel/solicitudes" && pending > 0 && (
                    <span className="relative rounded-full bg-volt px-1.5 text-[11px] font-bold text-ink" aria-label={`${pending} pendientes`}>
                      {pending}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t border-white/[0.06] p-3">
        <ProviderSwitcher />
        <div className="flex items-center justify-between px-1">
          <span className={cn("flex items-center gap-1.5 text-xs", ws.verified ? "text-volt" : "text-ink-mid")}>
            <BadgeCheck className="h-4 w-4" />
            {ws.verified ? "Proveedor verificado" : "Verificación pendiente"}
          </span>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-mid transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      <Modal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Cerrar sesión"
        description={mode === "demo" ? "Esta demostración no tiene cuentas ni inicio de sesión." : "Tus cambios ya están guardados."}
        size="sm"
        footer={
          <>
            <PanelButton variant="ghost" onClick={() => setLogoutOpen(false)}>
              Seguir en el panel
            </PanelButton>
            {mode === "demo" ? (
              <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full bg-volt px-5 text-sm font-medium text-ink hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                Salir al sitio
              </Link>
            ) : (
              <PanelButton
                disabled={leaving}
                onClick={async () => {
                  setLeaving(true);
                  await signOut();
                }}
              >
                {leaving ? "Cerrando…" : "Cerrar sesión"}
              </PanelButton>
            )}
          </>
        }
      >
        <p className="text-sm text-ink-light">
          {mode === "demo"
            ? "Puedes salir al sitio público; los cambios de esta demo se perderán al recargar la página."
            : "Para volver a administrar tu negocio tendrás que entrar de nuevo con tu correo y contraseña."}
        </p>
      </Modal>
    </div>
  );
}

function Notifications() {
  const { ws, run } = usePanel();
  const router = useRouter();
  const unread = ws.notifications.filter((n) => !n.read).length;
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-light transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
      >
        <Bell className="h-[18px] w-[18px]" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-volt px-1 text-[10px] font-bold text-ink">
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className="z-[95] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-[#1c1c1c] p-1.5 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-white">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => run((w) => ({ ...w, notifications: w.notifications.map((n) => ({ ...n, read: true })) }))}
                className="text-xs text-volt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          {ws.notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-mid">No tienes notificaciones.</p>}
          {ws.notifications.map((n) => (
            <Menu.Item
              key={n.id}
              onSelect={() => {
                run((w) => ({ ...w, notifications: w.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
                router.push(n.href);
              }}
              className="flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 outline-none data-[highlighted]:bg-white/[0.06]"
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-volt")} />
              <span className="min-w-0">
                <span className="block text-sm text-white">{n.title}</span>
                <span className="block text-xs text-ink-mid">
                  {n.body} · {relativeTime(n.at)}
                </span>
              </span>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function SaveIndicator() {
  const { saveState } = usePanel();
  if (saveState === "idle") return null;
  const view = {
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: "Guardando…", tone: "text-ink-mid" },
    saved: { icon: <Check className="h-3.5 w-3.5" />, text: "Guardado", tone: "text-emerald-300" },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, text: "Sin guardar", tone: "text-red-300" },
  }[saveState];
  return (
    <span role="status" aria-live="polite" className={cn("hidden items-center gap-1.5 text-xs sm:inline-flex", view.tone)}>
      {view.icon}
      {view.text}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { ws } = usePanel();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú del panel"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-light lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-mid">
            {greeting()}, <span className="font-medium text-white">{ws.profile.businessName}</span>
          </p>
          <Link href="/panel/perfil" className="mt-0.5 inline-flex items-center gap-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
            <span className={cn("h-2 w-2 rounded-full", ws.profile.published ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-ink-mid")} />
            <span className={ws.profile.published ? "text-emerald-300" : "text-ink-mid"}>{ws.profile.published ? "Perfil publicado" : "Perfil sin publicar"}</span>
          </Link>
        </div>
        <SaveIndicator />
        <a
          href={`/proveedores/${ws.publicSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-ink-light transition-colors hover:border-volt/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:inline-flex"
        >
          Ver mi perfil público
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <Notifications />
        <Link href="/panel/configuracion" aria-label="Configuración de la cuenta" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
          <Avatar name={ws.profile.businessName} url={ws.profile.logoUrl} size={40} />
        </Link>
      </div>
    </header>
  );
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { activeId, mode } = usePanel();

  return (
    <div className="flex min-h-svh bg-ink">
      <aside className="sticky top-0 hidden h-svh w-[272px] shrink-0 border-r border-white/[0.06] bg-[#111111] lg:block">
        <SidebarBody />
      </aside>

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <AnimatePresence>
          {menuOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm lg:hidden" />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-y-0 left-0 z-[81] w-[86vw] max-w-[300px] border-r border-white/10 bg-[#111111] focus:outline-none lg:hidden"
                >
                  <Dialog.Title className="sr-only">Menú del panel</Dialog.Title>
                  <Dialog.Description className="sr-only">Navegación entre las secciones del panel</Dialog.Description>
                  <Dialog.Close aria-label="Cerrar menú" className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                  <SidebarBody onNavigate={() => setMenuOpen(false)} />
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        {mode === "demo" && (
          <div className="flex items-center justify-center gap-2 border-b border-volt/20 bg-volt/[0.07] px-4 py-1.5 text-center text-[11px] text-ink-light">
            <FlaskConical className="h-3.5 w-3.5 shrink-0 text-volt" />
            <span>
              <strong className="font-semibold text-volt">Modo demostración.</strong> Datos ficticios; los cambios viven solo en esta pestaña y se pierden al recargar.
            </span>
          </div>
        )}
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <motion.main
          key={`${activeId}:${pathname}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
