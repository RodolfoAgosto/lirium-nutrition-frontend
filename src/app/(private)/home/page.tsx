"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { todayDayOfWeek } from "@/components/plan/plan-week";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError, type PlanDetail } from "@/lib/api";
import { auth, isStaff } from "@/lib/auth";
import { describeError } from "@/lib/errors";
import { humanize } from "@/lib/utils";

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

// Patient view: who they are and what their active plan asks of them today.
function PatientHome() {
  const { profile, error: profileError } = useMyProfile();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [noPlan, setNoPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  const patientId = profile?.patientId;
  useEffect(() => {
    if (patientId == null) return;
    api
      .getActivePlan(patientId)
      .then(setPlan)
      .catch((e) => {
        // 404 is the normal "no active plan yet" state, not a failure.
        if (e instanceof ApiError && e.status === 404) setNoPlan(true);
        else setPlanError(describeError(e));
      });
  }, [patientId]);

  const pending = !profileError && !planError && !plan && !noPlan;
  const slow = useSlowHint(pending);

  const today = plan?.week.find((d) => d.dayOfWeek === todayDayOfWeek());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">{profile ? `Welcome, ${profile.firstName}` : "Welcome"}</h1>
        <p className="text-[15px] text-muted">Your nutrition plan and daily progress.</p>
      </div>

      {(profileError || planError) && <Alert tone="error">{profileError || planError}</Alert>}
      {pending && (
        <p className="text-[15px] text-muted">
          {slow ? "The server was asleep and is waking up. This can take up to a minute." : "Loading your plan…"}
        </p>
      )}

      {noPlan && (
        <Card className="flex max-w-[560px] flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">No active plan yet</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            Your nutritionist has not activated a plan for you. It will appear here as soon as they do.
          </p>
        </Card>
      )}

      {plan && (
        <Card className="flex max-w-[560px] flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <StatusBadge status={plan.status} />
            </div>
            <span className="text-sm text-muted">{humanize(plan.targetGoal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Macro label="Calories" value={plan.dailyCalories} unit="kcal" />
            <Macro label="Protein" value={plan.proteinGrams} unit="g" />
            <Macro label="Carbs" value={plan.carbGrams} unit="g" />
            <Macro label="Fat" value={plan.fatGrams} unit="g" />
          </div>
          {today && (
            <p className="text-sm text-muted">
              Planned for {humanize(today.dayOfWeek)}:{" "}
              <span className="font-semibold text-foreground">{today.totals.calories} kcal</span> in{" "}
              {today.meals.length} meals.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function StaffHome({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">Welcome, {email}</h1>
        <p className="text-[15px] text-muted">You are signed in.</p>
      </div>
      <Card className="flex max-w-[560px] flex-col items-start gap-3 p-6">
        <h2 className="text-lg font-semibold">Your patients</h2>
        <p className="text-[15px] leading-relaxed text-muted">
          Review a patient profile, generate a nutrition plan and activate it.
        </p>
        <Link href="/patients" className={buttonVariants({ variant: "primary" })}>
          Go to patients
        </Link>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<ReturnType<typeof auth.getSession>>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSession(auth.getSession());
    setReady(true);
  }, []);

  if (!ready) return null;
  return isStaff(session) ? <StaffHome email={session?.email ?? ""} /> : <PatientHome />;
}
