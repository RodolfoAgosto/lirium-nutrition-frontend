import { useEffect, useState } from "react";
import { api, type PatientDetail } from "@/lib/api";
import { describeError } from "@/lib/errors";

// The JWT carries no user id, so a patient asks the API who they are (GET /api/patients/me).
// The answer is kept for the whole browser tab: Home, My plan, Daily log and Reports share
// it instead of each screen repeating the call. A failed call is not cached, so it can be retried.
let cached: Promise<PatientDetail> | null = null;

function loadMyProfile(): Promise<PatientDetail> {
  if (!cached) {
    cached = api.getMyProfile().catch((e) => {
      cached = null;
      throw e;
    });
  }
  return cached;
}

// Call on logout so the next person who signs in on this tab does not see the previous profile.
export function clearMyProfile() {
  cached = null;
}

export function useMyProfile() {
  const [profile, setProfile] = useState<PatientDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadMyProfile()
      .then((p) => alive && setProfile(p))
      .catch((e) => alive && setError(describeError(e)));
    return () => {
      alive = false;
    };
  }, []);

  return { profile, error, loading: !profile && !error };
}
