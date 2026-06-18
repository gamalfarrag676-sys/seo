// WooCommerce Dynamic Proxy Plugin for Vite
// This creates a server middleware that proxies requests to the user's WooCommerce store

import type { Plugin } from 'vite';

export function wooCommerceProxy(): Plugin {
    return {
        name: 'woocommerce-proxy',
        configureServer(server) {
            // Middleware to handle /api/wc/* requests
            server.middlewares.use('/api/wc', async (req, res, _next) => {
                try {
                    // Get the target URL from query parameter or header
                    const targetUrl = req.headers['x-wc-store-url'] as string;
                    const authHeader = req.headers['authorization'] as string;

                    if (!targetUrl) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Missing X-WC-Store-URL header' }));
                        return;
                    }

                    // Build the full API URL
                    // Remove /api/wc prefix and append to target
                    const apiPath = req.url?.replace(/^\/api\/wc/, '') || '';
                    const fullUrl = `${targetUrl.replace(/\/$/, '')}/wp-json/wc/v3${apiPath}`;

                    console.log(`[WC Proxy] Proxying to: ${fullUrl}`);

                    // Make the request to WooCommerce
                    const response = await fetch(fullUrl, {
                        method: req.method || 'GET',
                        headers: {
                            'Authorization': authHeader || '',
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                    });

                    // Forward the response
                    const data = await response.text();

                    res.statusCode = response.status;
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(data);

                } catch (error: any) {
                    console.error('[WC Proxy] Error:', error.message);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        error: error.message || 'Proxy request failed',
                        code: 'PROXY_ERROR'
                    }));
                }
            });

            // Handle CORS preflight
            server.middlewares.use('/api/wc', (req, res, next) => {
                if (req.method === 'OPTIONS') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WC-Store-URL');
                    res.statusCode = 200;
                    res.end();
                    return;
                }
                next();
            });
        }
    };
}
