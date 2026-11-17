import { BackPage } from "@/components/BackPage";
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
    <StickyBar>
      <div className="flex items-center gap-3">
        <BackPage href={backHref} label={backLabel} />
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </StickyBar>
  );
}
