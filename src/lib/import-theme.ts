import { linearSrgbToOklch, type Oklch, oklchToHex, type RampStep } from './color';
import { type ThemeOptions, themeFontFamilies } from './create-theme';

/*
 * A theme a project already has, read into Continuum's choices: a Tailwind v4 `@theme` block, a
 * shadcn/ui `globals.css`, or any stylesheet of custom properties in those names. What it reads:
 * the primary colour, how grey the greys are, the font and the corners. Everything else stays
 * Continuum's own, so the result is a starting point to adjust in the builder, not a copy.
 */

export type ImportedTheme = {
    /** The choices read from it; empty when nothing was recognised. */
    options: ThemeOptions;
    /** What each choice was read from, in words, for saying what was taken: "primary: --color-brand-600". */
    found: { option: keyof ThemeOptions; from: string }[];
};

/** Every custom property and its first value: the light theme comes before `.dark` in these files. */
const declarations = (css: string) => {
    const values = new Map<string, string>();
    // Comments out, strings kept: a path such as '../views/*.blade.php' is not a comment's start.
    const clean = css.replace(
        /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\//g,
        (_, text?: string) => text ?? '',
    );
    for (const match of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
        const [, name, value] = match;
        if (name && value && !values.has(name)) values.set(name, value.trim());
    }
    return values;
};

/** A value with its `var()`s filled in from the same sheet, a few levels deep. */
const resolve = (value: string, values: Map<string, string>, depth = 0): string =>
    depth > 8
        ? value
        : value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name: string, fallback) => {
              const next = values.get(name) ?? fallback;
              return next ? resolve(next, values, depth + 1) : '';
          });

const toLinear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const fromRgb = (r: number, g: number, b: number): Oklch =>
    linearSrgbToOklch([toLinear(r), toLinear(g), toLinear(b)]);

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0), f(8), f(4)];
};

/** A number, a percentage of `whole` when it ends in %. */
const amount = (text: string, whole: number) =>
    text.endsWith('%') ? (Number.parseFloat(text) / 100) * whole : Number.parseFloat(text);

/**
 * A CSS colour as oklch: hex, rgb(), hsl(), oklch(), and shadcn's bare HSL ("222 47% 11%").
 * Null for anything else (a keyword, a gradient, a colour-mix).
 */
export const parseCssColor = (input: string): Oklch | null => {
    const value = input.trim().toLowerCase();
    const hex = /^#([0-9a-f]{3,8})$/.exec(value)?.[1];
    if (hex) {
        const full =
            hex.length <= 4 ? [...hex.slice(0, 3)].map(d => d + d).join('') : hex.slice(0, 6);
        const n = Number.parseInt(full, 16);
        return fromRgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    }
    const fn = /^(rgba?|hsla?|oklch)\(\s*([^)]*)\)$/.exec(value);
    const bare = /^(-?[\d.]+)(?:deg)?\s+([\d.]+%)\s+([\d.]+%)$/.exec(value);
    const parts = fn?.[2]
        ? fn[2]
              .split(/[\s,/]+/)
              .filter(Boolean)
              .slice(0, 3)
        : bare
          ? bare.slice(1, 4)
          : null;
    if (!parts || parts.length < 3) return null;
    const [a = '', b = '', c = ''] = parts;
    const kind = fn?.[1] ?? 'hsl';
    if (kind.startsWith('rgb'))
        return fromRgb(amount(a, 255) / 255, amount(b, 255) / 255, amount(c, 255) / 255);
    if (kind.startsWith('hsl'))
        return fromRgb(
            ...hslToRgb(
                Number.parseFloat(a),
                amount(b, 1) / (b.endsWith('%') ? 1 : 100),
                amount(c, 1) / (c.endsWith('%') ? 1 : 100),
            ),
        );
    // oklch(L C H): L as a share or a percentage, C as a number or a percentage of 0.4.
    const l = amount(a, 1);
    const color = { l: l > 1 ? l / 100 : l, c: amount(b, 0.4), h: Number.parseFloat(c) || 0 };
    return Number.isNaN(color.l) || Number.isNaN(color.c) ? null : color;
};

/** One length in px: px, rem and em (at 16px), or a bare number of px. */
const lengthPx = (value: string) => {
    const match = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
    if (!match?.[1]) return null;
    const n = Number.parseFloat(match[1]);
    return match[2] === 'rem' || match[2] === 'em' ? n * 16 : n;
};

/** A length in px, a `calc()` of lengths added and taken away included ("calc(0.5rem - 2px)"). */
const toPx = (value: string) => {
    const inner = /^calc\((.*)\)$/.exec(value.trim())?.[1] ?? value;
    // Terms and the signs between them: ["0.5rem", "-", "2px"].
    const parts = inner.split(/\s+([+-])\s+/);
    let total = 0;
    for (let i = 0; i < parts.length; i += 2) {
        const px = lengthPx(parts[i] ?? '');
        if (px === null) return null;
        total += parts[i - 1] === '-' ? -px : px;
    }
    return total;
};

/** The colour a name holds, or null. */
const colorOf = (values: Map<string, string>, name: string) => {
    const raw = values.get(name);
    return raw ? parseCssColor(resolve(raw, values)) : null;
};

/**
 * The ramp step a name stands for, followed through its `var()`s: shadcn's `--primary` is often
 * `var(--color-primary-600)`, and that step is the product's own colour.
 */
