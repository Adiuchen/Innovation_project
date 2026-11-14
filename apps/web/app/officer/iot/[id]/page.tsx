import { IotKitPlantPage } from "@/components/IotKitPlantPage";

export default async function OfficerIotPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IotKitPlantPage roles={["conservation_officer", "administrator"]} basePath="/officer/iot" id={id} />;
}
