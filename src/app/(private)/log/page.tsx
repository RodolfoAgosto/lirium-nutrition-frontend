"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MealCard } from "@/components/log/meal-card";
import { MEAL_ORDER } from "@/components/plan/plan-week";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError, type DailyRecord, type FoodSummary, type PlanDetail, type RecordMeal } from "@/lib/api";
import { formatDay, shiftDay, todayIso } from "@/lib/dates";
import { describeError } from "@/lib/errors";

function Stat({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-xl font-semibold">
        {value}
        <span className="ml-1 text-sm font-normal text-muted">
          / {target} {unit}
        </span>
      </span>
    </div>
  );
}

export default function DailyLogPage() {
  const { profile, error: profileError } = useMyProfile();
  const patientId = profile?.patientId;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [noPlan, setNoPlan] = useState(false);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState(todayIso);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  const [foods, setFoods] = useState<FoodSummary[] | null>(null);
  const [foodsError, setFoodsError] = useState("");

  const today = todayIso();

  useEffect(() => {
    if (patientId == null) return;
    let alive = true;
    (async () => {
      try {
        const [active, plans, list] = await Promise.all([
          api.getActivePlan(patientId),
          api.getPatientPlans(patientId),
          api.getDailyRecords(patientId),
        ]);
        const byDate: Record<string, DailyRecord> = Object.fromEntries(list.map((r) => [r.date, r]));
        // Opening today is what a patient expects to happen on their own. Past days are never created
        // on their own, only when the patient asks for it.
        if (!byDate[today]) {
          const ensured = await api.ensureDailyRecord(patientId, today);
          byDate[today] = ensured.record;
        }
        if (!alive) return;
        setPlan(active);
        setStartDate(plans.find((p) => p.status === "ACTIVE")?.startDate ?? null);
        setRecords(byDate);
        setReady(true);
      } catch (e) {
        if (!alive) return;
        // 404 is the normal "no active plan yet" state, not a failure.
        if (e instanceof ApiError && e.status === 404) setNoPlan(true);
        else setError(describeError(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [patientId, today]);

  const pending = !profileError && !error && !noPlan && !ready;
  const slow = useSlowHint(pending);

  const record = records[date];

  const openDay = useCallback(
    async (day: string) => {
      if (patientId == null) return;
      const { record: r } = await api.ensureDailyRecord(patientId, day);
      setRecords((prev) => ({ ...prev, [day]: r }));
    },
    [patientId],
  );

  async function handleOpenDay() {
    setOpening(true);
    setError("");
    try {
      await openDay(date);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setOpening(false);
    }
  }

  function handleMealChange(updated: RecordMeal) {
    setRecords((prev) => {
      const current = prev[date];
      if (!current) return prev;
      return { ...prev, [date]: { ...current, meals: current.meals.map((m) => (m.id === updated.id ? updated : m)) } };
    });
  }

  const refreshDay = useCallback(() => openDay(date), [openDay, date]);

  const needFoods = useCallback(() => {
    if (foods) return;
    api
      .getFoods()
      .then((list) => setFoods([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => setFoodsError(describeError(e)));
  }, [foods]);

  const meals = useMemo(
    () => (record ? [...record.meals].sort((a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type)) : []),
    [record],
  );

  const totals = useMemo(() => {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const m of meals)
      for (const p of m.portions) {
        t.calories += p.calories;
        t.protein += p.protein;
        t.carbs += p.carbs;
        t.fat += p.fat;
      }
    return t;
  }, [meals]);

  const canGoBack = !startDate || date > startDate;
  const canGoForward = date < today;
  const calorieShare = plan && plan.dailyCalories > 0 ? Math.min(100, Math.round((totals.calories / plan.dailyCalories) * 100)) : 0;

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <h1 className="text-[28px] font-semibold">Daily log</h1>

      {(profileError || error) && <Alert tone="error">{profileError || error}</Alert>}
      {pending && (
        <p className="text-[15px] text-muted">
          {slow ? "The server was asleep and is waking up. This can take up to a minute." : "Loading your day…"}
        </p>
      )}

      {noPlan && (
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">No active plan yet</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            You can log your meals once your nutritionist activates a plan for you.
          </p>
        </Card>
      )}

      {ready && plan && (
        <>
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setDate(shiftDay(date, -1))} disabled={!canGoBack} aria-label="Previous day">
              ←
            </Button>
            <div className="flex flex-col items-center text-center">
              <span className="text-base font-semibold">{formatDay(date)}</span>
              {date === today ? (
                <span className="text-sm text-primary">Today</span>
              ) : (
                <button onClick={() => setDate(today)} className="text-sm text-primary hover:underline">
                  Back to today
                </button>
              )}
            </div>
            <Button variant="outline" onClick={() => setDate(shiftDay(date, 1))} disabled={!canGoForward} aria-label="Next day">
              →
            </Button>
          </div>

          {!record ? (
            <Card className="flex flex-col items-start gap-3 p-6">
              <h2 className="text-lg font-semibold">Nothing was logged this day</h2>
              <p className="text-[15px] leading-relaxed text-muted">
                Opening it records the day as eaten as planned. After that you can change what was different.
              </p>
              <Button loading={opening} onClick={handleOpenDay}>
                Open this day
              </Button>
            </Card>
          ) : (
            <>
              <Card className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <Stat label="Calories" value={totals.calories} target={plan.dailyCalories} unit="kcal" />
                  <Stat label="Protein" value={totals.protein} target={plan.proteinGrams} unit="g" />
                  <Stat label="Carbs" value={totals.carbs} target={plan.carbGrams} unit="g" />
                  <Stat label="Fat" value={totals.fat} target={plan.fatGrams} unit="g" />
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-label="Calories eaten against the daily target"
                  aria-valuenow={calorieShare}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${calorieShare}%` }} />
                </div>
              </Card>

              <div className="flex flex-col gap-4">
                {meals.map((m) => (
                  <MealCard
                    key={m.id}
                    meal={m}
                    dailyRecordId={record.id}
                    foods={foods}
                    foodsError={foodsError}
                    onNeedFoods={needFoods}
                    onMealChange={handleMealChange}
                    onRefreshDay={refreshDay}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
