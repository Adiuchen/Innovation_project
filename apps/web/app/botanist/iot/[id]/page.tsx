import { IotKitPlantPage } from "@/components/IotKitPlantPage";

export default async function BotanistIotPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IotKitPlantPage roles={["botanist"]} basePath="/botanist/iot" id={id} />;
}
