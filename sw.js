/* Service worker del Simulador Variforma: caché cache-first y share_target. */
/* 22a5c5ff3e24 y ["./", "./index.html", "./pwa.js", "./manifest.webmanifest", "./version.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-192-maskable.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png", "./examples/O9000_copa_demo_v2_4_1.NCD", "./dos_cabezas.html", "./examples/O0010_dos_cabezas_EJEMPLO.NCD"] los rellena pwa_build.py */
const VERSION = "22a5c5ff3e24";
const CACHE = "variforma-sim-" + VERSION;
const PRECACHE = ["./", "./index.html", "./pwa.js", "./manifest.webmanifest", "./version.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-192-maskable.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png", "./examples/O9000_copa_demo_v2_4_1.NCD", "./dos_cabezas.html", "./examples/O0010_dos_cabezas_EJEMPLO.NCD"];
const SHARE_INBOX = "variforma-share-inbox";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("variforma-sim-") && k !== CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "SKIP_WAITING" || (data && data.type === "SKIP_WAITING")) {
    self.skipWaiting();
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && request.method === "GET") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.mode === "navigate") {
      return (await cache.match("./index.html", { ignoreSearch: true }))
        || (await cache.match("./", { ignoreSearch: true }))
        || Response.error();
    }
    throw err;
  }
}

async function handleShare(event) {
  try {
    const form = await event.request.formData();
    const file = form.get("file") || form.get("ncd") || form.get("files");
    if (file && typeof file === "object" && file.name) {
      const inbox = await caches.open(SHARE_INBOX);
      const headers = new Headers({
        "X-Filename": encodeURIComponent(file.name),
        "Content-Type": file.type || "application/octet-stream",
      });
      await inbox.put("incoming", new Response(file, { headers: headers }));
    }
  } catch (err) {
    /* si el POST llega vacío, igual redirigimos a la app */
  }
  return Response.redirect(new URL("./?share-target=1", self.registration.scope).href, 303);
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && /\/share(-target)?\/?$/.test(url.pathname)) {
    event.respondWith(handleShare(event));
    return;
  }
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  event.respondWith(cacheFirst(event.request));
});
