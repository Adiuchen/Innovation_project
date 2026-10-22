import { getCopy, statusText } from "@/lib/i18n";
import { statusTone } from "@/lib/status-tone";

export async function StatusBadge({ status }: { status: string }) {
  const { t } = await getCopy();
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(status)}`}>
      {statusText(status, t)}
    </span>
  );
}
