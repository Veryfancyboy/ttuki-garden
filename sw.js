/* 도깨비 마을 service worker v3: 페이지와 버전 파일은 늘 서버에서 새로 받고(HTTP 캐시 건너뜀), 마지막 페이지는 오프라인용으로 보관.
   v3: 그림(bt/ 전투 코디 그림, char/ 친구 그림)은 받아 둔 것을 먼저 보여 주고 뒤에서 새로 받아 바꿔 둠(홈 화면 앱·오프라인에서도 보이게) */
const C = 'ttk-v2', CI = 'ttk-img-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => { const ks = await caches.keys(); await Promise.all(ks.filter(k => k !== C && k !== CI).map(k => caches.delete(k))); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./', cp)).catch(() => {}); return res; }).catch(() => caches.match('./')));
    return;
  }
  if (/\/(version\.json|sw\.js)$/.test(u.pathname)) { e.respondWith(fetch(r.url, { cache: 'no-store' })); return; }
  if (/\/(bt|char)\/[^/]+\.(webp|png|jpg)$/.test(u.pathname)) {
    const p = caches.open(CI).then(c => c.match(r).then(hit => { const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()).catch(() => {}); return res; }).catch(() => null); return { hit, net }; }));
    e.respondWith(p.then(o => o.hit || o.net.then(res => res || Response.error())));
    e.waitUntil(p.then(o => o.net).catch(() => {}));
    return;
  }
  e.respondWith(fetch(r).catch(() => caches.match(r)));
});
