import { PageHeading } from "@/components/PageHeading";
import { requireUser } from "@/lib/auth";
import { getCopy, statusText } from "@/lib/i18n";
import { createAccount, updateAccount } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
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
  const { data: logs } = await supabase
    .from("login_logs")
    .select("id, created_at, success, profiles(name, id)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <PageHeading backHref="/dashboard" backLabel={t.backPage} title={t.users} />
      {(error || profileError) && (
        <p className="mt-3 text-sm text-red-700">{error || profileError?.message}</p>
      )}
      {created && (
        <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-900">
          {t.accountCreated} {created}.
        </p>
      )}

      <form action={createAccount} className="mt-4 grid gap-2 surface p-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 font-medium">{t.createAccount}</h2>
        <p className="sm:col-span-2 text-sm text-neutral-600">{t.createAccountHint}</p>
        <input className="rounded border px-2 py-1" name="full_name" placeholder={t.fullName} required />
        <input className="rounded border px-2 py-1" name="email" type="email" placeholder="name@gmail.com" autoComplete="email" />
        <input className="rounded border px-2 py-1" name="password" type="password" placeholder={t.password} minLength={6} required />
        <select className="rounded border px-2 py-1" name="role" defaultValue="botanist">
          {roles.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <button className="btn sm:col-span-2" type="submit">{t.create}</button>
      </form>

      <section className="surface mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 font-medium">{t.users}</h2>
        <div className="scroll-box h-72 overflow-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="sticky top-0 z-10 bg-emerald-50 text-left text-forest">
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
                return (
                  <tr key={profile.uuid} className="border-b last:border-0">
                    <td className="p-3 font-medium">{profile.id}</td>
                    <td className="p-3">{profile.name}</td>
                    <td className="p-3 text-neutral-600">{profile.email || "—"}</td>
                    <td className="p-3">
                      {staff ? (
                        <select className="rounded border px-2 py-1" name="role" form={formId} defaultValue={profile.role}>
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        statusText(profile.role, t)
                      )}
                    </td>
                    <td className="p-3">
                      <select className="rounded border px-2 py-1" name="status" form={formId} defaultValue={profile.status}>
                        <option value="active">{t.active}</option>
                        <option value="suspended">{t.suspended}</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <form id={formId} action={updateAccount}>
                        <input type="hidden" name="id" value={profile.uuid} />
                        {!staff && <input type="hidden" name="role" value={profile.role} />}
                        <button className="rounded border px-3 py-1" type="submit">{t.save}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface mt-6 overflow-hidden">
        <h2 className="border-b px-4 py-3 font-medium">{t.recentLogins}</h2>
        <ul className="scroll-box h-48 divide-y overflow-auto text-sm">
          {(logs ?? []).map((log) => {
            const person = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
            return (
              <li key={log.id} className="px-4 py-3">
                {person?.name || person?.id || t.unknown} · {new Date(log.created_at).toLocaleString()} · {log.success ? t.success : t.failed}
              </li>
            );
          })}
          {(logs ?? []).length === 0 && <li className="px-4 py-4 text-neutral-500">{t.noLogins}</li>}
        </ul>
      </section>
    </main>
  );
}
