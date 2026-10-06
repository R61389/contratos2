"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Star } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function MobileBookBar({ provider }: { provider: Provider }) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 1100;
    setVisible(y > window.innerHeight * 0.85 && !nearBottom);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
        >
          <div className="glass-strong flex items-center justify-between gap-4 rounded-2xl px-4 py-3 shadow-card">
            <div className="min-w-0">
              <p className="truncate text-xs text-ink-mid">{provider.fullName}</p>
              <p className="flex items-baseline gap-2">
                <span className="font-general text-lg font-semibold text-white">{formatBs(provider.price.from)}</span>
                <span className="flex items-center gap-1 text-xs text-ink-light">
                  <Star className="h-3 w-3 fill-volt text-volt" />
                  {provider.rating.toFixed(1)}
                </span>
              </p>
            </div>
            <Button asChild size="sm">
              <a href="#disponibilidad">Reservar</a>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
