import { readFile } from 'node:fs/promises';
import { deltaE, hexToOklch, type Oklch, oklchToHex, toHex } from 'continuum';
import { parseColor } from '../../../playground/src/theme-editor/checks';
import { exportTheme, tailwindEntry } from '../../../playground/src/theme-export';
import type { Mode } from '../types';

/*
 * The system's values as numbers, read off an app.css: the file the theme builder exports, which
 * holds the whole look in Tailwind's names, light in @theme and dark under [data-mode="dark"]. The
 * default theme is the same file written for Continuum's own options, so a project's theme and
 * the default are read the same way, and every check runs against the theme the project ships.
 */

export type ColourToken = {
    /** Tailwind's name, without the prefix: 'neutral-200', 'action', 'error-600'. */
    name: string;
    /** The variable: '--color-neutral-200'. */
    variable: string;
    hex: string;
    /** 1 for a solid colour; a wash (selected, tint) is its colour at a share of opacity. */
    alpha: number;
    oklch: Oklch;
};

export type SizeToken = { name: string; variable: string; px: number };

export type SystemValues = {
    /** 'Continuum', or where the theme came from. */
    label: string;
    colours: Record<Mode, ColourToken[]>;
    /** chip 6 · item 10 · control 12 · card 16 · panel 20 · dock · pill. */
    radii: SizeToken[];
    /** xxs 11 · xs 13 (the base) · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 …, with line heights. */
    text: Array<SizeToken & { lineHeight?: number }>;
    /** The two weights: 400 and 500. */
    weights: number[];
    /** Named sizes from --spacing-*: control 34, control-lg 38, control-sm 28, table-row 41, sidebar 256 … */
    sizes: SizeToken[];
    /** The spacing unit in px: p-1 is one unit. */
    unit: number;
    fontFamily: string;
    trackingPx: number;
    lineHeight: number;
    /** The roles foundations names, each a colour token's name. */
    roles: Record<string, string>;
    /** The app.css the values were read from. */
    css: string;
};

/** The roles in foundations.md › Colour › Roles: what each step of the neutral ramp is for. */
export const roles: Record<string, string> = {
    surface: 'neutral-50',
    canvas: 'neutral-100',
    hairline: 'neutral-200',
    'unchecked control border': 'neutral-300',
    'focus ring, control border': 'neutral-500',
    'secondary text (hints, placeholders, helper text)': 'neutral-600',
    'meta text': 'neutral-700',
    'primary text': 'neutral-950',
    action: 'action',
    'text on action': 'on-action',
    selection: 'selected',
};

/** The role a token plays, for a finding's wording: 'neutral-200 (hairline)'. */
export const roleOf = (name: string) =>
    Object.entries(roles).find(([, token]) => token === name)?.[0];

export const describeToken = (name: string) => {
    const role = roleOf(name);
    return role ? `${name} (${role})` : name;
};

/* ---------- Reading an app.css ---------- */

/** The custom properties in the first block whose head matches, comments dropped. */
const block = (css: string, head: RegExp) => {
    const values = new Map<string, string>();
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const match = head.exec(clean);
    if (!match) return values;
    let depth = 0;
    let start = clean.indexOf('{', match.index);
    let end = start;
    for (let i = start; i < clean.length; i++) {
        if (clean[i] === '{') depth++;
        if (clean[i] === '}') depth--;
        if (depth === 0) {
            end = i;
            break;
        }
    }
    start += 1;
    for (const part of clean.slice(start, end).split(';')) {
        const colon = part.indexOf(':');
        if (colon < 0) continue;
        const name = part.slice(0, colon).trim().replace(/\\/g, '');
        if (!name.startsWith('--')) continue;
        values.set(
            name,
            part
                .slice(colon + 1)
                .replace(/\s+/g, ' ')
                .trim(),
        );
    }
    return values;
};

/**
 * A length as px: '34px', 'round(nearest, 34px, 1px)', 'calc(round(nearest, 34px, 1px) - 6px)',
 * '0.75rem'. Null when it is not a length.
 */
export const toPx = (value: string | undefined): number | null => {
    if (!value) return null;
    let text = value.trim();
    text = text.replace(/round\(\s*nearest\s*,\s*([\d.]+)px\s*,\s*1px\s*\)/g, (_, px) =>
        String(Math.round(Number(px))),
    );
    text = text.replace(/([\d.]+)rem/g, (_, rem) => String(Number(rem) * 16));
    text = text.replace(/([\d.]+)px/g, '$1');
    const calc = /^calc\(\s*([\d.]+)\s*([+\-*/])\s*([\d.]+)\s*\)$/.exec(text);
    if (calc) {
        const a = Number(calc[1]);
        const b = Number(calc[3]);
        const op = calc[2];
        return op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
    }
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
};

/**
 * Any colour a browser, a canvas or a stylesheet writes, as hex and opacity: #rgb, #rrggbb,
 * #rrggbbaa, rgb()/rgba() in comma or space syntax, oklch(), color-mix(… transparent),
 * a few names. Null when it cannot be read.
 */
