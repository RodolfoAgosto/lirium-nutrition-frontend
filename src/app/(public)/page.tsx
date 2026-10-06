import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoIcon } from "@/components/layout/logo";

export default function LandingPage() {
  return (
    <div className="flex max-w-xl flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <LogoIcon size={72} />
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Lirium <span className="text-primary">Nutrition</span>
        </h1>
        <span className="text-[13px] font-medium tracking-[0.3em] text-[#607D8B]">PRECISION · HEALTH · TECH</span>
      </div>
      <p className="text-xl leading-relaxed text-muted">Personalized nutrition plans, built around each patient.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Log in
        </Link>
        <Link href="/register" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Create account
        </Link>
      </div>
    </div>
  );
}
