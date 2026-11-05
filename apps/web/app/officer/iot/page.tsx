import { OfficerIot } from "@/components/OfficerIot";
import { requireUser } from "@/lib/auth";

export default async function OfficerIotPage() {
  await requireUser(["conservation_officer", "administrator"]);
  return <OfficerIot />;
}
