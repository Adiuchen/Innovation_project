export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl bg-forest text-white ${className}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M12 21c0-7 4-11 9-13-1 8-5 13-9 13Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 21C12 14 8 9 3 7c1 8 5 13 9 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 21V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}
