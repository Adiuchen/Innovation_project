import { OfficerIot } from "@/components/OfficerIot";
import { requireUser } from "@/lib/auth";

export default async function BotanistIotPage() {
  await requireUser(["botanist"]);
  return <OfficerIot />;
}
