"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useSlowHint } from "@/hooks/use-slow-hint";
import { api, ApiError } from "@/lib/api";
import { validators } from "@/lib/validation";

type Values = { firstName: string; lastName: string; email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const slow = useSlowHint(loading);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {
      firstName: validators.required("First name")(values.firstName),
      lastName: validators.required("Last name")(values.lastName),
      email: validators.email(values.email),
      password: validators.password(values.password),
    };
    setErrors(next);
    setFormError("");
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    try {
      await api.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.push("/login?registered=1");
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? "This email is already registered"
          : err instanceof Error
            ? err.message
            : "Something went wrong",
      );
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[440px]">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted">It only takes a minute.</p>
        </div>

        {formError && <Alert tone="error">{formError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" name="firstName" autoComplete="given-name" placeholder="Ana" value={values.firstName} onChange={set("firstName")} error={errors.firstName} />
          <Field label="Last name" name="lastName" autoComplete="family-name" placeholder="Lopez" value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={set("email")} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" hint="Minimum 8 characters." value={values.password} onChange={set("password")} error={errors.password} />

        <Button type="submit" loading={loading}>
          Create account
        </Button>
        {slow && <p className="-mt-2 text-center text-[13px] text-muted">The server may be waking up. This can take up to a minute.</p>}

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </Card>
  );
}
