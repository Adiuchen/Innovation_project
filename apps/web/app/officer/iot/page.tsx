import { IotDashboard } from "@/components/IotDashboard";
import { requireUser } from "@/lib/auth";

export default async function OfficerIotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { profile } = await requireUser(["administrator", "conservation_officer"]);
  return <IotDashboard canManage={profile.role === "administrator"} error={error} />;
}
