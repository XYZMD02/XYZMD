// 星言 Service Worker - 离线缓存支持
// ★ 版本号随应用更新：每次部署改这里（与 27_pwa.js 的 APP_VERSION 对应），
// 强制浏览器重新安装 SW 并清理旧缓存，避免一直用旧缓存导致 PWA 异常
var CACHE_NAME = 'xingyan-v1.7';
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// 安装: 预缓存核心资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // 核心资源缓存失败不阻塞安装
      return Promise.allSettled(
        CORE_ASSETS.map(function(url) {
          return cache.add(url);
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活: 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 请求拦截: 缓存优先,网络回退
self.addEventListener('fetch', function(event) {
  var request = event.request;
  // 仅处理 GET 请求
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  // 同源请求: 缓存优先
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(function(cached) {
        if (cached) {
          // 后台更新缓存
          fetch(request).then(function(resp) {
            if (resp && resp.status === 200) {
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(request, resp.clone());
              });
            }
          }).catch(function() {});
          return cached;
        }
        // 无缓存: 从网络获取
        return fetch(request).then(function(resp) {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            var clone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, clone);
            });
          }
          return resp;
        }).catch(function() {
          // 离线且无缓存: 返回主页
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
  // 跨域请求: 直接走网络
});

// 消息: 接收前端刷新指令
self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(function() {
      event.source && event.source.postMessage && event.source.postMessage('cacheCleared');
    });
  }
});
