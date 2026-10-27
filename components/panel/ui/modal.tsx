"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Accessible dialog (focus trap, Esc, labelled) that animates in as a centred card or a side sheet. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "center",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "center" | "sheet";
}) {
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            {/* Positioning lives on a wrapper: motion owns the dialog's transform for the animation. */}
            <div
              className={cn(
                "pointer-events-none fixed inset-0 z-[91] flex",
                variant === "sheet" ? "justify-end" : "items-end justify-center p-3 sm:items-center sm:p-6"
              )}
            >
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={variant === "sheet" ? { x: "100%" } : { opacity: 0, y: 16, scale: 0.97 }}
                animate={variant === "sheet" ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={variant === "sheet" ? { x: "100%" } : { opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.28, ease: EASE }}
                className={cn(
                  "pointer-events-auto flex flex-col border border-white/10 bg-[#181818] text-ink-light shadow-2xl focus:outline-none",
                  variant === "sheet" ? "h-full w-full max-w-xl sm:rounded-l-3xl" : cn("max-h-[92svh] w-full rounded-3xl", width)
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <Dialog.Title className="font-general text-lg font-semibold text-white">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-ink-mid">{description}</Dialog.Description>
                    ) : (
                      <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Diálogo"}</Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    aria-label="Cerrar"
                    className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-mid transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
                {footer && (
                  <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>
                )}
              </motion.div>
            </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Eliminar",
  tone = "danger",
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <PanelButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </PanelButton>
          <PanelButton
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </PanelButton>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function PanelButton({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-sm",
        variant === "primary" && "bg-volt text-ink hover:brightness-110 active:brightness-95",
        variant === "secondary" && "border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.07]",
        variant === "outline" && "border border-volt/40 text-volt hover:bg-volt/10",
        variant === "ghost" && "text-ink-light hover:bg-white/5 hover:text-white",
        variant === "danger" && "bg-red-500/90 text-white hover:bg-red-500",
        className
      )}
    />
  );
}
