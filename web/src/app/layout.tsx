import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
// Every font a theme can pick (themeFontFamilies in continuum), so the landing's Customize and the
// site's theme builder show the one chosen rather than a system fallback.
import '@fontsource-variable/inter';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/figtree';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Tencil } from 'tencil/react';
import { SiteTheme } from '@/components/mode';
import { ModeScript } from '@/components/mode-script';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { rootMetadata } from '@/lib/seo';

export const metadata: Metadata = rootMetadata;

// The site opens dark (a reader may switch to light): the browser's chrome takes the dark canvas.
export const viewport: Viewport = { themeColor: '#0c0d0e' };

/**
 * Every page: the site's ContinuumUI theme, dark unless the reader chose light (set before the
 * first paint; the landing is always dark), with the site's one header and footer round it.
 */
const RootLayout = ({ children }: { children: ReactNode }) => (
    // <html> is a scope too, so the overscroll takes the canvas; the mode script sets its data-mode.
    <html
        className="continuum"
        data-mode="dark"
        data-theme="continuum-ui"
        lang="en"
        suppressHydrationWarning
    >
        <head>
            <ModeScript />
        </head>
        <body>
            <SiteTheme>
                <ModeScript />
                <SiteHeader />
                {children}
                <SiteFooter />
            </SiteTheme>
            {/* Tencil's overlay, for pinning fixes on the running site; renders nothing outside development. */}
            <Tencil />
        </body>
    </html>
);

export default RootLayout;
