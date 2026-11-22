const VERSION = 'v3.0.0-reeferdude-gravity-gone';
const CACHE_PREFIX = 'reeferdude-gg';

const CACHES = {
  shell: `${CACHE_PREFIX}-shell-${VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-${VERSION}`,
  assets: `${CACHE_PREFIX}-assets-${VERSION}`,
  models3d: `${CACHE_PREFIX}-3d-xr-${VERSION}`,
  aiKnowledge: `${CACHE_PREFIX}-ai-rag-${VERSION}`,
  media: `${CACHE_PREFIX}-media-${VERSION}`
};

const MAX_ENTRIES = {
  runtime: 80,
  assets: 120,
  models3d: 40,
  aiKnowledge: 60,
  media: 60
};

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/ads.txt'
];

const DB_NAME = 'reeferdude-sw-sync-db';
const DB_VERSION = 1;
const STORE_OUTBOX = 'offline-outbox';

const ALLOWED_EXTERNAL_ORIGINS = new Set([
  self.location.origin,
  'https://reeferdude.com',
  'https://potgrowhub.store',
  'https://ganjagoddessai.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
]);

const BYPASS_PATHS = [
  '/api/checkout',
  '/api/payment',
  '/api/webhook',
  '/api/auth',
  '/share-receiver'
];

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueOfflineAction(payload) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite');
    tx.objectStore(STORE_OUTBOX).add({
      ...payload,
      queuedAt: Date.now()
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function flushOfflineOutbox() {
  const db = await openSyncDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readonly');
    const req = tx.objectStore(STORE_OUTBOX).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method || 'POST',
        headers: item.headers || { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined
      });
      if (response.ok) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_OUTBOX, 'readwrite');
          tx.objectStore(STORE_OUTBOX).delete(item.id);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      }
    } catch {
      break;
    }
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const excess = keys.slice(0, keys.length - maxItems);
    await Promise.all(excess.map((req) => cache.delete(req)));
  }
}

function classifyRequest(url, request) {
  const pathname = url.pathname.toLowerCase();

  if (request.mode === 'navigate') {
    return 'navigation';
  }
  if (
    pathname.endsWith('.stl') ||
    pathname.endsWith('.glb') ||
    pathname.endsWith('.gltf') ||
    pathname.endsWith('.bin') ||
    pathname.endsWith('.hdr') ||
    pathname.endsWith('.exr') ||
    pathname.endsWith('.wasm')
  ) {
    return 'models3d';
  }
  if (
    pathname.endsWith('.onnx') ||
    pathname.endsWith('.gguf') ||
    pathname.includes('/rag/') ||
    pathname.includes('/knowledge/') ||
    pathname.endsWith('llms.txt') ||
    pathname.endsWith('llms-full.txt')
  ) {
    return 'aiKnowledge';
  }
  if (
    pathname.endsWith('.js') ||
    pathname.endsWith('.mjs') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf')
  ) {
    return 'assets';
  }
  if (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.avif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.mp3') ||
    pathname.endsWith('.ogg') ||
    pathname.endsWith('.wav')
  ) {
    return 'media';
  }
  return 'runtime';
}

