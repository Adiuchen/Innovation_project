import { AdminHeading } from "@/app/admin/AdminHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";
import { createAccount } from "../../actions";

const field = "mt-1 h-10 w-full rounded-lg border px-3 text-sm text-[#171717]";

export default async function AddUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;
  await requireUser(["administrator"]);
  const { t } = await getCopy();
  const roles = [
    { value: "botanist", label: t.botanist },
    { value: "conservation_officer", label: t.officer },
    { value: "guide", label: t.guide },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <AdminHeading title={t.addUser} backHref="/admin" backLabel={t.back} />
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {created && (
        <p className="mb-4 text-sm text-[#171717]">
          {t.accountCreated} {created}
        </p>
      )}
      <form action={createAccount} className="rounded-xl border border-[#171717]/8 bg-white p-5">
        <h2 className="font-semibold text-[#171717]">{t.createAccount}</h2>
        <p className="mt-1 text-sm text-[#737373]">{t.createAccountHint}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-[#525252]">
            {t.fullName}
            <input className={field} name="full_name" autoComplete="name" required />
          </label>
          <label className="block text-sm text-[#525252]">
            {t.email}
            <input className={field} name="email" type="email" placeholder="name@gmail.com" autoComplete="email" />
            <span className="mt-1 block text-[#737373]">{t.emailGmail}</span>
          </label>
          <label className="block text-sm text-[#525252]">
            {t.password}
            <input className={field} name="password" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          <label className="block text-sm text-[#525252]">
            {t.role}
            <select className={field} name="role" defaultValue="botanist">
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn mt-4 h-10 px-4" type="submit">{t.create}</button>
      </form>
    </main>
  );
}
