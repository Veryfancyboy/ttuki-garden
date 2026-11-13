/* 도깨비 마을 service worker v5 (안)
   - v4c 그대로 + a/ (게임 그림, 이름 = 내용 해시): 받아 둔 것이 있으면 그것만 씀(이름이 바뀌지 않는 한 내용이 같음), 없으면 받아서 넣어 둠
   - a/ 캐시(ttk-a-v1)는 버전이 바뀌어도 지우지 않음(새 판에서 안 쓰는 그림 정리는 page 가 보낸 목록으로) */
const VER = 'sw5-20261114', C = 'ttk-v2', CI = 'ttk-img-v1', CA = 'ttk-a-v1';
const ROOT = new URL('./', self.location).pathname;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.indexOf('ttk-') === 0 && k !== C && k !== CI && k !== CA).map(k => caches.delete(k))); await self.clients.claim(); })()));
self.addEventListener('message', e => {
  if (e.data === 'ver' && e.source) e.source.postMessage({ ver: VER });
  /* 정리: { keep134: ['3f9c2e1a77.webp', ...] } 를 받으면 그 목록에 없는 a/ 항목을 지움(새 판이 켜진 뒤 한 번) */
  if (e.data && e.data.keep134) e.waitUntil(caches.open(CA).then(async c => { const keep = new Set(e.data.keep134); for (const r of await c.keys()) { const n = new URL(r.url).pathname.split('/').pop(); if (!keep.has(n)) await c.delete(r); } }));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    if (u.pathname !== ROOT && u.pathname !== ROOT + 'index.html') return;
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(ROOT, cp)).catch(() => {}); } return res; }).catch(() => caches.match(ROOT).then(m => m || Response.error())));
    return;
  }
  if (u.pathname.endsWith('/version.json') || u.pathname.endsWith('/sw.js')) { e.respondWith(fetch(r.url, { cache: 'no-store' })); return; }
  if (u.pathname.startsWith(ROOT + 'a/')) {
    e.respondWith(caches.open(CA).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => { if (res && res.ok && res.status === 200) c.put(r, res.clone()).catch(() => {}); return res; }))).catch(() => fetch(r)));
    return;
  }
  if (u.pathname.startsWith(ROOT + 'bt/')) {
    const p = caches.open(CI).then(c => c.match(r).then(hit => { const net = fetch(r, { cache: 'no-cache' }).then(res => { if (res && res.ok) c.put(r, res.clone()).catch(() => {}); return res; }).catch(() => null); return { hit, net }; }));
    e.respondWith(p.then(o => o.hit || o.net.then(res => res || Response.error())));
    e.waitUntil(p.then(o => o.net).catch(() => {}));
    return;
  }
  if (u.pathname.startsWith(ROOT + 'char/')) {
    e.respondWith(fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CI).then(c => c.put(r, cp)).catch(() => {}); } return res; }).catch(() => caches.open(CI).then(c => c.match(r)).then(m => m || Response.error())));
    return;
  }
  e.respondWith(fetch(r).catch(() => caches.match(r).then(m => m || Response.error())));
});
