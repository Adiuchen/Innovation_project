import type { Metadata } from "next";
import { CompleteResetLink } from "@/components/CompleteResetLink";
import { SiteHeader } from "@/components/SiteHeader";
import { getCopy } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getCopy();
  return {
    title: t.siteName,
    description: t.siteDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getCopy();
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full text-ink">
        <SiteHeader />
        <CompleteResetLink />
        {children}
      </body>
    </html>
  );
}
