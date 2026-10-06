import { useEffect, useState } from "react";

// Render's free tier sleeps after inactivity: the first request can take ~30-50s.
// Returns true when a request has been pending for a few seconds.
export function useSlowHint(pending: boolean, afterMs = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(t);
  }, [pending, afterMs]);
  return slow;
}
