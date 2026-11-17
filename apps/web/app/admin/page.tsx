import Link from "next/link";
import { AdminHeading } from "@/app/admin/AdminHeading";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n";

export default async function AdminPage() {
  await requireUser(["administrator"]);
  const { t } = await getCopy();
  const items = [
    { href: "/admin/users/new", title: t.addUser },
    { href: "/admin/users", title: t.manageAccess },
    { href: "/admin/logins", title: t.loginHistory },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <AdminHeading title={t.manageUsers} backLabel={t.back} />
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.href} className="h-full">
            <Link
              href={item.href}
              className="flex h-full min-h-[4.75rem] items-center justify-center rounded-2xl border border-emerald-950/10 bg-white px-4 py-3 text-center font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
