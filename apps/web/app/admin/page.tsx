import Link from "next/link";
import { AdminHeading } from "@/app/admin/AdminHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function AdminPage() {
  await requireUser(["administrator"]);
  const { t } = await getCopy();
  const items = [
    { href: "/admin/users/new", title: t.addUser, text: t.addUserText },
    { href: "/admin/users", title: t.manageAccess, text: t.manageAccessText },
    { href: "/admin/logins", title: t.loginHistory, text: t.loginHistoryText },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <AdminHeading title={t.manageUsers} backLabel={t.back} />
      <p className="text-sm text-[#525252]">{t.manageUsersText}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block h-full rounded-xl border border-[#171717]/8 bg-white px-5 py-4">
              <span className="font-semibold text-[#171717]">{item.title}</span>
              <span className="mt-1 block text-sm leading-5 text-[#525252]">{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
