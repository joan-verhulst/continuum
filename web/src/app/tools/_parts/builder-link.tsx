'use client';

import { Button } from 'continuum';
import { useEffect, useSyncExternalStore } from 'react';
import { themeBuilderLink } from '@/lib/site';

/*
 * The way from a tool into the builder. A tool with a colour (the palette generators, the theme
 * generator) shares it here while it is on the page, and the page's button takes it along, so the
 * builder starts from the colour the reader was looking at.
 */

let shared: string | undefined;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const share = (accent: string | undefined) => {
    shared = accent;
    for (const listener of listeners) listener();
};

/** Shares a tool's colour with the page's way into the builder, for as long as the tool is shown. */
export const useShareAccent = (accent: string) => {
    useEffect(() => share(accent), [accent]);
    useEffect(() => () => share(undefined), []);
};

/** The page's one primary: into the builder, with the tool's colour when it has one. */
export const OpenBuilder = () => {
    const accent = useSyncExternalStore(
        subscribe,
        () => shared,
        () => undefined,
    );
    return (
        <Button
            // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
            render={<a href={themeBuilderLink(accent)} />}
            size="lg"
        >
            Open the theme builder
        </Button>
    );
};
