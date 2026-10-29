# Plant Records field app

Mobile field book for botanists at Niah National Park. It uses the same Supabase project as the plant records website, with the publishable anon key only.

Staff sign in with the ID issued by an administrator. The app turns `B001` into `b001@staff.plantrecords.com`, loads `profiles`, and keeps the session only when `status` is `active`. Botanists must use the staff ID, not an email address.

## Run

```bash
npm install
npx expo start
```

Open the project in Expo Go on a phone. Camera, GPS, and the on-phone database need a device. Copy `.env.example` to `.env` if that file is missing. Set `EXPO_PUBLIC_SITE_URL` to the website origin, with no path, so a generated QR code opens `/p/{code}` on that site.

## What a botanist can do

- Register a plant on site, including taxonomy link, height, trunk diameter, leaf, flower or fruit, health, and other traits.
- Save the phone's GPS position and a place name.
- Take or choose a photograph and keep it with the record.
- Work without a connection. Records stay in a local database and upload when the network returns, using `local_id` so a retry does not create a duplicate.
- Search the species guide from a copy saved on the phone.
- Scan a plant tag, or type its code. Tags use the same `plant-{first 8 characters of the record id}` value as the website.
- Generate a QR code after a conservation officer approves the record, matching the website.

Other active staff can sign in to search species and scan tags. Only botanists can create field records.

## Photographs

There is no storage bucket in the project yet. Run `supabase/storage.sql` in the Supabase SQL editor before field photographs can upload. Until then, the record and its photo remain on the phone and the app explains why the upload stopped.

The service-role key is not used.