async function networkFirstWithShellFallback(request) {
  const shellCache = await caches.open(CACHES.shell);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      shellCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedRoute = await shellCache.match(request, { ignoreSearch: true });
    if (cachedRoute) return cachedRoute;
    const cachedIndex = await shellCache.match('/index.html');
    if (cachedIndex) return cachedIndex;
    return new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ReeferDude Offline</title><style>body{background:#070510;color:#e3e6ff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem}h1{color:#7cff8a}button{background:#7cff8a;color:#070510;border:0;border-radius:999px;padding:.75rem 1.5rem;font-weight:700;cursor:pointer}</style></head><body><main><h1>ReeferDude — Offline Gravity Mode</h1><p>Connection paused. Local Gravity-Gone physics and cached knowledge remain available when you reconnect.</p><button onclick="location.reload()">Reconnect Universe</button></main></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

async function cacheFirstWithBackgroundRefresh(request, cacheName, maxItems, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        await cache.put(request, response.clone());
        if (maxItems) {
          await trimCache(cacheName, maxItems);
        }
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    if (event) {
      event.waitUntil(networkFetch);
    }
    return cached;
  }

  const fresh = await networkFetch;
  if (fresh) return fresh;
  return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

async function staleWhileRevalidate(request, cacheName, maxItems, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        await cache.put(request, response.clone());
        if (maxItems) {
          await trimCache(cacheName, maxItems);
        }
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    if (event) {
      event.waitUntil(networkPromise);
    }
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response(JSON.stringify({ offline: true, error: 'Resource unavailable offline' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';
    const files = formData.getAll('design_assets');

    const serializedFiles = [];
    for (const file of files) {
      if (file && typeof file.arrayBuffer === 'function') {
        const buffer = await file.arrayBuffer();
        serializedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          buffer
        });
      }
    }

    const redirectUrl = new URL('/?portal=studio&shared=1', self.location.origin);
    if (title) redirectUrl.searchParams.set('title', String(title).slice(0, 120));
    if (text) redirectUrl.searchParams.set('text', String(text).slice(0, 240));
    if (url) redirectUrl.searchParams.set('shared_url', String(url).slice(0, 240));

    if (serializedFiles.length > 0) {
      const db = await openSyncDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        tx.objectStore(STORE_OUTBOX).put({
          id: 'latest-shared-assets',
          files: serializedFiles,
          receivedAt: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }

    return Response.redirect(redirectUrl.toString(), 303);
  } catch {
    return Response.redirect('/?portal=studio&shared=error', 303);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(CACHES.shell);
      await Promise.allSettled(
        APP_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response.ok) {
              await shellCache.put(url, response);
            }
          } catch {
            // Skip missing optional files during install
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  const validCaches = new Set(Object.values(CACHES));
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const existingNames = await caches.keys();
      await Promise.all(
        existingNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !validCaches.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/share-receiver') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname === 'localhost' && (url.port === '11434' || url.port === '8080')) {
    return;
  }

  if (BYPASS_PATHS.some((prefix) => url.pathname.startsWith(prefix))) {
    return;
  }

  if (!ALLOWED_EXTERNAL_ORIGINS.has(url.origin)) {
    return;
  }

  if (request.headers.has('range')) {
    return;
  }

  const category = classifyRequest(url, request);

  if (category === 'navigation') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            const shellCache = await caches.open(CACHES.shell);
            shellCache.put(request, preloadResponse.clone());
            return preloadResponse;
          }
        } catch {
          // Ignore preload error and fall through
        }
        return networkFirstWithShellFallback(request);
      })()
    );
    return;
  }

  if (category === 'models3d') {
    event.respondWith(
      cacheFirstWithBackgroundRefresh(request, CACHES.models3d, MAX_ENTRIES.models3d, event)
    );
    return;
  }

  if (category === 'aiKnowledge') {
    event.respondWith(
      staleWhileRevalidate(request, CACHES.aiKnowledge, MAX_ENTRIES.aiKnowledge, event)
    );
    return;
  }

  if (category === 'assets') {
    event.respondWith(
      cacheFirstWithBackgroundRefresh(request, CACHES.assets, MAX_ENTRIES.assets, event)
    );
    return;
  }

  if (category === 'media') {
    event.respondWith(
      cacheFirstWithBackgroundRefresh(request, CACHES.media, MAX_ENTRIES.media, event)
    );
    return;
  }

  event.respondWith(
    staleWhileRevalidate(request, CACHES.runtime, MAX_ENTRIES.runtime, event)
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'reeferdude-outbox-sync') {
    event.waitUntil(flushOfflineOutbox());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reeferdude-knowledge-refresh') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHES.aiKnowledge);
        const refreshTargets = ['/llms.txt', '/sitemap.xml'];
        await Promise.allSettled(
          refreshTargets.map(async (path) => {
            const res = await fetch(path, { cache: 'no-store' });
            if (res.ok) {
              await cache.put(path, res);
            }
          })
        );
      })()
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'ReeferDude & GanjaGuru',
    body: 'New spatial drop or blueprint update in your Gravity-Gone universe.',
    url: '/?portal=discovery'
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'reeferdude-universe-alert',
      data: { url: payload.url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'QUEUE_OFFLINE_ACTION' && data.payload) {
    event.waitUntil(queueOfflineAction(data.payload));
  } else if (data.type === 'FLUSH_OUTBOX') {
    event.waitUntil(flushOfflineOutbox());
  } else if (data.type === 'PRECACHE_3D_ASSETS' && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHES.models3d);
        await Promise.allSettled(
          data.urls.map(async (assetUrl) => {
            const res = await fetch(assetUrl);
            if (res.ok) {
              await cache.put(assetUrl, res);
            }
          })
        );
        await trimCache(CACHES.models3d, MAX_ENTRIES.models3d);
      })()
    );
  } else if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(names.filter((n) => n.startsWith(CACHE_PREFIX)).map((n) => caches.delete(n)));
      })()
    );
  }
});
