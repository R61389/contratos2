import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative inline-block h-[1em] w-[1em]" aria-hidden>
            <Star className="absolute inset-0 h-full w-full text-ink-light/20" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-[1em] w-[1em] fill-volt text-volt" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
