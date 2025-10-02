// Service Worker para Automation AI Advisor
const CACHE_NAME = 'automation-ai-advisor-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Arquivos para cache estático
const STATIC_FILES = [
    '/',
    '/static/css/style.css',
    '/static/js/dashboard.js',
    '/static/js/notifications.js',
    '/static/js/kanban.js',
    '/static/js/roi.js',
    '/static/js/recommendations.js',
    '/static/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Cacheando arquivos estáticos');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Instalação concluída');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Erro na instalação:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Ativação concluída');
                return self.clients.claim();
            })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Estratégia para diferentes tipos de requisições
    if (request.method === 'GET') {
        // Arquivos estáticos - Cache First
        if (STATIC_FILES.includes(url.pathname) || 
            url.pathname.startsWith('/static/') ||
            url.hostname === 'cdn.jsdelivr.net') {
            event.respondWith(cacheFirst(request));
        }
        // APIs - Network First com fallback
        else if (url.pathname.startsWith('/api/')) {
            event.respondWith(networkFirst(request));
        }
        // Páginas HTML - Network First
        else if (request.headers.get('accept').includes('text/html')) {
            event.respondWith(networkFirst(request));
        }
        // Outros recursos - Stale While Revalidate
        else {
            event.respondWith(staleWhileRevalidate(request));
        }
    }
});

// Estratégia Cache First
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache First error:', error);
        return new Response('Recurso não disponível offline', { status: 503 });
    }
}

// Estratégia Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Network First: Tentando cache...');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para APIs
        if (request.url.includes('/api/')) {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Serviço indisponível offline'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Fallback para páginas
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - Automation AI Advisor</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-message { max-width: 500px; margin: 0 auto; }
                    .btn { padding: 10px 20px; background: #0d6efd; color: white; border: none; border-radius: 5px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <h1>🔌 Modo Offline</h1>
                    <p>Você está offline. Algumas funcionalidades podem estar limitadas.</p>
                    <button class="btn" onclick="window.location.reload()">Tentar Novamente</button>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Sincronização em background
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Sincronização em background');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Aqui você pode implementar sincronização de dados offline
        console.log('Executando sincronização em background...');
        
        // Exemplo: sincronizar dados de projetos pendentes
        const pendingData = await getPendingData();
        if (pendingData.length > 0) {
            await syncPendingData(pendingData);
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

async function getPendingData() {
    // Implementar lógica para obter dados pendentes
    return [];
}

async function syncPendingData(data) {
    // Implementar lógica para sincronizar dados
    console.log('Sincronizando dados pendentes:', data);
}

// Notificações push
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification recebida');
    
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação do Automation AI Advisor',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver Detalhes',
                icon: '/static/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/static/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Automation AI Advisor', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Clique em notificação');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Apenas fechar a notificação
    } else {
        // Clique no corpo da notificação
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
    console.log('Service Worker: Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});
