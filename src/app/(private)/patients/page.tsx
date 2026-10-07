"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { api, type PatientSummary } from "@/lib/api";
import { describeError } from "@/lib/errors";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .searchPatients()
      .then(setPatients)
      .catch((e) => setError(describeError(e)));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">Patients</h1>
        <p className="text-[15px] text-muted">Choose a patient to see their profile and nutrition plans.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {!patients && !error && <p className="text-[15px] text-muted">Loading patients…</p>}

      {patients && (
        <Card className="max-w-[760px] divide-y divide-border p-0 sm:p-0">
          {patients.length === 0 && <p className="p-6 text-[15px] text-muted">No patients yet.</p>}
          {patients.map((p) => (
            <Link
              key={p.patientId}
              href={`/patients/${p.patientId}`}
              className="flex min-h-16 items-center justify-between gap-4 px-6 py-4 hover:bg-background"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-base font-semibold">
                  {p.firstName} {p.lastName}
                </span>
                <span className="truncate text-sm text-muted">{p.email}</span>
              </div>
              <span className="text-primary" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
