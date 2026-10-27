"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";

export interface Point {
  label: string;
  value: number;
  detail?: string;
}

const W = 600;
const H = 200;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

function Gridlines({ max, format }: { max: number; format: (v: number) => string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      {[1, 0.5, 0].map((f) => (
        <div key={f} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-ink-mid">{format(max * f)}</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

/** Single-series area chart with a crosshair tooltip and an equivalent table for screen readers. */
export function AreaChart({ data, label, format = (v) => v.toLocaleString("es-BO") }: { data: Point[]; label: string; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId();
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const x = (i: number) => (data.length === 1 ? W / 2 : (i / (data.length - 1)) * W);
  const y = (v: number) => H - (v / max) * H;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const h = hover !== null ? data[hover] : null;

  return (
    <figure>
      <div className="relative h-52 pl-12">
        <Gridlines max={max} format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v)))} />
        <div
          className="absolute inset-y-0 left-12 right-0"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)));
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#E2E800" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#E2E800" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
            <motion.path
              d={line}
              fill="none"
              stroke="#E2E800"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="rgba(214,214,214,0.35)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
          </svg>
          {h && hover !== null && (
            <>
              <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-volt" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.value) / H) * 100}%` }} />
              <div
                className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-xl border border-white/10 bg-[#1c1c1c] px-3 py-2 text-xs shadow-xl"
                style={{ left: `${(x(hover) / W) * 100}%`, transform: `translate(${hover > data.length / 2 ? "-100%" : "0"}, -100%)` }}
              >
                <p className="text-ink-mid">{h.label}</p>
                <p className="font-semibold text-white">{format(h.value)}</p>
                {h.detail && <p className="text-ink-mid">{h.detail}</p>}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-12 text-[10px] text-ink-mid" aria-hidden>
        {data.map((d, i) => (
          <span key={d.label} className={i % 2 ? "hidden sm:inline" : ""}>
            {d.label.split(" ")[0]}
          </span>
        ))}
      </div>
      <DataTable data={data} label={label} format={format} />
    </figure>
  );
}

export function BarChart({ data, label, format = (v) => v.toLocaleString("es-BO") }: { data: Point[]; label: string; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  return (
    <figure>
      <div className="relative h-52 pl-12">
        <Gridlines max={max} format={(v) => String(Math.round(v))} />
        <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-[3px] sm:gap-1.5" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div key={d.label} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full rounded-t-[4px] ${hover === i ? "bg-volt" : "bg-volt/55"} transition-colors`}
              />
              {hover === i && (
                <div className={`pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl border border-white/10 bg-[#1c1c1c] px-3 py-2 text-xs shadow-xl ${i > data.length / 2 ? "right-0" : "left-0"}`}>
                  <p className="text-ink-mid">{d.label}</p>
                  <p className="font-semibold text-white">{format(d.value)}</p>
                  {d.detail && <p className="text-ink-mid">{d.detail}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-[3px] pl-12 text-[10px] text-ink-mid sm:gap-1.5" aria-hidden>
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center">
            <span className={i % 2 ? "hidden sm:inline" : ""}>{d.label.split(" ")[0]}</span>
          </span>
        ))}
      </div>
      <DataTable data={data} label={label} format={format} />
    </figure>
  );
}

export function HBarChart({ data, label, format = (v) => v.toLocaleString("es-BO") }: { data: Point[]; label: string; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <ul className="flex flex-col gap-3" aria-label={label}>
        {data.map((d, i) => (
          <li key={d.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-light">{d.label}</span>
              <span className="shrink-0 tabular-nums text-white">{format(d.value)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${i === 0 ? "bg-volt" : "bg-volt/50"}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function DataTable({ data, label, format }: { data: Point[]; label: string; format: (v: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">Mes</th>
          <th scope="col">Valor</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.label}>
            <th scope="row">{d.label}</th>
            <td>{format(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
