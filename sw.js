/* 뚝이네 정원 service worker v2: 페이지와 버전 파일은 늘 서버에서 새로 받고(HTTP 캐시 건너뜀), 마지막 것은 오프라인용으로 보관 */
const C = 'ttk-v2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => { const ks = await caches.keys(); await Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./', cp)).catch(() => {}); return res; }).catch(() => caches.match('./')));
    return;
  }
  if (/\/(version\.json|sw\.js)$/.test(u.pathname)) { e.respondWith(fetch(r.url, { cache: 'no-store' })); return; }
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});
