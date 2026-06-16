const CACHE = 'repsnap-v1';

const SHELL = [
  '/Repsnap/',
  '/Repsnap/index.html',
  '/Repsnap/css/styles.css',
  '/Repsnap/js/main.js',
  '/Repsnap/js/api.js',
  '/Repsnap/js/auth.js',
  '/Repsnap/js/router.js',
  '/Repsnap/js/media.js',
  '/Repsnap/js/views/auth.js',
  '/Repsnap/js/views/feed.js',
  '/Repsnap/js/views/friends.js',
  '/Repsnap/js/views/groups.js',
  '/Repsnap/js/views/profile.js',
  '/Repsnap/js/views/chat.js',
  '/Repsnap/js/views/camera.js',
  '/Repsnap/js/views/call.js',
  '/Repsnap/favicon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for API calls and uploads
  if (url.pathname.includes('/api/') || url.pathname.includes('/uploads/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"ok":false,"error":"Offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Cache-first for everything else (app shell + assets)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
