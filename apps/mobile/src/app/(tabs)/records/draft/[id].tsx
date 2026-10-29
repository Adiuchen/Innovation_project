import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Notice, Screen } from "@/components/ui";
import { RecordForm } from "@/components/RecordForm";
import { getDraft, saveDraft } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { firstParam } from "@/lib/plant";
import type { Draft, FieldInput } from "@/types";

export default function DraftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const localId = firstParam(id);
  const { profile, online, syncNow } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getDraft(localId).then((row) => {
      setDraft(row);
      setMissing(!row);
    });
  }, [localId]);

  if (!profile) return null;
  if (missing) {
    return (
      <Screen>
        <Notice tone="warn">This saved record is no longer on the phone.</Notice>
      </Screen>
    );
  }
  if (!draft) return null;

  return (
    <Screen>
      {draft.sync_error && <Notice tone="danger">{draft.sync_error}</Notice>}
      <RecordForm
        localId={draft.local_id}
        mode="create"
        initial={draft}
        submitLabel="Save record"
        onSubmit={async (input: FieldInput) => {
          try {
            await saveDraft({
              ...draft,
              ...input,
              photo_remote_url: input.photo_uri === draft.photo_uri ? draft.photo_remote_url : null,
              sync_error: null,
              saved_at: new Date().toISOString(),
            });
          } catch (error) {
            return error instanceof Error ? error.message : "Could not save this record on the phone.";
          }
          if (online) await syncNow();
          router.replace("/records");
          return null;
        }}
      />
    </Screen>
  );
}
