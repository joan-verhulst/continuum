import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { isSidebarStandalone, SidebarStandalone } from './lab/sidebar';
import { isRasterStandalone, RasterStandalone } from './raster/lab';
// Imported here rather than in styles.css so Vite resolves the font files.
import '@fontsource-variable/geist';
import '@fontsource-variable/inter';
import './styles.css';

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <StrictMode>
            {/* A raster screen opened from the lab in its own tab */}
            {/* The sidebar demo, on a plain page outside the playground */}
            {isRasterStandalone() ? (
                <RasterStandalone />
            ) : isSidebarStandalone() ? (
                <SidebarStandalone />
            ) : (
                <App />
            )}
        </StrictMode>,
    );
}
