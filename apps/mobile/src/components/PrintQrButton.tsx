import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { parsePrinterHost, printPlantQrLocal, printerPort } from "@/lib/printer";

export function PrintQrButton({ qrCode, label }: { qrCode: string; label?: string | null }) {
  const { profile } = useAuth();
  const { printerIp, printerPort: portText, t } = usePreferences();
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
          const host = parsePrinterHost(printerIp);
          if (!host) {
            setFailed(true);
            setMessage(t.printerIpRequired);
            return;
          }
          setPrinting(true);
          setFailed(false);
          setMessage(null);
          const error = await printPlantQrLocal(qrCode, { host, port: printerPort(portText) }, label);
          setPrinting(false);
          setFailed(Boolean(error));
          setMessage(
            !error
              ? t.qrPrinted
              : error === "printer"
                ? t.qrPrintFailed
                : error === "dev-build"
                  ? t.printNeedsDevBuild
                  : error === "website"
                    ? t.printSiteDown
                    : error,
          );
        }}
      />
      {message ? <Notice tone={failed ? "danger" : "ok"}>{message}</Notice> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch", gap: 8 },
});
