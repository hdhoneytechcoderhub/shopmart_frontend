// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import http from 'node:http';
// import https from 'node:https';
// import path from 'path';
//
// // Backend the dev server proxies /api/* to. Override with VITE_API_TARGET.
// const API_TARGET = process.env.VITE_API_TARGET
//   || 'https://shopmart-backend-production.up.railway.app';
//
// // Quiet API proxy:
// // - Forwards /api/* to the backend (HTTP or HTTPS) during development, so the
// //   browser never hits CORS (the request is made server-side by Vite).
// // - If the backend is unreachable, it silently drops the connection so the app's
// //   demo-mode fallback kicks in, without flooding the terminal with stack traces.
// function quietApiProxy(target) {
//   const url = new URL(target);
//   const isHttps = url.protocol === 'https:';
//   const lib = isHttps ? https : http;
//   const port = url.port || (isHttps ? 443 : 80);
//   return {
//     name: 'quiet-api-proxy',
//     configureServer(server) {
//       server.middlewares.use('/api', (req, res) => {
//         const proxyReq = lib.request(
//           {
//             protocol: url.protocol,
//             hostname: url.hostname,
//             port,
//             method: req.method,
//             path: req.originalUrl,
//             headers: { ...req.headers, host: url.host },
//             servername: url.hostname, // SNI for HTTPS targets
//           },
//           (proxyRes) => {
//             res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
//             proxyRes.pipe(res);
//           },
//         );
//         proxyReq.on('error', () => { try { res.destroy(); } catch { /* noop */ } });
//         req.pipe(proxyReq);
//       });
//     },
//   };
// }
//
// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react(), quietApiProxy(API_TARGET)],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   server: {
//     port: 5173,
//   },
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import https from 'node:https';
import path from 'path';

// Local Spring Boot Backend
const API_TARGET =
    process.env.VITE_API_TARGET ||
    'http://localhost:8080';

function quietApiProxy(target) {
    const url = new URL(target);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = url.port || (isHttps ? 443 : 80);

    return {
        name: 'quiet-api-proxy',
        configureServer(server) {
            server.middlewares.use('/api', (req, res) => {
                const proxyReq = lib.request(
                    {
                        protocol: url.protocol,
                        hostname: url.hostname,
                        port,
                        method: req.method,
                        path: req.originalUrl,
                        headers: {
                            ...req.headers,
                            host: url.host,
                        },
                    },
                    (proxyRes) => {
                        res.writeHead(
                            proxyRes.statusCode || 502,
                            proxyRes.headers
                        );
                        proxyRes.pipe(res);
                    }
                );

                proxyReq.on('error', (err) => {
                    console.error('Proxy Error:', err.message);
                    try {
                        res.writeHead(502);
                        res.end('Backend Server Not Running');
                    } catch {}
                });

                req.pipe(proxyReq);
            });
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        quietApiProxy(API_TARGET),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },

    server: {
        port: 5173,
        host: true,
    },
});
