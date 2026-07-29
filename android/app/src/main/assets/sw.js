const CACHE = "eow-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.jpg"];
const MQTT_LIB = "https://cdn.jsdelivr.net/npm/paho-mqtt@1.1.0/paho-mqtt-min.js";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(ASSETS);
      try {
        const r = await fetch(MQTT_LIB, { mode: "cors" });
        if (r.ok) await c.put(MQTT_LIB, r);
      } catch (_) {}
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url === MQTT_LIB) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) =>
      r ||
      fetch(e.request)
        .then((resp) => {
          const cp = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp));
          return resp;
        })
        .catch(() => caches.match("./index.html"))
    )
  );
});
