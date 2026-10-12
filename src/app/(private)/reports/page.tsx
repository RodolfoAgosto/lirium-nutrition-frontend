"use client";

import { useEffect, useState } from "react";
import { DayChart, LegendItem, SERIES, type DayColumn } from "@/components/reports/day-chart";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError, type AdherenceReport, type NutritionComparisonReport } from "@/lib/api";
import { formatShort, formatWithWeekday, shiftDay, todayIso } from "@/lib/dates";
import { describeError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="flex flex-col gap-1 p-5 sm:p-5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-[32px] font-semibold leading-tight">{value}</span>
      <span className="text-[13px] leading-snug text-muted">{hint}</span>
    </Card>
  );
}

const pct = (n: number | null | undefined) => (n == null ? "–" : `${Math.round(n)}%`);

export default function ReportsPage() {
  const { profile, error: profileError } = useMyProfile();
  const patientId = profile?.patientId;

  const [range, setRange] = useState<Range>(30);
  const [adherence, setAdherence] = useState<AdherenceReport | null>(null);
  const [comparison, setComparison] = useState<NutritionComparisonReport | null>(null);
  const [noPlan, setNoPlan] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId == null) return;
    let alive = true;
    const to = todayIso();
    const range_ = { from: shiftDay(to, -(range - 1)), to };
    setLoading(true);
    setError("");
    Promise.allSettled([api.getAdherence(patientId, range_), api.getNutritionComparison(patientId, range_)]).then(
      ([a, c]) => {
        if (!alive) return;
        if (a.status === "fulfilled") setAdherence(a.value);
        else setError(describeError(a.reason));
        // 404 here means there is no active plan to compare against, which is a state, not a failure.
        if (c.status === "fulfilled") {
          setComparison(c.value);
          setNoPlan(false);
        } else if (c.reason instanceof ApiError && c.reason.status === 404) {
          setComparison(null);
          setNoPlan(true);
        } else setError(describeError(c.reason));
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, [patientId, range]);

  const firstLoad = loading && !adherence && !comparison;
  const slow = useSlowHint(firstLoad);

  const adherenceColumns: DayColumn[] = (adherence?.days ?? []).map((d) => {
    const followed = d.followedMeals ?? 0;
    const modified = d.modifiedMeals ?? 0;
    return {
      date: d.date,
      empty: !d.hasRecord,
      segments: [
        { value: followed, color: SERIES.primary },
        { value: modified, color: SERIES.accent },
      ],
      tip: d.hasRecord
        ? {
            title: formatWithWeekday(d.date),
            rows: [
              { color: SERIES.primary, label: "followed as planned", value: String(followed) },
              { color: SERIES.accent, label: "modified", value: String(modified) },
            ],
            note: `${d.expectedMeals} meals expected`,
          }
        : { title: formatWithWeekday(d.date), rows: [{ label: "no record", value: "–" }], note: `${d.expectedMeals} meals expected` },
    };
  });
  const maxMeals = Math.max(1, ...(adherence?.days ?? []).map((d) => d.expectedMeals));

  const scoreColumns: DayColumn[] = (comparison?.days ?? []).map((d) => ({
    date: d.date,
    empty: !d.score,
    segments: [{ value: d.score?.overall ?? 0, color: SERIES.primary }],
    tip: d.score
      ? {
          title: formatWithWeekday(d.date),
          rows: [
            { color: SERIES.primary, label: "overall score", value: String(Math.round(d.score.overall)) },
            { label: "eaten vs plan", value: `${d.consumed?.calories ?? 0} / ${d.planned.calories} kcal` },
          ],
        }
      : {
          title: formatWithWeekday(d.date),
          rows: [{ label: d.hasRecord ? "nothing planned" : "no record", value: "–" }],
        },
  }));

  const s = adherence?.summary;
  const cs = comparison?.summary;
  const from = adherence?.from ?? comparison?.from;
  const to = adherence?.to ?? comparison?.to;

  const nutrients = comparison
    ? ([
        ["Calories", "kcal", "calories"],
        ["Protein", "g", "protein"],
        ["Carbs", "g", "carbs"],
        ["Fat", "g", "fat"],
      ] as const)
    : [];

  return (
    <div className="flex max-w-[860px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">Reports</h1>
        <p className="text-[15px] text-muted">
          {from && to ? `${formatShort(from)} – ${formatShort(to)}. ` : ""}How closely you followed your plan.
        </p>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label="Period">
        <span className="mr-2 text-sm text-muted">Last</span>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={cn(
              "min-h-10 rounded-md px-3 text-sm",
              range === r ? "bg-primary font-semibold text-white" : "border border-border bg-surface text-muted hover:bg-background",
            )}
          >
            {r} days
          </button>
        ))}
      </div>

      {(profileError || error) && <Alert tone="error">{profileError || error}</Alert>}
      {firstLoad && !profileError && !error && (
        <p className="text-[15px] text-muted">
          {slow ? "The server was asleep and is waking up. This can take up to a minute." : "Loading your reports…"}
        </p>
      )}

      {s && s.recordedDays > 0 && (
        <div className={cn("flex flex-col gap-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              label="Adherence"
              value={pct(s.adherence)}
              hint={`${s.followedMeals} of ${s.expectedMeals} expected meals followed as planned`}
            />
            <Tile label="When you log" value={pct(s.adherenceOnRecordedDays)} hint="Same measure, only on days with a record" />
            <Tile label="Days logged" value={`${s.recordedDays} of ${s.totalDays}`} hint="Days you opened your Daily log" />
            <Tile
              label="Average score"
              value={cs?.averageScore ? String(Math.round(cs.averageScore.overall)) : "–"}
              hint="0 to 100: how close your intake was to the plan"
            />
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Meals followed, day by day</h2>
              <p className="text-sm text-muted">Each column is a day. Its height is the meals the plan expected.</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <LegendItem color={SERIES.primary} label="Followed as planned" />
              <LegendItem color={SERIES.accent} label="Modified" />
              <LegendItem color="#E3E8E4" label="No record" dash />
            </div>
            <DayChart
              columns={adherenceColumns}
              max={maxMeals}
              yTicks={[
                { value: 0, label: "0" },
                { value: maxMeals, label: String(maxMeals) },
              ]}
              ariaLabel="Meals followed as planned and modified, by day"
              table={{
                headers: ["Day", "Expected", "Followed", "Modified"],
                rows: (adherence?.days ?? []).map((d) => [
                  formatWithWeekday(d.date),
                  String(d.expectedMeals),
                  d.hasRecord ? String(d.followedMeals ?? 0) : "no record",
                  d.hasRecord ? String(d.modifiedMeals ?? 0) : "–",
                ]),
              }}
              loading={loading}
            />
          </Card>
        </div>
      )}

      {s && s.recordedDays === 0 && (
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">Nothing logged in this period</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            Your reports are built from the days you record in your Daily log, so there is nothing to show yet.
          </p>
        </Card>
      )}

      {noPlan && s && s.recordedDays > 0 && (
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">No active plan to compare with</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            The nutrition score compares what you ate with your active plan. It will appear once a plan is active.
          </p>
        </Card>
      )}

      {comparison && comparison.summary.recordedDays > 0 && (
        <div className={cn("flex flex-col gap-6 transition-opacity", loading && "opacity-60")}>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Daily nutrition score</h2>
              <p className="text-sm text-muted">
                100 is exactly what the plan prescribed; it drops the same for eating less or more. Days with no record have no
                column.
              </p>
            </div>
            <DayChart
              columns={scoreColumns}
              max={100}
              yTicks={[
                { value: 0, label: "0" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              ariaLabel="Overall nutrition score, by day"
              table={{
                headers: ["Day", "Score", "Calories eaten", "Calories planned"],
                rows: comparison.days.map((d) => [
                  formatWithWeekday(d.date),
                  d.score ? String(Math.round(d.score.overall)) : d.hasRecord ? "–" : "no record",
                  d.consumed ? String(d.consumed.calories) : "–",
                  String(d.planned.calories),
                ]),
              }}
              loading={loading}
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Average day against your targets</h2>
              <p className="text-sm text-muted">
                Averages cover only the days you logged. The score weighs calories 40% and each macro 20%.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[15px]">
                <thead>
                  <tr className="text-sm text-muted">
                    <th className="pb-2 font-medium">Nutrient</th>
                    <th className="pb-2 font-medium">Average eaten</th>
                    <th className="pb-2 font-medium">Daily target</th>
                    <th className="pb-2 font-medium">Closeness</th>
                  </tr>
                </thead>
                <tbody>
                  {nutrients.map(([label, unit, key]) => {
                    const eaten = comparison.summary.averageConsumed?.[key];
                    const score = comparison.summary.averageScore?.[key];
                    return (
                      <tr key={key} className="border-t border-border">
                        <td className="py-2.5 font-medium">{label}</td>
                        <td className="py-2.5 tabular-nums">{eaten == null ? "–" : `${eaten} ${unit}`}</td>
                        <td className="py-2.5 tabular-nums text-muted">
                          {comparison.targets[key]} {unit}
                        </td>
                        <td className="py-2.5">
                          {score == null ? (
                            "–"
                          ) : (
                            <span className="flex items-center gap-3">
                              <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-border sm:block">
                                <span className="block h-full rounded-full" style={{ width: `${score}%`, background: SERIES.primary }} />
                              </span>
                              <span className="tabular-nums">{Math.round(score)}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
