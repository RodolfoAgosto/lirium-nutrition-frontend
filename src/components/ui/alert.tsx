import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2.5 text-sm",
        tone === "error"
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-primary/30 bg-primary/5 text-primary-hover",
      )}
    >
      {children}
    </div>
  );
}
