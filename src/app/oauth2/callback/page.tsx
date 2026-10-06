"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoIcon } from "@/components/layout/logo";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

// Google flow: backend redirects here with ?code=..., a short-lived one-time code.
// We exchange it for the JWT pair so tokens never travel in the URL.
function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false); // the code is single-use: avoid a double call in dev strict mode

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get("code");
    if (!code) {
      setError("Missing authorization code.");
      return;
    }
    api
      .exchangeOAuthCode(code)
      .then((t) => {
        auth.setTokens(t.token, t.refreshToken);
        router.replace("/home");
      })
      .catch((e: Error) => setError(e.message));
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="flex w-full max-w-[400px] flex-col items-center gap-5 text-center">
        <LogoIcon size={48} />
        {error ? (
          <>
            <Alert tone="error">{error}</Alert>
            <Link href="/login?error=oauth" className={buttonVariants({ variant: "outline" })}>
              Back to log in
            </Link>
          </>
        ) : (
          <p className="text-[15px] text-muted">Signing you in with Google…</p>
        )}
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
