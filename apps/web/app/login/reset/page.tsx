import { BrandMark } from "@/components/BrandMark";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getCopy } from "@/lib/i18n";
import { isPendingResetUser } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { t } = await getCopy();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ready = Boolean(user && isPendingResetUser(user.id));

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <BrandMark className="mb-4 h-11 w-11" />
      <ResetPasswordForm t={t} ready={ready} linkError={params.error === "link" && !ready} />
    </main>
  );
}