export const readColour = (value: string | undefined): { hex: string; alpha: number } | null => {
    if (!value) return null;
    const text = value.trim().toLowerCase();
    if (text === 'transparent' || text === 'none') return { hex: '#000000', alpha: 0 };
    if (text === 'white') return { hex: '#ffffff', alpha: 1 };
    if (text === 'black') return { hex: '#000000', alpha: 1 };
    const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text);
    if (hex?.[1]) {
        const digits =
            hex[1].length <= 4 ? [...hex[1]].map(digit => digit + digit).join('') : hex[1];
        const alpha = digits.length === 8 ? Number.parseInt(digits.slice(6), 16) / 255 : 1;
        return { hex: `#${digits.slice(0, 6)}`, alpha };
    }
    const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
    if (rgb?.[1]) {
        const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
        const channel = (part = '0') =>
            part.endsWith('%') ? Number.parseFloat(part) / 100 : Number(part) / 255;
        const alphaPart = parts[3];
        const alpha =
            alphaPart === undefined
                ? 1
                : alphaPart.endsWith('%')
                  ? Number.parseFloat(alphaPart) / 100
                  : Number(alphaPart);
        return {
            hex: toHex([channel(parts[0]), channel(parts[1]), channel(parts[2])]),
            alpha,
        };
    }
    const paint = parseColor(value.trim());
    if (paint) return { hex: oklchToHex(paint.color), alpha: paint.alpha };
    return null;
};

const colourTokens = (values: Map<string, string>) => {
    const tokens: ColourToken[] = [];
    for (const [variable, value] of values) {
        if (!variable.startsWith('--color-') || variable.startsWith('--color-chart-')) continue;
        const colour = readColour(value);
        if (!colour || colour.alpha === 0) continue;
        const oklch = hexToOklch(colour.hex);
        if (!oklch) continue;
        tokens.push({
            name: variable.slice('--color-'.length),
            variable,
            hex: colour.hex,
            alpha: Number(colour.alpha.toFixed(3)),
            oklch,
        });
    }
    return tokens;
};

const sizeTokens = (values: Map<string, string>, prefix: string) => {
    const tokens: SizeToken[] = [];
    for (const [variable, value] of values) {
        if (!variable.startsWith(prefix) || variable.includes('--line-height')) continue;
        const name = variable.slice(prefix.length);
        // The fractional spacing steps (--spacing-2.5) are the scale, not named sizes.
        if (prefix === '--spacing-' && /^[\d.]+$/.test(name)) continue;
        const px = toPx(value);
        if (px !== null) tokens.push({ name, variable, px });
    }
    return tokens;
};

/** Reads an app.css (the theme builder's export, or any file in its names) into numbers. */
export const systemFromCss = (css: string, label: string): SystemValues => {
    const light = block(css, /@theme\b[^{]*\{/);
    const darkOverrides = block(css, /\[data-mode="dark"\]\s*\{/);
    const dark = new Map([...light, ...darkOverrides]);
    const text = sizeTokens(light, '--text-').map(token => ({
        ...token,
        lineHeight: toPx(light.get(`${token.variable}--line-height`)) ?? undefined,
    }));
    return {
        label,
        colours: { light: colourTokens(light), dark: colourTokens(dark) },
        radii: sizeTokens(light, '--radius-'),
        text,
        weights: [400, 500],
        sizes: sizeTokens(light, '--spacing-'),
        unit: toPx(light.get('--spacing')) ?? 4,
        fontFamily: light.get('--font-sans') ?? 'Geist',
        trackingPx: toPx(light.get('--tracking-normal')) ?? 0.32,
        lineHeight: Number(light.get('--leading-normal') ?? 1.25),
        roles,
        css,
    };
};

let defaultValues: SystemValues | undefined;

/** Continuum's default theme, as the builder would export it. */
export const defaultSystem = () => {
    defaultValues ??= systemFromCss(
        tailwindEntry(exportTheme({}, 'Continuum', 'light')),
        'Continuum',
    );
    return defaultValues;
};

/**
 * The theme a tool was given: empty for the default, a path to an app.css, or the CSS itself.
 */
export const loadSystem = async (theme?: string): Promise<SystemValues> => {
    if (!theme?.trim()) return defaultSystem();
    if (theme.includes('{')) return systemFromCss(theme, 'the given app.css');
    const css = await readFile(theme.trim(), 'utf8');
    return systemFromCss(css, theme.trim());
};

/* ---------- Matching ---------- */

export type ColourMatch = { token: ColourToken; distance: number };

/**
 * The token a colour is nearest, by how far apart they look (OKLab ΔE × 100). Solid tokens only,
 * unless the colour itself is translucent. Distance under 2 is the same colour; under 6 close
 * enough to snap; past 12 a colour of its own (a brand colour, a chart's), to ask about.
 */
export const nearestColour = (
    system: SystemValues,
    mode: Mode,
    value: string,
): ColourMatch | null => {
    const colour = readColour(value);
    if (!colour) return null;
    const oklch = hexToOklch(colour.hex);
    if (!oklch) return null;
    const translucent = colour.alpha < 0.99;
    let best: ColourMatch | null = null;
    for (const token of system.colours[mode]) {
        if (translucent !== token.alpha < 0.99) continue;
        const distance =
            deltaE(oklch, token.oklch) +
            (translucent ? Math.abs(colour.alpha - token.alpha) * 100 : 0);
        if (!best || distance < best.distance) best = { token, distance };
    }
    return best;
};

/** The nearest named size of a kind, by px: nearestSize(system.radii, 8) → item 10 or chip 6. */
export const nearestSize = <T extends SizeToken>(tokens: T[], px: number) =>
    tokens.reduce<T | undefined>(
        (best, token) => (!best || Math.abs(token.px - px) < Math.abs(best.px - px) ? token : best),
        undefined,
    );

/** A value on the spacing scale: the nearest multiple of half a unit at 4 and under, of a unit above. */
export const snapSpacing = (system: SystemValues, px: number) => {
    const step = px <= system.unit * 4 ? system.unit / 2 : system.unit;
    return Math.round(px / step) * step;
};
