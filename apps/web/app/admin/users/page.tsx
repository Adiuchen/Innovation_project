import { AdminHeading } from "@/app/admin/AdminHeading";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";
import { updateAccount } from "../actions";

const tableField = "h-9 rounded-lg border px-2 text-sm text-[#171717]";

export default async function ManageUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser(["administrator"]);
  const { t } = await getCopy();
  const roles = [
    { value: "botanist", label: t.botanist },
    { value: "conservation_officer", label: t.officer },
    { value: "guide", label: t.guide },
  ];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("uuid, id, name, email, role, status")
    .order("name");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <AdminHeading title={t.manageAccess} backHref="/admin" backLabel={t.back} />
      <p className="mb-4 text-sm text-[#525252]">{t.manageAccessText}</p>
      {(error || profileError) && (
        <p className="mb-4 text-sm text-red-700">{error || profileError?.message}</p>
      )}
      <section className="overflow-hidden rounded-xl border border-[#171717]/8 bg-white">
        <div className="scroll-box h-96 overflow-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="sticky top-0 z-10 bg-[#fafafa] text-left text-[#525252]">
              <tr>
                <th className="p-3 font-medium">{t.staffId}</th>
                <th className="p-3 font-medium">{t.fullName}</th>
                <th className="p-3 font-medium">{t.email}</th>
                <th className="p-3 font-medium">{t.role}</th>
                <th className="p-3 font-medium">{t.status}</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((profile) => {
                const formId = `account-${profile.uuid}`;
                const staff = roles.some((role) => role.value === profile.role);
                const suspended = profile.status === "suspended";
                return (
                  <tr key={profile.uuid} className="border-b border-[#171717]/8 last:border-0">
                    <td className="p-3 font-mono tabular-nums text-[#171717]">{profile.id}</td>
                    <td className="p-3 text-[#171717]">{profile.name}</td>
                    <td className="p-3 text-[#525252]">{profile.email || "—"}</td>
                    <td className="p-3">
                      {staff ? (
                        <select className={tableField} name="role" form={formId} defaultValue={profile.role}>
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[#171717]">{statusText(profile.role, t)}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        className={`${tableField} ${suspended ? "text-[#dc2626]" : ""}`}
                        name="status"
                        form={formId}
                        defaultValue={profile.status}
                      >
                        <option value="active">{t.active}</option>
                        <option value="suspended">{t.suspended}</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <form id={formId} action={updateAccount}>
                        <input type="hidden" name="id" value={profile.uuid} />
                        {!staff && <input type="hidden" name="role" value={profile.role} />}
                        <button className="h-9 rounded-lg border border-[#171717]/15 px-3 text-sm text-[#171717]" type="submit">{t.save}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
