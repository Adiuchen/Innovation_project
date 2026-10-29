import { PrepareFieldCache } from "@/components/PrepareFieldCache";
import { getCopy } from "@/lib/i18n";

export default async function BotanistLayout({ children }: LayoutProps<"/botanist">) {
  const { t } = await getCopy();

  return (
    <>
      {children}
      <PrepareFieldCache quiet readyLabel={t.fieldPhoneReady} failedLabel={t.fieldPhoneFailed} />
    </>
  );
}
