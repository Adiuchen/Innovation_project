"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { assignIotKit } from "@/lib/iot-kit-actions";

export type IotKitPlant = {
  id: string;
  name: string;
  detail: string;
  search: string;
};

export function IotKitBoard({
  plants,
  assignedId,
  basePath,
  searchLabel,
  assignSetupLabel,
  cancelLabel,
  assignLabel,
  noSetupLabel,
  noResultLabel,
}: {
  plants: IotKitPlant[];
  assignedId: string | null;
  basePath: string;
  searchLabel: string;
  assignSetupLabel: string;
  cancelLabel: string;
  assignLabel: string;
  noSetupLabel: string;
  noResultLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const term = query.trim().toLowerCase();
  const visible = plants.filter((plant) => !term || plant.search.includes(term));

  async function assign(id: string) {
    setPendingId(id);
    setError(null);
    const result = await assignIotKit(id);
    setPendingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAssigning(false);
    router.refresh();
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="min-h-11 w-full rounded-lg border px-3 text-base sm:min-h-0 sm:w-auto sm:min-w-0 sm:flex-1 sm:py-2 sm:text-sm"
          value={query}
          placeholder={searchLabel}
          aria-label={searchLabel}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="btn min-h-11 w-full sm:min-h-0 sm:w-auto sm:shrink-0"
          type="button"
          onClick={() => setAssigning((current) => !current)}
        >
          {assigning ? cancelLabel : assignSetupLabel}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <ul className="mt-4 space-y-3 pb-8">
        {visible.map((plant) => {
          const hasKit = plant.id === assignedId;
          const showAssign = assigning && !hasKit;
          const body = (
            <>
              <span className="min-w-0 sm:flex-1">
                <span className="block break-words font-medium">{plant.id} · {plant.name}</span>
                {plant.detail ? <span className="mt-1 block break-words text-sm text-neutral-600">{plant.detail}</span> : null}
              </span>
              {hasKit ? null : showAssign ? null : (
                <span className="self-end text-sm text-neutral-500 sm:shrink-0 sm:self-auto">{noSetupLabel}</span>
              )}
            </>
          );
          return (
            <li key={plant.id} className="surface flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              {showAssign ? (
                <>
                  <Link href={`${basePath}/${encodeURIComponent(plant.id)}`} className="min-w-0 sm:flex-1">
                    {body}
                  </Link>
                  <button
                    className="btn min-h-11 w-full sm:min-h-0 sm:w-auto sm:shrink-0"
                    type="button"
                    disabled={pendingId !== null}
                    onClick={() => void assign(plant.id)}
                  >
                    {assignLabel}
                  </button>
                </>
              ) : (
                <Link href={`${basePath}/${encodeURIComponent(plant.id)}`} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
        {term && visible.length === 0 && (
          <li className="surface px-5 py-10 text-center text-base text-neutral-500 sm:py-8 sm:text-sm">{noResultLabel}</li>
        )}
      </ul>
    </>
  );
}
