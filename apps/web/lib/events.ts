import { eventHasFinished } from "@/lib/format";

type EventRow = { uuid: string; starts_at: string; ends_at: string | null };

export async function markExpiredEvents(client: unknown) {
  const events = (client as { from: (table: string) => {
    select: (columns: string) => { eq: (column: string, value: string) => Promise<{ data: EventRow[] | null; error: { message: string } | null }> };
    update: (row: { status: "expired" }) => { in: (column: string, values: string[]) => { eq: (column: string, value: string) => Promise<unknown> } };
  } }).from("events");
  const listed = await events.select("uuid, starts_at, ends_at").eq("status", "published");
  if (listed.error || !listed.data) return;
  const ids = listed.data.filter((row) => eventHasFinished(row.starts_at, row.ends_at)).map((row) => row.uuid);
  if (ids.length === 0) return;
  await events.update({ status: "expired" }).in("uuid", ids).eq("status", "published");
}
