"use client";

import { useEffect, useRef, useState } from "react";
import { formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

// Colors for the two series that share a chart. Validated as a pair for color-blind readers
// (adjacent separation well above the floor); amber is light on white, so every value is also
// available in the tooltip and in the table view.
export const SERIES = { primary: "#2E7D32", accent: "#E9A23B" } as const;

export type Segment = { value: number; color: string };

export type DayColumn = {
  date: string;
  segments: Segment[]; // stacked from the baseline up
  empty: boolean; // no data that day: shown as a hairline, never as zero
  tip: { title: string; rows: { color?: string; label: string; value: string }[]; note?: string };
};

type Props = {
  columns: DayColumn[];
  max: number;
  yTicks: { value: number; label: string }[];
  ariaLabel: string;
  table: { headers: string[]; rows: string[][] };
  loading?: boolean;
};

const PLOT_HEIGHT = 168;

// A column chart built from plain HTML: one slot per day, a hover/focus tooltip on each,
// and a table view so no value depends on hovering or on telling colors apart.
export function DayChart({ columns, max, yTicks, ariaLabel, table, loading }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const n = columns.length;

  // Show only as many date labels as fit: about 64px each, so a phone gets fewer than a desktop.
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showTable]);
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(width / 64))));
  const active = hover != null ? columns[hover] : null;

  return (
    <div className={cn("flex flex-col gap-3 transition-opacity", loading && "opacity-60")}>
      {showTable ? (
        <div className="max-h-[320px] overflow-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {table.headers.map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 font-semibold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 text-muted tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex pt-3" role="group" aria-label={ariaLabel}>
          <div className="relative w-9 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
            {yTicks.map((t) => (
              <span
                key={t.value}
                className="absolute right-2 -translate-y-1/2 text-xs text-muted"
                style={{ bottom: `${(t.value / max) * 100}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1" ref={plotRef}>
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {yTicks.map((t) => (
                <div
                  key={t.value}
                  className="absolute inset-x-0 h-px bg-border"
                  style={{ bottom: `${(t.value / max) * 100}%` }}
                  aria-hidden="true"
                />
              ))}

              <div className="absolute inset-0 flex" onPointerLeave={() => setHover(null)}>
                {columns.map((c, i) => (
                  <button
                    key={c.date}
                    type="button"
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`${c.tip.title}: ${c.tip.rows.map((r) => `${r.label} ${r.value}`).join(", ")}`}
                    className={cn(
                      "group relative flex h-full min-w-0 flex-1 items-end justify-center px-px focus-visible:outline-none",
                      hover === i && "bg-primary/5",
                    )}
                  >
                    <span className="flex w-full max-w-[24px] flex-col-reverse gap-[2px]">
                      {c.empty ? (
                        <span className="h-[2px] w-full rounded-full bg-border" />
                      ) : (
                        c.segments
                          .filter((s) => s.value > 0)
                          .map((s, k, all) => (
                            <span
                              key={k}
                              className={cn("block w-full", k === all.length - 1 && "rounded-t-[4px]")}
                              style={{ height: (s.value / max) * PLOT_HEIGHT, background: s.color }}
                            />
                          ))
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {active && hover != null && (
                <div
                  role="status"
                  className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-3 py-2 shadow-sm"
                  style={{
                    top: -4,
                    left: `clamp(110px, ${((hover + 0.5) / n) * 100}%, calc(100% - 110px))`,
                  }}
                >
                  <p className="text-xs text-muted">{active.tip.title}</p>
                  {active.tip.rows.map((r) => (
                    <p key={r.label} className="flex items-center gap-2 text-sm">
                      {r.color && <span className="h-[3px] w-3 rounded-full" style={{ background: r.color }} />}
                      <span className="font-semibold text-foreground tabular-nums">{r.value}</span>
                      <span className="text-muted">{r.label}</span>
                    </p>
                  ))}
                  {active.tip.note && <p className="text-xs text-muted">{active.tip.note}</p>}
                </div>
              )}
            </div>

            <div className="relative mt-1 h-5" aria-hidden="true">
              {columns.map((c, i) =>
                (i % step === 0 && n - 1 - i >= step) || i === n - 1 ? (
                  <span
                    key={c.date}
                    className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-muted"
                    style={{ left: `${((i + 0.5) / n) * 100}%` }}
                  >
                    {formatShort(c.date)}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setShowTable((v) => !v)} className="w-fit text-sm text-primary hover:underline">
        {showTable ? "View as chart" : "View as table"}
      </button>
    </div>
  );
}

export function LegendItem({ color, label, dash }: { color: string; label: string; dash?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted">
      <span className={cn("shrink-0 rounded-[2px]", dash ? "h-[2px] w-3" : "h-3 w-3")} style={{ background: color }} />
      {label}
    </span>
  );
}
