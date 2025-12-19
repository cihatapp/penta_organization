/**
 * Penta Organization - Service Worker
 * 3D Model Caching & Offline Support
 *
 * Cache Strategy:
 * - 3D Models: Cache-first (download once, use forever until version change)
 * - Static Assets: Stale-while-revalidate
 * - HTML: Network-first with fallback
 */

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  models: `penta-3d-models-${CACHE_VERSION}`,
  static: `penta-static-${CACHE_VERSION}`,
  runtime: `penta-runtime-${CACHE_VERSION}`
};

// 3D Models to precache (these are the heavy files)
const MODEL_ASSETS = [
  './assets/3d/logo_3d_just_icon.glb',
  './assets/3d/corparete_event.glb',
  './assets/3d/decoration.glb',
  './assets/3d/staff.glb',
  './assets/3d/technical.glb',
  './assets/3d/transfer.glb'
];

// Static assets to cache
const STATIC_ASSETS = [
  './assets/css/main.css',
  './assets/css/components.css',
  './assets/js/main.js',
  './assets/images/logo.png'
];

/**
 * Install Event - Precache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    (async () => {
      // Cache 3D models
      const modelCache = await caches.open(CACHE_NAMES.models);
      console.log('[SW] Caching 3D models...');

      // Cache models one by one to track progress
      for (const model of MODEL_ASSETS) {
        try {
          const response = await fetch(model);
          if (response.ok) {
            await modelCache.put(model, response);
            console.log(`[SW] Cached: ${model}`);
          }
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${model}`, error);
        }
      }

      // Cache static assets
      const staticCache = await caches.open(CACHE_NAMES.static);
      console.log('[SW] Caching static assets...');
      await staticCache.addAll(STATIC_ASSETS);

      console.log('[SW] All assets cached successfully!');

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    (async () => {
      // Get all cache names
      const cacheNames = await caches.keys();

      // Delete old version caches
      await Promise.all(
        cacheNames
          .filter(name => {
            // Keep only current version caches
            return !Object.values(CACHE_NAMES).includes(name);
          })
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );

      // Take control of all clients immediately
      await self.clients.claim();

      console.log('[SW] Service Worker activated!');
    })()
  );
});

/**
 * Fetch Event - Serve from cache with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Strategy based on request type
  if (url.pathname.endsWith('.glb') || url.pathname.endsWith('.gltf')) {
    // 3D Models: Cache-first (they rarely change)
    event.respondWith(cacheFirst(event.request, CACHE_NAMES.models));
  } else if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|woff2?)$/)) {
    // Static assets: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAMES.static));
  } else if (url.pathname.endsWith('.html') || url.pathname === '/') {
    // HTML: Network-first with cache fallback
    event.respondWith(networkFirst(event.request, CACHE_NAMES.runtime));
  }
});

/**
 * Cache-First Strategy
 * Best for: Large files that rarely change (3D models)
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log(`[SW] Serving from cache: ${request.url}`);
    return cachedResponse;
  }

  console.log(`[SW] Fetching: ${request.url}`);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    // Clone and cache the response
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

/**
 * Stale-While-Revalidate Strategy
 * Best for: Static assets that might update
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start fetching in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

/**
 * Network-First Strategy
 * Best for: HTML pages that should be fresh
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Message handler for cache control
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_STATUS') {
    // Report cache status
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  } else if (event.data.type === 'CLEAR_CACHE') {
    // Clear all caches
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  } else if (event.data.type === 'PRELOAD_MODELS') {
    // Manually trigger model preloading
    preloadModels().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Get cache status for debugging
 */
async function getCacheStatus() {
  const modelCache = await caches.open(CACHE_NAMES.models);
  const modelKeys = await modelCache.keys();

  return {
    version: CACHE_VERSION,
    cachedModels: modelKeys.map(req => req.url),
    totalModels: MODEL_ASSETS.length,
    cachedCount: modelKeys.length
  };
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

/**
 * Preload models (can be triggered from main thread)
 */
async function preloadModels() {
  const cache = await caches.open(CACHE_NAMES.models);

  for (const model of MODEL_ASSETS) {
    const cached = await cache.match(model);
    if (!cached) {
      try {
        const response = await fetch(model);
        if (response.ok) {
          await cache.put(model, response);
          console.log(`[SW] Preloaded: ${model}`);
        }
      } catch (error) {
        console.warn(`[SW] Failed to preload: ${model}`, error);
      }
    }
  }
}
