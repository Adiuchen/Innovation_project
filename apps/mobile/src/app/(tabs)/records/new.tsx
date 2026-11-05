import { router } from "expo-router";
import { useState } from "react";
import { Notice, Screen } from "@/components/ui";
import { RecordForm } from "@/components/RecordForm";
import { saveDraft } from "@/lib/db";
import { newId } from "@/lib/id";
import { useAuth } from "@/lib/auth";
import { qrCodeForRecord } from "@/lib/plant";
import type { FieldInput } from "@/types";

export default function NewRecordScreen() {
  const { profile, online, syncNow, refreshCount } = useAuth();
  const [localId] = useState(newId);

  if (!profile) return null;
  if (profile.role !== "botanist") {
    return (
      <Screen>
        <Notice>Only botanists can register plant records.</Notice>
      </Screen>
    );
  }

  return (
    <Screen>
      <Notice tone={online ? "ok" : "warn"}>
        {online
          ? "Connected. Saving will send this record to the central database."
          : "No connection. This record stays on the phone and uploads when the network returns."}
      </Notice>
      <RecordForm
        localId={localId}
        mode="create"
        submitLabel="Save record"
        onSubmit={async (input: FieldInput) => {
          const qr_code = input.status === "submitted" ? qrCodeForRecord(localId) : null;
          try {
            await saveDraft({
              ...input,
              local_id: localId,
              user_id: profile.uuid,
              remote_uuid: null,
              photo_remote_url: null,
              qr_code,
              sync_error: null,
              saved_at: new Date().toISOString(),
            });
          } catch (error) {
            return error instanceof Error ? error.message : "Could not save this record on the phone.";
          }
          if (online) await syncNow();
          else await refreshCount();
          if (qr_code) {
            // Replace the form with the draft detail so Back returns to the records list underneath.
            router.replace(`/records/draft/${localId}`);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/records");
          }
          return null;
        }}
      />
    </Screen>
  );
}
