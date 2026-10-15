"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-ink-mid/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-volt/70 disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-light">
        {label}
      </label>
      {children}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p key="e" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-300">
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-ink-mid">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function TextInput({ invalid, className, ...props }: InputProps) {
  return <input {...props} aria-invalid={invalid || undefined} className={cn(control, "h-11", invalid ? "border-red-400/70" : "border-white/10", className)} />;
}

export function TextArea({ invalid, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...props} aria-invalid={invalid || undefined} className={cn(control, "min-h-[96px] resize-y py-3 leading-relaxed", invalid ? "border-red-400/70" : "border-white/10", className)} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(control, "h-11 border-white/10 [color-scheme:dark]", className)}>
      {children}
    </select>
  );
}

/** Amount in bolivianos; keeps the raw text so validation can explain what is wrong. */
export function MoneyInput({ invalid, className, suffix, ...props }: InputProps & { suffix?: string }) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <span className="pointer-events-none absolute left-3.5 text-sm font-medium text-ink-mid">Bs</span>
      <input
        inputMode="decimal"
        autoComplete="off"
        {...props}
        aria-invalid={invalid || undefined}
        className={cn(control, "h-11 pl-10 tabular-nums", suffix && "pr-24", invalid ? "border-red-400/70" : "border-white/10")}
      />
      {suffix && <span className="pointer-events-none absolute right-3.5 text-xs text-ink-mid">{suffix}</span>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={id} className="text-sm font-medium text-white">
          {label}
        </p>
        {description && <p className="mt-0.5 text-xs text-ink-mid">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-40",
          checked ? "border-volt bg-volt" : "border-white/15 bg-white/10"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full", checked ? "right-0.5 bg-ink" : "left-0.5 bg-ink-light")}
        />
      </button>
    </div>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
              on ? "border-volt bg-volt/15 text-white" : "border-white/10 text-ink-light hover:border-white/25"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Editable list of short lines ("Qué incluye", beneficios…). */
export function ListEditor({ items, onChange, placeholder, label }: { items: string[]; onChange: (items: string[]) => void; placeholder: string; label: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const text = draft.trim();
    if (!text || items.includes(text)) return;
    onChange([...items, text]);
    setDraft("");
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1 text-xs text-ink-light"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={`Quitar ${item}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink-mid hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="flex gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={`Agregar a ${label}`}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Agregar a ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-ink-light hover:border-volt hover:text-volt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
