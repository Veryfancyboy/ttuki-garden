/* 도깨비 마을 service worker v4
   - 게임 페이지(index.html)·version.json·sw.js: 언제나 서버에서 새로 받음(브라우저 캐시도 건너뜀). 게임 페이지만 마지막 것을 오프라인용으로 보관
   - 게임 페이지가 아닌 주소로 바로 들어오면(그림·json 등) 손대지 않음(오프라인용 페이지를 덮어쓰지 않게)
   - 전투 코디 그림(bt/): 받아 둔 것을 먼저 보여 주고 뒤에서 새로 받아 바꿔 둠. 주소에 ?b=번호 가 붙어 있어 그림을 바꾸면 새 주소가 됨
   - 친구 그림(char/): 서버 먼저, 안 되면 받아 둔 것(오프라인)
   - 새 sw 는 기다리지 않고 바로 켜지고(skipWaiting + clients.claim), 옛 캐시는 우리 이름(ttk-)으로 시작하는 것만 지움
     (같은 veryfancyboy.github.io 주소를 쓰는 다른 앱의 캐시는 건드리지 않음) */
const VER = 'sw4b-20261109', C = 'ttk-v2', CI = 'ttk-img-v1';
const ROOT = new URL('./', self.location).pathname;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.indexOf('ttk-') === 0 && k !== C && k !== CI).map(k => caches.delete(k))); await self.clients.claim(); })()));
self.addEventListener('message', e => { if (e.data === 'ver' && e.source) e.source.postMessage({ ver: VER }); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    if (u.pathname !== ROOT && u.pathname !== ROOT + 'index.html') return;
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(ROOT, cp)).catch(() => {}); } return res; }).catch(() => caches.match(ROOT).then(m => m || Response.error())));
    return;
  }
  if (u.pathname.endsWith('/version.json') || u.pathname.endsWith('/sw.js')) { e.respondWith(fetch(r.url, { cache: 'no-store' })); return; }
  if (u.pathname.startsWith(ROOT + 'bt/')) {
    const p = caches.open(CI).then(c => c.match(r).then(hit => { const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()).catch(() => {}); return res; }).catch(() => null); return { hit, net }; }));
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
