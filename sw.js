// Droply service worker — makes the app installable and works offline-ish.
const CACHE = 'droply-v10';
const SHELL = [
  './droply-prototype.html',
  './droply-config.js',
  './droply-logo.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first for navigation/app files; never cache Supabase or map tiles.
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('tile.openstreetmap') ||
      url.includes('cdn.jsdelivr') || url.includes('cdnjs')) {
    return; // let these go straight to network
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
