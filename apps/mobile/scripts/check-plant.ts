import assert from "node:assert/strict";
import { isDisplayablePhoto, speciesPhoto, storageObjectPath } from "../src/lib/photo-path.ts";
import {
  fieldProblems,
  numberOrNull,
  parsePlantCode,
  plantQrValue,
  qrCodeForRecord,
  staffEmail,
  textOrNull,
} from "../src/lib/plant.ts";

assert.equal(staffEmail("B001"), "b001@staff.plantrecords.com");
assert.equal(staffEmail(" O002 "), "o002@staff.plantrecords.com");
assert.equal(staffEmail("botanist@staff.plantrecords.com"), "botanist@staff.plantrecords.com");

assert.equal(parsePlantCode("plant-abc123"), "plant-abc123");
assert.equal(parsePlantCode("https://records.example/p/plant-abc123"), "plant-abc123");
assert.equal(parsePlantCode("https://records.example/p/plant-abc123?from=tag"), "plant-abc123");
assert.equal(parsePlantCode("http://localhost:3000/p/plant-deadbeef/"), "plant-deadbeef");

assert.equal(qrCodeForRecord("12345678-aaaa-bbbb-cccc-ddddeeeeffff"), "plant-12345678");
assert.equal(plantQrValue("plant-12345678", "https://records.example/"), "https://records.example/p/plant-12345678");
assert.equal(plantQrValue("plant-12345678", ""), "plant-12345678");

assert.equal(numberOrNull(" 1.5 "), 1.5);
assert.equal(numberOrNull(""), null);
assert.equal(numberOrNull("no"), null);
assert.equal(textOrNull("  "), null);
assert.equal(textOrNull(" leaf "), "leaf");

assert.deepEqual(
  fieldProblems({
    species_id: null,
    species_label: "",
    height_m: "abc",
    trunk_diameter_cm: "",
    latitude: "3.8",
    longitude: "bad",
    location_name: "",
    leaf_traits: "",
    flower_fruit_traits: "",
    health_status: "",
    other_traits: "",
    photo_uri: null,
    photo_caption: "",
    status: "submitted",
  }),
  ["Height must be a number.", "Longitude must be a number."],
);

const officerFolder = "73936c08-fe42-44d2-a23b-c71fe6f6da9b";
const newest = `${officerFolder}/494261d6-2d95-4336-99de-aaf1eb9b0516.png`;
const older = `${officerFolder}/b8354b72-5a6a-48e2-b627-f8c095318774.png`;
const publicUrl = `https://example.supabase.co/storage/v1/object/public/plant-photos/${older}`;

assert.equal(storageObjectPath(`${officerFolder}/leaf.png`), `${officerFolder}/leaf.png`);
assert.equal(storageObjectPath(publicUrl), older);
assert.equal(
  storageObjectPath(`https://example.supabase.co/storage/v1/object/sign/plant-photos/${older}?token=abc`),
  older,
);
assert.equal(storageObjectPath("file:///phone/photo.jpg"), null);
assert.equal(isDisplayablePhoto("https://daftlimmy.itch.io/67"), false);
assert.equal(isDisplayablePhoto("https://example.com/leaf.png"), true);
assert.equal(isDisplayablePhoto("file:///phone/photo.jpg"), true);

assert.deepEqual(
  speciesPhoto([
    { storage_path: "file:///cache/page.jpg", caption: "67kid" },
    { storage_path: "https://daftlimmy.itch.io/67", caption: "67kid" },
    { storage_path: older, caption: null },
    { storage_path: newest, caption: null },
  ]),
  { storage_path: newest, caption: "67kid" },
);

assert.deepEqual(
  speciesPhoto(
    [
      { storage_path: `${officerFolder}/older.jpg`, caption: "first" },
      { storage_path: `${officerFolder}/newer.jpg`, caption: "second" },
      { storage_path: `${officerFolder}/plain.png`, caption: null },
    ],
    (path) => (path.endsWith("newer.jpg") ? "2026-10-04T07:14:39.321Z" : "2026-10-04T07:11:41.572Z"),
  ),
  { storage_path: `${officerFolder}/newer.jpg`, caption: "second" },
);

assert.deepEqual(speciesPhoto([{ storage_path: "file:///phone/photo.jpg", caption: "On the phone" }]), {
  storage_path: "file:///phone/photo.jpg",
  caption: "On the phone",
});

assert.deepEqual(
  speciesPhoto(
    [
      { storage_path: `${officerFolder}/older.jpg`, caption: "kept on the older photo" },
      { storage_path: `${officerFolder}/newer.jpg`, caption: null },
    ],
    (path) => (path.endsWith("newer.jpg") ? "2026-10-05T02:35:20.828Z" : "2026-10-04T07:10:44.103Z"),
  ),
  { storage_path: `${officerFolder}/newer.jpg`, caption: null },
);

console.log("plant helpers ok");
