"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanWeek } from "@/components/plan/plan-week";
import { api, type PlanDetail } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { humanize } from "@/lib/utils";

export default function PlanPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
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

          <PlanWeek plan={plan} />
        </>
      )}
    </div>
  );
}
