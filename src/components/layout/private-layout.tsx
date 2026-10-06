"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { auth, type Session } from "@/lib/auth";
import { cn } from "@/lib/utils";

// The menu is defined once here. Future screens only need a new entry.
const NAV = [
  { label: "Home", href: "/home", icon: "home", enabled: true },
  { label: "My plan", href: "/plan", icon: "plan", enabled: false },
  { label: "Daily log", href: "/log", icon: "log", enabled: false },
  { label: "Reports", href: "/reports", icon: "reports", enabled: false },
] as const;

const ICONS: Record<string, React.ReactNode> = {
  home: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),
  plan: (<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9z" /></>),
  log: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  reports: <path d="M5 20V10M12 20V4M19 20v-7" />,
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const s = auth.getSession();
    if (!s) {
      auth.clear();
      router.replace("/login");
      return;
    }
    setSession(s);
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.logout(); // server blacklists the token's jti
    } catch {
      /* even if the call fails, drop the local session */
    }
    auth.clear();
    router.replace("/login");
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border bg-surface p-4 md:w-60 md:shrink-0 md:gap-6 md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="flex items-center justify-between px-2">
          <Logo href="/home" />
          <Button variant="outline" loading={loggingOut} onClick={handleLogout} className="md:hidden">
            Log out
          </Button>
        </div>

        <nav className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const classes = cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-[15px]",
              active ? "bg-primary/10 font-semibold text-primary" : "text-muted",
              item.enabled && !active && "hover:bg-background",
            );
            return item.enabled ? (
              <Link key={item.href} href={item.href} className={classes} aria-current={active ? "page" : undefined}>
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ) : (
              <div key={item.href} className={classes} aria-disabled="true">
                <NavIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-foreground">Soon</span>
              </div>
            );
          })}
        </nav>

        <div className="hidden flex-col gap-3 border-t border-border px-2 pt-4 md:flex">
          <span className="truncate text-sm text-muted" title={session.email}>
            {session.email}
          </span>
          <Button variant="outline" loading={loggingOut} onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12">{children}</main>
    </div>
  );
}
