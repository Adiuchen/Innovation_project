# ESP32 events: data format (Supabase table `esp32_events`)

The ESP32 decides everything on the board. It inserts one row per event. It does NOT upload raw sensor data.

## Table: public.esp32_events

| Column | Type | Nullable | Meaning |
|---|---|---|---|
| id | bigint (identity) | no | auto id |
| created_at | timestamptz | no | when Supabase received the row (server time, default now()) |
| event_at | timestamptz | yes | when it happened, from the ESP32's NTP clock. NULL if its clock was not synced yet. Use `coalesce(event_at, created_at)`. |
| device_id | text | no | currently always `esp32-kit-01` |
| event | text | no | see event values below |
| is_raining | boolean | no | rain state on the device when the event happened |
| plant_status | text | no | plant state when the event happened, see below |
| temperature_c | real | yes | degrees Celsius, 1 decimal. NULL if the DHT11 read failed. |
| humidity | real | yes | percent, whole number. NULL if the DHT11 read failed. |
| distance_cm | real | yes | ultrasonic distance in cm, 1 decimal. NULL if there was no echo. |

## event values (CHECK constraint)
| event | When it is sent |
|---|---|
| `boot` | the ESP32 started up |
| `armed` | baseline recorded, 8 s after boot or after the BOOT button was held. Its distance_cm is the last measured distance (about the baseline). |
| `rain_started` | plate wet AND humidity >= 85%, held for 6 s |
| `rain_stopped` | that condition false for 10 s |
| `plant_disturbed` | the plant moved, with no distance change. Rate limited to one per 60 s. |
| `plant_stolen` | plant moved AND distance changed for 3 s or more. Sent once, then latched. |
| `heartbeat` | status refresh every 10 minutes |

## plant_status values (CHECK constraint)
`arming`, `ok`, `disturbed`, `stolen`, `unarmed`
- `unarmed` means a baseline is missing (MPU6050 or ultrasonic did not respond during arming), so theft detection is off.
- `stolen` stays latched until the device is re-armed with its BOOT button. There is no "restored" event. Re-arming produces a new `armed` event with plant_status `ok`.

## JSON the ESP32 POSTs
POST `{SUPABASE_URL}/rest/v1/esp32_events`
Headers: `apikey: <anon/publishable key>`, `Content-Type: application/json`, `Prefer: return=minimal`
(`Authorization: Bearer <key>` is added only when the key is a legacy JWT starting with `eyJ`.)

Example:
```json
{
  "device_id": "esp32-kit-01",
  "event": "plant_stolen",
  "is_raining": false,
  "plant_status": "stolen",
  "temperature_c": 27.4,
  "humidity": 62,
  "distance_cm": 31.8,
  "event_at": "2026-11-04T05:21:07Z"
}
```
Missing values are sent as JSON `null`:
```json
{"device_id":"esp32-kit-01","event":"heartbeat","is_raining":true,"plant_status":"ok",
 "temperature_c":null,"humidity":null,"distance_cm":null,"event_at":null}
```
`event_at` is UTC in ISO 8601, or `null`.

## Access rules (RLS)
- anon key (the ESP32): INSERT only, and only when `device_id = 'esp32-kit-01'`. It cannot read, update or delete.
- authenticated users (the app or website): SELECT only (currently any signed-in user; tighten to staff roles if needed).

## Reading it from the app
Current state is the latest row per device:
```sql
select distinct on (device_id) *
from public.esp32_events
order by device_id, created_at desc;
```
- Currently raining = `is_raining` of the latest row.
- Plant status = `plant_status` of the latest row. A heartbeat refreshes it every 10 minutes, so a latest row older than about 15 minutes means the device is offline.
- Alerts = rows where `event in ('plant_stolen','plant_disturbed','rain_started')`.

supabase-js:
```ts
const { data } = await supabase
  .from('esp32_events')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

TypeScript type:
```ts
type Esp32Event = {
  id: number;
  created_at: string;
  event_at: string | null;
  device_id: string;
  event: 'boot' | 'armed' | 'rain_started' | 'rain_stopped'
       | 'plant_disturbed' | 'plant_stolen' | 'heartbeat';
  is_raining: boolean;
  plant_status: 'arming' | 'ok' | 'disturbed' | 'stolen' | 'unarmed';
  temperature_c: number | null;
  humidity: number | null;
  distance_cm: number | null;
};
```

## Notes
- This table is separate from the team's existing `sensors` and `sensor_readings` tables, which the ESP32 does not write to.
- Only the website or app should read this table. The ESP32 never reads from Supabase.