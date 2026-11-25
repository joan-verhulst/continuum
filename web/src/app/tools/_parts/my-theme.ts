'use client';

import type { ThemeOptions } from '@contui/ui';
import { useEffect, useRef, useState } from 'react';
import { load } from '../theme-builder/state';

/*
 * "My theme": a tool filled from the theme made in the theme builder. On the builder's own page the
 * theme is handed over as it is being made; on a tool's page it is the one the builder keeps in
 * this browser (the default theme while none has been made). While linked, the tool follows the
 * theme as it changes; typing colours of one's own lets go of it.
 */
export const useMyTheme = (
    /** The theme as it is being made, where the builder is on the page. */
    live: ThemeOptions | undefined,
    fill: (theme: ThemeOptions) => void,
    /** Whether the tool starts out on the theme, or only once asked. */
    start = false,
) => {
    const [linked, setLinked] = useState(start);
    const filler = useRef(fill);
    filler.current = fill;

    useEffect(() => {
        if (linked) filler.current(live ?? load().theme);
    }, [linked, live]);

    return {
        linked,
        use: () => setLinked(true),
        unlink: () => setLinked(false),
    };
};
