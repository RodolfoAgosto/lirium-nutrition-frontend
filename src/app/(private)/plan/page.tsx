"use client";

import { useEffect, useState } from "react";
import { PlanWeek, todayDayOfWeek } from "@/components/plan/plan-week";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError, type PlanDetail } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { humanize } from "@/lib/utils";

export default function MyPlanPage() {
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

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      {(profileError || planError) && <Alert tone="error">{profileError || planError}</Alert>}
      {pending && (
        <p className="text-[15px] text-muted">
          {slow ? "The server was asleep and is waking up. This can take up to a minute." : "Loading your plan…"}
        </p>
      )}

      {noPlan && (
        <Card className="flex flex-col gap-2 p-6">
          <h1 className="text-lg font-semibold">No active plan yet</h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Your nutritionist has not activated a plan for you. It will appear here as soon as they do.
          </p>
        </Card>
      )}

      {plan && (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-semibold">{plan.name}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={plan.status} />
              <span className="text-sm text-muted">{humanize(plan.targetGoal)}</span>
            </div>
          </div>
          <PlanWeek plan={plan} initialDay={todayDayOfWeek()} />
        </>
      )}
    </div>
  );
}
