import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { printPlantQr } from "@/lib/remote";

export function PrintQrButton({ qrCode }: { qrCode: string }) {
  const { profile, online } = useAuth();
  const { t } = usePreferences();
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  if (profile?.role !== "botanist" || !qrCode) return null;

  return (
    <View style={styles.wrap}>
      <Button
        label={printing ? t.printingQr : t.printQr}
        disabled={printing}
        onPress={async () => {
          if (!online) {
            setFailed(true);
            setMessage(t.printQrOffline);
            return;
          }
          setPrinting(true);
          setFailed(false);
          setMessage(null);
          const error = await printPlantQr(qrCode);
          setPrinting(false);
          setFailed(Boolean(error));
          setMessage(!error ? t.qrPrinted : error === "printer" ? t.qrPrintFailed : error);
        }}
      />
      {message ? <Notice tone={failed ? "danger" : "ok"}>{message}</Notice> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch", gap: 8 },
});
