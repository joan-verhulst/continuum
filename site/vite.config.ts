import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tencil from 'tencil/vite';
import { defineConfig } from 'vite';

// The marketing site: its own app beside the playground, on the same library and styles; the
// playground's screens are the product shots, used live through an alias.
export default defineConfig({
    plugins: [react(), tencil()],
    resolve: {
        alias: {
            '@screens': fileURLToPath(new URL('../playground/src/screens', import.meta.url)),
            '@playground': fileURLToPath(new URL('../playground/src', import.meta.url)),
        },
    },
    server: { port: 5180 },
});
