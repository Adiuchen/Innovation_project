import { AdminHeading } from "@/app/admin/AdminHeading";
import { requireUser } from "@/lib/auth";
import { formatParkTimeDate } from "@/lib/format";
import { getCopy } from "@/lib/i18n";

export default async function LoginHistoryPage() {
  const { supabase } = await requireUser(["administrator"]);
  const { locale, t } = await getCopy();
  const { data: logs, error } = await supabase
    .from("login_logs")
    .select("id, created_at, success, profiles(name, id)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <AdminHeading title={t.loginHistory} backHref="/admin" backLabel={t.back} />
      <p className="mb-4 text-sm text-[#525252]">{t.loginHistoryText}</p>
      {error && <p className="mb-4 text-sm text-red-700">{error.message}</p>}
      <section className="overflow-hidden rounded-xl border border-[#171717]/8 bg-white">
        {(logs ?? []).length === 0 ? (
          <p className="px-4 py-4 text-sm text-[#737373]">{t.noLogins}</p>
        ) : (
          <div className="scroll-box max-h-[32rem] overflow-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="sticky top-0 z-10 bg-[#fafafa] text-left text-[#525252]">
                <tr>
                  <th className="p-3 font-medium">{t.staffId}</th>
                  <th className="p-3 font-medium">{t.fullName}</th>
                  <th className="p-3 font-medium">{t.eventWhen}</th>
                  <th className="p-3 font-medium">{t.result}</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => {
                  const person = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                  return (
                    <tr key={log.id} className="border-b border-[#171717]/8 last:border-0">
                      <td className="p-3 font-mono tabular-nums text-[#171717]">{person?.id || "—"}</td>
                      <td className="p-3 text-[#171717]">{person?.name || t.unknown}</td>
                      <td className="p-3 tabular-nums text-[#525252]">{formatParkTimeDate(log.created_at, locale)}</td>
                      <td className={`p-3 ${log.success ? "text-[#525252]" : "text-[#dc2626]"}`}>{log.success ? t.success : t.failed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
