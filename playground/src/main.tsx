import { themeFontFamilies } from '@contui/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { AvatarsStandalone, isAvatarsStandalone } from './lab/avatars';
import { GroupingStandalone, isGroupingStandalone } from './lab/grouping';
import { isSidebarStandalone, SidebarStandalone } from './lab/sidebar';
import { isTopNavStandalone, TopNavStandalone } from './lab/top-nav';
import { isRasterStandalone, RasterStandalone } from './raster/lab';
// Imported here rather than in styles.css so Vite resolves the font files.
import '@fontsource-variable/geist';
import '@fontsource-variable/inter';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/figtree';
import './styles.css';

/*
 * A font's files only download once some text asks for it, so a theme in another font showed the
 * system font for a few seconds after switching. Fetch every theme font's Latin file once the page
 * has loaded, so the switch finds it in the cache.
 */
const warmFonts = () => {
    if (!('fonts' in document)) return;
    for (const { family } of Object.values(themeFontFamilies)) {
        document.fonts.load(`400 1em "${family} Variable"`, 'Aa').catch(() => {});
    }
};
if (document.readyState === 'complete') warmFonts();
else window.addEventListener('load', warmFonts, { once: true });

const root = document.getElementById('root');

if (root) {
    createRoot(root).render(
        <StrictMode>
            {/* A raster screen opened from the lab in its own tab */}
            {/* The sidebar demo, on a plain page outside the playground */}
            {isRasterStandalone() ? (
                <RasterStandalone />
            ) : isAvatarsStandalone() ? (
                <AvatarsStandalone />
            ) : isGroupingStandalone() ? (
                <GroupingStandalone />
            ) : isSidebarStandalone() ? (
                <SidebarStandalone />
            ) : isTopNavStandalone() ? (
                <TopNavStandalone />
            ) : (
                <App />
            )}
        </StrictMode>,
    );
}
