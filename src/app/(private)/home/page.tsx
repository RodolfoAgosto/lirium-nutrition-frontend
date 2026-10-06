"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default function HomePage() {
  const [email, setEmail] = useState("");
  useEffect(() => setEmail(auth.getSession()?.email ?? ""), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold">Welcome, {email}</h1>
        <p className="text-[15px] text-muted">You are signed in.</p>
      </div>
      <Card className="flex max-w-[560px] flex-col gap-2 p-6">
        <h2 className="text-lg font-semibold">Your nutrition plan</h2>
        <p className="text-[15px] leading-relaxed text-muted">Your active plan and daily progress will appear here.</p>
      </Card>
    </div>
  );
}
