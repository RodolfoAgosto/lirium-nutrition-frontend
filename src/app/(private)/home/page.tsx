"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth, isStaff } from "@/lib/auth";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    const session = auth.getSession();
    setEmail(session?.email ?? "");
    setStaff(isStaff(session));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">Welcome, {email}</h1>
        <p className="text-[15px] text-muted">You are signed in.</p>
      </div>
      {staff ? (
        <Card className="flex max-w-[560px] flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-semibold">Your patients</h2>
          <p className="text-[15px] leading-relaxed text-muted">
            Review a patient profile, generate a nutrition plan and activate it.
          </p>
          <Link href="/patients" className={buttonVariants({ variant: "primary" })}>
            Go to patients
          </Link>
        </Card>
      ) : (
        <Card className="flex max-w-[560px] flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">Your nutrition plan</h2>
          <p className="text-[15px] leading-relaxed text-muted">Your active plan and daily progress will appear here.</p>
        </Card>
      )}
    </div>
  );
}
