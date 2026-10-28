/*  عامل الخدمة — يجعل التطبيق يعمل بدون إنترنت
    قام بالإعداد والتصميم: عمرو ربيع | Prepared & designed by: Amr Rabeaa   */

var CACHE = 'approach-manual-v1';
var ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  './icons/maskable-192.png', './icons/maskable-512.png', './icons/favicon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).catch(function () { })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;

  var u;
  try { u = new URL(r.url); } catch (err) { return; }

  /* لا نتدخل في أي طلب خارجي — وخصوصاً إرسال البصمات إلى جوجل */
  if (u.origin !== self.location.origin) return;

  /* الصفحة نفسها: الشبكة أولاً ليصل أي تحديث فوراً، والذاكرة احتياطاً عند انقطاع الإنترنت */
  var isPage = (r.mode === 'navigate') || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (isPage) {
    e.respondWith(
      fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put(r, cp); });
        return res;
      }).catch(function () {
        return caches.match(r).then(function (x) { return x || caches.match('./index.html'); });
      })
    );
    return;
  }

  /* بقية الملفات (الأيقونات وغيرها): الذاكرة أولاً */
  e.respondWith(
    caches.match(r).then(function (x) {
      return x || fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put(r, cp); });
        return res;
      });
    })
  );
});
