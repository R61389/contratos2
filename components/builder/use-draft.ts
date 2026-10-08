"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventTypeId, ServiceId } from "@/lib/event-builder";

const KEY = "vibra:event-draft";

export interface Draft {
  step: number;
  type: EventTypeId | null;
  /** Local calendar date as yyyy-m-d, so it survives JSON without time-zone shifts. */
  date: string | null;
  guests: number;
  budget: number;
  budgetTouched: boolean;
  services: ServiceId[];
  picks: Partial<Record<ServiceId, string>>;
}

export const EMPTY_DRAFT: Draft = {
  step: 0,
  type: null,
  date: null,
  guests: 100,
  budget: 26000,
  budgetTouched: false,
  services: [],
  picks: {},
};

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function fromDateKey(key: string | null) {
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The visitor's event in progress, kept in this browser so a reload doesn't lose it. */
export function useDraft() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(saved) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
    } catch {}
  }, [draft, ready]);

  const update = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
  }, []);

  const reset = useCallback(() => setDraft(EMPTY_DRAFT), []);

  return { draft, update, reset, ready };
}
