"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Chip, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, type PatientDetail, type PlanSummary } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { heightCm, humanize, weightKg } from "@/lib/utils";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-[15px] font-medium">{value}</span>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([api.getPatient(id), api.getPatientPlans(id)])
      .then(([p, pl]) => {
        setPatient(p);
        setPlans(pl);
      })
      .catch((e) => setError(describeError(e)));
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const plan = await api.generatePlan(id);
      router.push(`/plans/${plan.id}`);
    } catch (e) {
      setError(describeError(e));
      setGenerating(false);
    }
  }

  const h = heightCm(patient?.height);
  const w = weightKg(patient?.weight);

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <Link href="/patients" className="text-sm text-primary hover:underline">
        ← Patients
      </Link>

      {error && <Alert tone="error">{error}</Alert>}
      {!patient && !error && <p className="text-[15px] text-muted">Loading patient…</p>}

      {patient && (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-semibold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-[15px] text-muted">{patient.email}</p>
          </div>

          <Card className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Fact label="Goal" value={humanize(patient.goal)} />
              <Fact label="Activity" value={humanize(patient.activityLevel)} />
              <Fact label="Sex" value={humanize(patient.sex)} />
              <Fact label="Height" value={h ? `${h} cm` : "-"} />
              <Fact label="Weight" value={w ? `${w.toFixed(1)} kg` : "-"} />
              <Fact label="Birth date" value={patient.birthDate ?? "-"} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">Dietary restrictions</span>
              <div className="flex flex-wrap gap-2">
                {patient.restrictions.length === 0 && <span className="text-[15px]">None</span>}
                {patient.restrictions.map((r) => (
                  <Chip key={r.id}>{r.name}</Chip>
                ))}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Nutrition plans</h2>
              <Button loading={generating} onClick={handleGenerate}>
                Generate plan
              </Button>
            </div>
            {plans && plans.length === 0 && <p className="text-[15px] text-muted">No plans yet.</p>}
            {plans && plans.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-border">
                {plans.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/plans/${pl.id}`}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-background"
                  >
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold">{pl.name}</span>
                      <span className="text-sm text-muted">{pl.dailyCalories} kcal per day</span>
                    </div>
                    <StatusBadge status={pl.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
