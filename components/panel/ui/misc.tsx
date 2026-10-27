"use client";

import { useEffect } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { FlaskConical, MoreHorizontal } from "lucide-react";
import type { RequestStatus } from "@/lib/panel/types";
import { STATUS_LABEL } from "@/lib/panel/format";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.025]", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-general text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-mid">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Number that counts to its value and re-animates when it changes. */
export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString("es-BO") }: { value: number; format?: (v: number) => string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value, mv, reduce]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  format,
  hint,
  accent,
  index = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  format?: (v: number) => string;
  hint?: string;
  accent?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 sm:p-5",
        accent ? "border-volt/30 bg-volt/[0.06]" : "border-white/[0.08] bg-white/[0.025]"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-mid">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", accent ? "bg-volt text-ink" : "bg-white/[0.05] text-volt")}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-general text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="mt-1 text-xs text-ink-mid">{hint}</p>}
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-volt">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-general text-base font-semibold text-white">{title}</p>
      <p className="max-w-sm text-sm text-ink-mid">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<RequestStatus, string> = {
  pendiente: "border-volt/40 bg-volt/10 text-volt",
  modificacion: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  aceptada: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
  confirmada: "border-emerald-400 bg-emerald-400 text-ink",
  rechazada: "border-white/10 bg-white/[0.04] text-ink-mid",
  cancelada: "border-red-300/40 bg-red-300/10 text-red-200",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status], className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "confirmada" ? "bg-ink" : "bg-current")} />
      {STATUS_LABEL[status]}
    </motion.span>
  );
}

export function DemoNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-ink-mid", className)}>
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-volt" />
      <span>{children}</span>
    </p>
  );
}

/** Three-dot action menu. */
export function ActionMenu({ label, items }: { label: string; items: ({ label: string; icon?: React.ComponentType<{ className?: string }>; onSelect: () => void; danger?: boolean } | "separator")[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink/60 text-ink-light backdrop-blur transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={6}
          className="z-[95] min-w-[200px] rounded-2xl border border-white/10 bg-[#1c1c1c] p-1.5 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {items.map((item, i) =>
            item === "separator" ? (
              <Menu.Separator key={i} className="my-1 h-px bg-white/[0.08]" />
            ) : (
              <Menu.Item
                key={item.label}
                onSelect={item.onSelect}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/[0.06]",
                  item.danger ? "text-red-300" : "text-ink-light data-[highlighted]:text-white"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Menu.Item>
            )
          )}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Image from a URL or a local object URL; next/image can't optimise blob: URLs, so the panel uses a plain img. */
export function Thumb({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) return <div className={cn("bg-gradient-to-br from-ink-dark/60 to-ink", className)} aria-hidden={!alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" draggable={false} className={cn("object-cover", className)} />;
}
