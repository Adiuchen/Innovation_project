import { EventEditor } from "@/components/EventEditor";
import { Notice, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";

export default function NewEventScreen() {
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
  return <EventEditor userId={profile.uuid} />;
}
