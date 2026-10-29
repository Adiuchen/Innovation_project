const CACHE = "plant-field-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  const botanistPage =
    event.request.mode === "navigate" &&
    (url.pathname === "/botanist" || url.pathname === "/botanist/new");
  const asset =
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font";

  if (!botanistPage && !asset) return;

  event.respondWith(networkThenCache(event.request, botanistPage ? url.pathname : event.request));
});

async function networkThenCache(request, key) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(key, response.clone());
    return response;
  } catch {
    const cached = await cache.match(key);
    if (cached) return cached;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}
