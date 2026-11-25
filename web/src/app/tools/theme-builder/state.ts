import type { ThemeOptions } from '@contui/ui';
import { sameTheme } from '@playground/projects';

/*
 * Where the site keeps the theme a reader is making: this browser's storage, under the key the
 * builder has always used, so a theme made before the page changed shape opens again. Every change
 * is kept as it is made; ⌘S only says so. The colour tool and the builder on the page both read it,
 * and the other tools take it when "Use my theme" is pressed (tools/_parts/my-theme). A colour in
 * the address (`?accent=%23ffa31a`, a tool's way in) starts a fresh theme from it, or comes in over
 * a theme already made.
 */

/** Where the site keeps the theme: as made, and the project in the app it was sent on to. */
export const STORAGE_KEY = 'contui-theme-builder';

export type Stored = {
    theme: ThemeOptions;
    /** The furthest step of the builder reached, so it opens where it was left. */
    progress: number;
    /** The project in the app it was sent on to, and the theme as sent, so the next send updates it. */
    sent?: { project: string; theme: ThemeOptions };
};

const empty: Stored = { theme: {}, progress: 0 };

export const load = (): Stored => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : undefined;
        if (!parsed || typeof parsed !== 'object') return empty;
        const { theme, progress, sent } = parsed as Partial<Stored>;
        return {
            theme: theme && typeof theme === 'object' ? theme : {},
            progress: typeof progress === 'number' ? progress : 0,
            sent: sent && typeof sent.project === 'string' ? sent : undefined,
        };
    } catch {
        return empty;
    }
};

export const store = (value: Stored) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // Storage can be full or blocked; the theme still lives for this visit.
    }
};

/** A colour from the address, as the builder takes one, or none. */
const accentFromQuery = (): string | undefined => {
    const raw = new URLSearchParams(window.location.search).get('accent')?.trim();
    if (!raw) return undefined;
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex.toLowerCase() : undefined;
};

/** Drops the keys set to undefined, so untouched options compare equal to the defaults. */
export const compact = (options: ThemeOptions): ThemeOptions =>
    Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

/**
 * Reads the kept theme once, in the browser, with the address's colour laid over it: a fresh theme
 * from it while nothing has been made, the primary of the one made otherwise (its chart colours
 * found again from it, as picking a primary does). The address is cleaned, so a reload does not
 * bring the colour in again.
 */
export const begin = (): Stored => {
    const saved = load();
    const accent = accentFromQuery();
    if (!accent) return saved;
    const url = new URL(window.location.href);
    url.searchParams.delete('accent');
    window.history.replaceState(window.history.state, '', url);
    const theme = sameTheme(saved.theme, {})
        ? { accent }
        : compact({ ...saved.theme, accent, charts: undefined });
    const next = { ...saved, theme };
    store(next);
    return next;
};
