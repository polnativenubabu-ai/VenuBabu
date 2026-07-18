const cacheName = "sarvatra-v3";

const filesToCache = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "tools/image-to-pdf.html"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const copy = response.clone();
        caches.open(cacheName).then(cache => {
          cache.put(e.request, copy);
        });
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
