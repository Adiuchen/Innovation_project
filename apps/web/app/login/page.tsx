import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getCopy } from "@/lib/i18n";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;
  const { t } = await getCopy();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="surface w-full p-8">
        <BrandMark className="h-11 w-11" />
        <h1 className="mt-4 text-2xl font-semibold">{t.login}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t.loginIntro}</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {reset && <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-900">{t.passwordUpdated}</p>}
        <form action={login} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            {t.loginId}
            <input className="mt-1 w-full rounded-lg border px-3 py-2" name="login_id" autoComplete="username" placeholder={t.loginPlaceholder} required />
          </label>
          <label className="block text-sm font-medium">
            {t.password}
            <input className="mt-1 w-full rounded-lg border px-3 py-2" name="password" type="password" required />
          </label>
          <Link className="inline-block text-sm font-medium text-forest" href="/login/reset">{t.forgotPassword}</Link>
          <button className="btn w-full" type="submit">
            {t.login}
          </button>
        </form>
      </div>
    </main>
  );
}
