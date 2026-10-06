"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { validators } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const slow = useSlowHint(loading);

  const registered = params.get("registered") === "1";
  const oauthFailed = params.get("error") === "oauth";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = { email: validators.email(email), password: password ? "" : "Password is required" };
    setErrors(next);
    setFormError("");
    if (next.email || next.password) return;

    setLoading(true);
    try {
      const tokens = await api.login(email.trim(), password);
      auth.setTokens(tokens.token, tokens.refreshToken);
      router.push("/home");
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 401
          ? "Invalid email or password"
          : err instanceof Error
            ? err.message
            : "Something went wrong",
      );
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[400px]">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-muted">Welcome back to Lirium.</p>
        </div>

        {registered && <Alert tone="success">Account created. You can log in now.</Alert>}
        {oauthFailed && <Alert tone="error">Google sign-in failed. Please try again.</Alert>}
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />

        <Button type="submit" loading={loading}>
          Log in
        </Button>
        {slow && <p className="-mt-2 text-center text-[13px] text-muted">The server may be waking up. This can take up to a minute.</p>}

        <div className="flex items-center gap-3 text-[13px] text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <a href={api.googleLoginUrl} className={buttonVariants({ variant: "outline" })}>
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
