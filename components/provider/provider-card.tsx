import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Provider tile used by the home carousel and the directory; `children` renders below the link (e.g. actions). */
export function ProviderCard({
  provider: p,
  badge,
  className,
  children,
}: {
  provider: Provider;
  badge?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass group flex h-full flex-col overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow",
        className
      )}
    >
      <Link href={`/proveedores/${p.slug}`} className="flex flex-1 flex-col">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={p.heroImage}
            alt=""
            fill
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <Image
            src={p.subject.src}
            alt={p.subject.alt}
            width={p.subject.width}
            height={p.subject.height}
            sizes="320px"
            className="absolute bottom-0 left-1/2 h-[88%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-ink-light backdrop-blur">
            {p.category}
          </span>
          {badge && <span className="absolute left-3 top-3">{badge}</span>}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="flex items-center justify-between gap-2 font-medium text-white">
            {p.fullName}
            <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-mid transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-volt" />
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-volt">
              <Star className="h-4 w-4 fill-volt" />
              {p.rating.toFixed(1)}
              <span className="text-xs text-ink-mid">({p.reviewsCount})</span>
            </span>
            <span className="text-ink-mid">
              Desde {formatBs(p.price.from)}
              {p.price.unit ? ` ${p.price.unit}` : ""}
            </span>
          </div>
        </div>
      </Link>
      {children}
    </div>
  );
}
