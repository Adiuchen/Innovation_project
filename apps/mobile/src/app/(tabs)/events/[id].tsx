import { useLocalSearchParams } from "expo-router";
import { EventEditor } from "@/components/EventEditor";
import { Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { firstParam } from "@/lib/plant";
import { usePreferences } from "@/lib/preferences";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { t } = usePreferences();
  if (!profile) return null;
  if (profile.role !== "conservation_officer") {
    return (
      <Screen>
        <Notice>{t.eventsIntro}</Notice>
      </Screen>
    );
  }
  return <EventEditor userId={profile.uuid} eventId={firstParam(id)} />;
}
