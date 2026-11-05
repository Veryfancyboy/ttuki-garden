/* 뚝이네 정원 service worker: always fresh from the network, last copy kept for offline */
const C = 'ttk-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./', cp)).catch(() => {}); return res; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});
