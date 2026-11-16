'use client';

import { Theme } from 'continuum';
import type { ReactNode } from 'react';

/*
 * The site wears ContinuumUI; what it shows of the system does not. A preview, a screen or a
 * specimen opens Continuum's default theme inside the site's, so its corners and colours are the
 * values the spec beside it states. An empty theme names no block, so the default tokens apply; the
 * mode still follows the page's.
 */
export const DefaultTheme = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => (
    <Theme className={className} theme="">
        {children}
    </Theme>
);
