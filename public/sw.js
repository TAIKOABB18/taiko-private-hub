const CACHE = "taiko-private-hub-shell-v1";
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"]))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => { const request = event.request; if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return; event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 })))); });
