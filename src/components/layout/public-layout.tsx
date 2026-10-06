import Link from "next/link";
import { LeafBackdrop } from "./leaf-backdrop";
import { Logo } from "./logo";
import { buttonVariants } from "@/components/ui/button";

// Shared by landing, login and register. No menu: just logo and auth links.
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4 md:px-12">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Sign up
          </Link>
        </nav>
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
        <LeafBackdrop />
        <div className="relative z-10 flex w-full flex-col items-center">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface px-6 py-4 text-center text-sm text-muted">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
