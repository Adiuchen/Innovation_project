import Link from "next/link";
import { StickyBar } from "@/components/StickyBar";

export function AdminHeading({
  title,
  backHref = "/dashboard",
  backLabel,
}: {
  title: string;
  backHref?: string;
  backLabel: string;
}) {
  return (
    <StickyBar className="sticky top-14 z-30 -mx-4 mb-6 bg-paper px-4 pb-2 pt-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-[#525252] transition-colors duration-150 hover:text-[#171717]"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {backLabel}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#171717]">{title}</h1>
    </StickyBar>
  );
}
