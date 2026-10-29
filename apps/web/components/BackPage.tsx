import Link from "next/link";

export function BackPage({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={className ?? "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-forest bg-white text-sm font-semibold leading-none text-forest hover:bg-emerald-50"}
    >
      &lt;
    </Link>
  );
}
