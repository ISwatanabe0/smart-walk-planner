/* SmartWalk Service Worker
 * 最小限のオフライン対応:
 *  - アプリ殻（HTML/JS/CSS/アイコン）はキャッシュして再訪を高速化・オフライン表示
 *  - APIリクエストと外部リソース（地図タイル等）はキャッシュせず常にネットワーク
 */
const CACHE = "smartwalk-v1";
const APP_SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // 別オリジン（地図タイル等）はそのままネットワークに任せる
  if (url.origin !== self.location.origin) {
    return;
  }

  // APIは常に最新を取得（キャッシュしない）
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // ページ遷移: ネットワーク優先、オフライン時はキャッシュにフォールバック
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // 静的アセット: キャッシュ優先、なければ取得してキャッシュ
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
