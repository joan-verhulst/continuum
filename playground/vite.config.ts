import react from '@vitejs/plugin-react';
import tencil from 'tencil/vite';
import { defineConfig, type Plugin } from 'vite';

/*
 * The playground is the app, and it lives at /app on the site: in dev the site (localhost:3100)
 * passes /app through to this server, in a build its files go into the site's own /app. Its pages
 * are # links, so nothing else needs to know the path. Hot reload connects to this port directly,
 * since the site's server passes pages through but not the reload socket.
 */
/**
 * Next's pass-through writes a bare query flag with an equals sign (`?raw` arrives as `?raw=`), and
 * Vite reads only the bare form for its own flags (raw, import, url). Put them back as they were.
 */
const bareQueryFlags = (): Plugin => ({
    name: 'bare-query-flags',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            if (req.url?.includes('=')) req.url = req.url.replace(/([?&][\w-]+)=(?=&|$)/g, '$1');
            next();
        });
    },
});

export default defineConfig({
    base: '/app/',
    plugins: [bareQueryFlags(), react(), tencil()],
    server: {
        port: 5173,
        strictPort: true,
        hmr: { clientPort: 5173 },
    },
});
