/// <reference lib="webworker" />

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'lumaradio-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/app.js',
  '/assets/index.css',
  '/generated/player.js',
  '/generated/service-worker.js',
  '/icons/lumaradio.svg',
  '/icons/lumaradio-192.png',
  '/icons/lumaradio-512.png',
  '/vendor/three.r128.min.js',
  '/vendor/music-tempo.min.js',
  '/vendor/gsap.min.js',
  '/default-user-fx-archive.json',
];

sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  void sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => sw.clients.claim()));
});

sw.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== sw.location.origin || url.pathname.startsWith('/api/') || request.destination === 'audio') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html').then((response) => response ?? Response.error())));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => {
    const refreshed = fetch(request).then((response) => {
      if (response.ok) void caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached ?? Response.error());
    return cached ?? refreshed;
  }));
});
