import Link from "next/link";

export function LogoIcon({ size = 30 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/lirium-icon.svg" alt="" width={size} height={size} />;
}

// Icon + wordmark used in every header / sidebar.
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-xl font-semibold text-foreground">
      <LogoIcon size={30} />
      Lirium
    </Link>
  );
}
