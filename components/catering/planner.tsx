"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CateringDetails, CateringMenu } from "@/lib/providers";

interface Planner {
  menu: CateringMenu;
  setMenuId: (id: string) => void;
  guests: number;
  setGuests: (n: number) => void;
  corporate: boolean;
  setCorporate: (on: boolean) => void;
}

const PlannerContext = createContext<Planner | null>(null);

/** Menu, guest count and event type are shared by the menu cards, showcase, calculator and calendar. */
export function PlannerProvider({ details, children }: { details: CateringDetails; children: React.ReactNode }) {
  const [menuId, setMenuId] = useState(details.menus.find((m) => m.badge)?.id ?? details.menus[0].id);
  const [guests, setGuests] = useState(150);
  const [corporate, setCorporate] = useState(false);
  const menu = details.menus.find((m) => m.id === menuId) ?? details.menus[0];

  const value = useMemo(
    () => ({ menu, setMenuId, guests, setGuests, corporate, setCorporate }),
    [menu, guests, corporate]
  );
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
}
