"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, type PlanDetail } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { cn, humanize } from "@/lib/utils";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const MEAL_ORDER = ["BREAKFAST", "MID_MORNING", "LUNCH", "SNACK", "DINNER"];
const UNIT: Record<string, string> = { GRAM: "g", MILLILITER: "ml", UNIT: "u" };

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-xl font-semibold">
        {value}
        <span className="ml-1 text-sm font-normal text-muted">{unit}</span>
      </span>
    </div>
  );
}

export default function PlanPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [day, setDay] = useState("MONDAY");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activating, setActivating] = useState(false);

  const load = useCallback(() => {
    api
      .getPlan(id)
      .then(setPlan)
      .catch((e) => setError(describeError(e)));
  }, [id]);

  useEffect(load, [load]);

  async function handleActivate() {
    setActivating(true);
    setError("");
    try {
      await api.activatePlan(id);
      setNotice("Plan activated. If the patient had another active plan, it is now inactive.");
      load();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setActivating(false);
    }
  }

  const days = plan ? [...plan.week].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)) : [];
  const current = days.find((d) => d.dayOfWeek === day) ?? days[0];
  const meals = current
    ? [...current.meals].sort((a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type))
    : [];

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <button onClick={() => router.back()} className="w-fit text-sm text-primary hover:underline">
        ← Back
      </button>

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {!plan && !error && <p className="text-[15px] text-muted">Loading plan…</p>}

      {plan && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-semibold">{plan.name}</h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={plan.status} />
                <span className="text-sm text-muted">{humanize(plan.targetGoal)}</span>
              </div>
            </div>
            {plan.status === "DRAFT" && (
              <Button loading={activating} onClick={handleActivate}>
                Activate plan
              </Button>
            )}
          </div>

          <Card className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Macro label="Calories" value={plan.dailyCalories} unit="kcal" />
            <Macro label="Protein" value={plan.proteinGrams} unit="g" />
            <Macro label="Carbs" value={plan.carbGrams} unit="g" />
            <Macro label="Fat" value={plan.fatGrams} unit="g" />
          </Card>

          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Day of the week">
            {days.map((d) => {
              const active = d.dayOfWeek === (current?.dayOfWeek ?? day);
              return (
                <button
                  key={d.dayOfWeek}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDay(d.dayOfWeek)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-md px-3 text-sm",
                    active ? "bg-primary font-semibold text-white" : "border border-border bg-surface text-muted hover:bg-background",
                  )}
                >
                  {humanize(d.dayOfWeek).slice(0, 3)}
                </button>
              );
            })}
          </div>

          {current && (
            <p className="text-sm text-muted">
              Day total: <span className="font-semibold text-foreground">{current.totals.calories} kcal</span> of{" "}
              {plan.dailyCalories} target · P {current.totals.protein}/{plan.proteinGrams} g · C {current.totals.carbs}/{plan.carbGrams} g · F{" "}
              {current.totals.fat}/{plan.fatGrams} g
            </p>
          )}

          <div className="flex flex-col gap-4">
            {meals.map((m) => {
              const kcal = m.portions.reduce((sum, p) => sum + p.calories, 0);
              return (
                <Card key={m.id} className="flex flex-col gap-3 p-5 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{humanize(m.type)}</h3>
                    <span className="text-sm text-muted">{kcal} kcal</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {m.portions.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-[15px]">
                        <span>{p.foodName}</span>
                        <span className="shrink-0 text-muted">
                          {Math.round(p.quantity)} {UNIT[p.unit] ?? p.unit} · {p.calories} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
