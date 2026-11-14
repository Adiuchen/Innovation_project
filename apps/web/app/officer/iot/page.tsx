import { IotKitPage } from "@/components/IotKitPage";

export default function OfficerIotPage() {
  return <IotKitPage roles={["conservation_officer", "administrator"]} basePath="/officer/iot" />;
}
