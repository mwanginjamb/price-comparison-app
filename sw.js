const CACHE_NAME = 'price-compare-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Add any additional resources you want to cache
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.log('Cache failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a stream
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // If both cache and network fail, return a fallback
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync for data persistence (when back online)
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);

    if (event.tag === 'price-data-sync') {
        event.waitUntil(
            // Your background sync logic here
            console.log('Syncing price data...')
        );
    }
});

// Push notifications (optional)
self.addEventListener('push', event => {
    console.log('Push message received:', event);

    const options = {
        body: 'Your price comparison data has been updated!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
            url: '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification('Price Compare', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});