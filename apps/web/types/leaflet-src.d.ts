// The map loads Leaflet's browser build directly. It has the same API as the "leaflet" package.
declare module "leaflet/dist/leaflet-src.js" {
  export * from "leaflet";
}
