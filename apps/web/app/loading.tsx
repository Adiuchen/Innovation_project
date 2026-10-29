import { BrandMark } from "@/components/BrandMark";

export default function Loading() {
  return (
    <div className="grid min-h-[calc(100dvh-4.5rem)] place-items-center px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid h-16 w-16 place-items-center">
          <span className="loading-ring absolute inset-0 rounded-full border-2 border-emerald-100 border-t-forest" />
          <BrandMark className="h-10 w-10" />
        </span>
        <span className="text-sm text-neutral-500">Loading</span>
      </div>
    </div>
  );
}