const rampStepOf = (values: Map<string, string>, name: string) => {
    let current = name;
    for (let depth = 0; depth < 8; depth++) {
        const step = /^--color-[\w-]+-(\d{2,3})$/.exec(current)?.[1];
        if (step) return { name: current, step };
        const next = /^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(
            values.get(current)?.trim() ?? '',
        )?.[1];
        if (!next) return null;
        current = next;
    }
    return null;
};

/** The semantic names a primary goes by, then the ramps a brand colour sits on. */
const semanticAccent = ['--color-primary', '--primary', '--color-brand', '--brand'];
const accentRamps = ['--color-primary', '--color-brand', '--color-accent'];
const greyRamps = [
    '--color-neutral',
    '--color-gray',
    '--color-grey',
    '--color-slate',
    '--color-zinc',
    '--color-stone',
    '--color-mauve',
    '--color-sage',
    '--color-olive',
    '--color-sand',
];
const allSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** Continuum's control corner as drawn, which a radius scale of 1 means. */
const CONTROL_RADIUS = 12;

/** Below this chroma a colour reads as grey. */
const GREY = 0.04;

/**
 * Reads a Tailwind or shadcn theme's stylesheet into Continuum's theme choices: the primary from
 * its primary or brand colour (a grey one fills the action in neutral), the greys' hue and tint
 * from its grey ramp, the font from `--font-sans`, and the corner scale from its radius.
 */
export const themeFromCss = (css: string): ImportedTheme => {
    const values = declarations(css);
    const options: ThemeOptions = {};
    const found: ImportedTheme['found'] = [];

    // The primary as the product names it, then a step of a brand ramp when that name is grey.
    const named = semanticAccent
        .map(name => ({ name, color: colorOf(values, name) }))
        .find(item => item.color);
    const fromRamp = () => {
        for (const ramp of accentRamps)
            for (const step of ['600', '500', '700', '400']) {
                const color = colorOf(values, `${ramp}-${step}`);
                if (color && color.c >= GREY) return { name: `${ramp}-${step}`, color };
            }
        return null;
    };
    const chromatic = named?.color && named.color.c >= GREY ? named : fromRamp();
    if (chromatic?.color) {
        options.accent = oklchToHex(chromatic.color);
        options.action = named?.color && named.color.c < GREY ? 'neutral' : 'accent';
        const step = rampStepOf(values, chromatic.name)?.step;
        if (step && (allSteps as readonly string[]).includes(step))
            options.accentStep = step as RampStep;
        found.push({
            option: 'accent',
            from: rampStepOf(values, chromatic.name)?.name ?? chromatic.name,
        });
        if (options.action === 'neutral')
            found.push({ option: 'action', from: `${named?.name}, a grey` });
    } else if (named?.color) {
        // A near-black primary and no brand colour, as shadcn's default: the action keeps to the greys.
        options.action = 'neutral';
        found.push({ option: 'action', from: `${named.name}, a grey` });
    }

    // The greys: the most tinted step of the grey ramp sets how grey they are, since many ramps
    // keep their middle pure and tint only the dark end; shadcn's muted text without a ramp.
    const greys = greyRamps
        .map(ramp =>
            allSteps
                .map(step => ({
                    name: `${ramp}-${step}`,
                    color: colorOf(values, `${ramp}-${step}`),
                }))
                .filter(item => item.color),
        )
        .find(ramp => ramp.length >= 3);
    const grey =
        greys?.reduce((most, item) =>
            (item.color?.c ?? 0) > (most.color?.c ?? 0) ? item : most,
        ) ??
        ['--color-muted-foreground', '--muted-foreground']
            .map(name => ({ name, color: colorOf(values, name) }))
            .find(item => item.color);
    if (grey?.color) {
        const tint = Math.min(0.03, Number(grey.color.c.toFixed(3)));
        options.neutral =
            tint < 0.002 ? { hue: 0, tint: 0 } : { hue: Math.round(grey.color.h), tint };
        found.push({ option: 'neutral', from: greys ? grey.name.replace(/-\d+$/, '') : grey.name });
    }

    const fontName = [
        '--font-sans',
        '--font-family-sans',
        '--font-body',
        '--default-font-family',
    ].find(name => values.has(name));
    const family = fontName
        ? resolve(values.get(fontName) ?? '', values)
              .split(',')[0]
              ?.trim()
              .replace(/^['"]|['"]$/g, '')
              .replace(/\s+Variable$/i, '')
        : undefined;
    if (
        fontName &&
        family &&
        !/^(ui-sans-serif|system-ui|sans-serif|-apple-system)$/i.test(family)
    ) {
        const known = Object.entries(themeFontFamilies).find(
            ([, font]) => font.family.toLowerCase() === family.toLowerCase(),
        )?.[0];
        options.font = known ?? family;
        found.push({ option: 'font', from: fontName });
    }

    // A control's corner: Tailwind's md, or shadcn's --radius less the 2px its controls take off.
    const radiusName = ['--radius-md', '--radius', '--radius-lg'].find(name => values.has(name));
    const radiusPx = radiusName ? toPx(resolve(values.get(radiusName) ?? '', values)) : null;
    if (radiusName && radiusPx !== null) {
        const control = radiusName === '--radius' ? Math.max(0, radiusPx - 2) : radiusPx;
        options.radius = Math.min(1.5, Math.round((control / CONTROL_RADIUS) * 20) / 20);
        found.push({ option: 'radius', from: radiusName });
    }

    return { options, found };
};
