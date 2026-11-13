import {
    chartHarmonies,
    defaultThemeOptions,
    hexToOklch,
    oklchToHex,
    parseHex,
    rampSteps,
    type ThemeOptions,
    tailwindGreys,
    tailwindHues,
    themeFontFamilies,
} from 'continuum';
import { heightChoices, presets, typeChoices, unitChoices } from '../../../playground/src/presets';
import { parseColor } from '../../../playground/src/theme-editor/checks';
import { ToolError } from '../support/tool';
import { roleOf, type SystemValues } from './values';

/*
 * The token set as other tools take it: plain CSS, flat JSON, W3C design tokens, a Paper payload
 * and a Figma variables payload, all read off the same app.css. The set is the part a screen is
 * drawn with (the roles, the five ramps, the corners, the type, the heights, the unit, the font),
 * not every variable the components read, so a canvas or another stack gets what it needs and
 * an agent pays for nothing else.
 */

export type TokenMode = 'light' | 'dark' | 'both';
export type TokenExtra = 'charts' | 'widths';

/** What a token is, in the words Paper's create_tokens uses; the other formats map from these. */
type Kind =
    | 'color'
    | 'radius'
    | 'fontSize'
    | 'lineHeight'
    | 'spacing'
    | 'fontWeight'
    | 'fontFamily'
    | 'letterSpacing';

type Token = {
    kind: Kind;
    /** The CSS variable: '--color-neutral-200'. */
    variable: string;
    /** The path a canvas names it by: ['color', 'neutral', '200']. */
    path: string[];
    /** The value as the app.css writes it, for light; for dark only when it differs. */
    light: string;
    dark?: string;
    /** A length or a number as a number: px for lengths. */
    number?: number;
    description?: string;
};

/* ---------- Reading the raw values ---------- */

/** The custom properties of every block whose head matches, later blocks winning. */
const declarations = (css: string, head: RegExp) => {
    const values = new Map<string, string>();
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of clean.matchAll(head)) {
        let start = clean.indexOf('{', match.index);
        let depth = 0;
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
            const name = part.slice(0, colon).trim();
            if (colon < 0 || !name.startsWith('--')) continue;
            values.set(
                name,
                part
                    .slice(colon + 1)
                    .replace(/\s+/g, ' ')
                    .trim(),
            );
        }
    }
    return values;
};

/** Light is @theme with :root; dark lays [data-mode="dark"] over it. */
const rawValues = (css: string) => {
    const light = new Map([
        ...declarations(css, /@theme\b[^{]*\{/g),
        ...declarations(css, /:root\s*\{/g),
    ]);
    const dark = declarations(css, /\[data-mode="dark"\]\s*\{/g);
    return { light, dark };
};

/** The first named family of a stack, without Fontsource's ' Variable': 'Geist'. */
export const familyName = (stack: string) => {
    const generic = /^(ui-sans-serif|system-ui|sans-serif|serif|monospace|ui-monospace)$/;
    // 'var(--font-inter, "Inter Variable"), "Inter", …': the var() reads as its fallback.
    const plain = stack.replace(/var\(\s*--[\w-]+\s*,?/g, '').replace(/\)/g, '');
    for (const part of plain.split(',')) {
        const name = part
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/ Variable$/, '');
        if (name && !generic.test(name)) return name;
    }
    return 'Geist';
};

/* ---------- The set ---------- */

const roleColours = ['action', 'action-hover', 'on-action', 'selected', 'tint', 'tint-fg', 'focus'];
const ramps = ['neutral', 'primary', 'success', 'warning', 'error'];
const textSizes = ['xxs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];
const heights = [
    'control-sm',
    'chip',
    'segment',
    'cell',
    'control',
    'control-lg',
    'row',
    'table-row',
    'control-xl',
    'header',
];
const widths = [
    'rail',
    'menu',
    'sidebar',
    'tooltip',
    'popover',
    'toast',
    'measure',
    'dialog',
    'sheet',
    'conversation',
];

const roleNotes: Record<string, string> = {
    action: 'The one action colour: the primary button, checked controls, the active rail item.',
    'action-hover': 'The action colour on hover.',
    'on-action': 'Text and icons on the action colour.',
    selected: 'The wash on what is current, selected or open (7%).',
    tint: 'A coloured selection wash, with tint-fg as its text.',
    'tint-fg': 'Text on the tint wash.',
    focus: 'The focus ring.',
};

/** The token set a theme's app.css writes, in the order a canvas wants it: roles, ramps, then sizes smallest first. */
export const collectTokens = (system: SystemValues, extras: readonly TokenExtra[] = []) => {
    const { light, dark } = rawValues(system.css);
    const tokens: Token[] = [];
    const colour = (name: string, path: string[], description?: string) => {
        const variable = `--color-${name}`;
        const value = light.get(variable);
        if (!value) return;
        const night = dark.get(variable);
        tokens.push({
            kind: 'color',
            variable,
            path,
            light: value,
            dark: night && night !== value ? night : undefined,
            description,
        });
    };
    for (const name of roleColours) colour(name, ['color', name], roleNotes[name]);
    for (const ramp of ramps) {
        for (const step of rampSteps) {
            const name = `${ramp}-${step}`;
            const role = ramp === 'neutral' ? roleOf(name) : undefined;
            colour(name, ['color', ramp, step], role ? `The ${role}.` : undefined);
        }
    }
    if (extras.includes('charts')) {
        for (const i of [1, 2, 3, 4, 5]) colour(`chart-${i}`, ['color', 'chart', String(i)]);
        for (const i of [1, 2, 3, 4, 5]) {
            colour(`chart-series-${i}`, ['color', 'chart-series', String(i)]);
        }
    }

    const length = (kind: Kind, variable: string, path: string[], px: number | undefined) => {
        if (px === undefined) return;
        tokens.push({ kind, variable, path, light: `${px}px`, number: px });
    };
    for (const radius of [...system.radii].sort((a, b) => a.px - b.px)) {
        length('radius', radius.variable, ['radius', radius.name], radius.px);
    }
    for (const name of textSizes) {
        const size = system.text.find(token => token.name === name);
        if (!size) continue;
        length('fontSize', size.variable, ['text', name], size.px);
    }
    for (const name of textSizes) {
        const size = system.text.find(token => token.name === name);
        length(
            'lineHeight',
            `--text-${name}--line-height`,
            ['line-height', name],
            size?.lineHeight,
        );
    }
    tokens.push({
        kind: 'lineHeight',
        variable: '--leading-normal',
        path: ['leading', 'normal'],
        light: String(system.lineHeight),
        number: system.lineHeight,
        description: 'Line height as a share of the type size.',
    });
    tokens.push({
        kind: 'letterSpacing',
        variable: '--tracking-normal',
        path: ['tracking', 'normal'],
        light: `${system.trackingPx}px`,
        number: system.trackingPx,
    });
    tokens.push({
        kind: 'spacing',
        variable: '--spacing',
        path: ['spacing', 'unit'],
        light: `${system.unit}px`,
        number: system.unit,
        description: 'The spacing unit: p-1 is one unit, gap-3 three.',
    });
    const named = (names: string[]) =>
        names
            .map(name => system.sizes.find(token => token.name === name))
            .filter(token => token !== undefined)
            .sort((a, b) => a.px - b.px);
    for (const size of named(heights)) {
        length('spacing', size.variable, ['size', size.name], size.px);
    }
    if (extras.includes('widths')) {
        for (const size of named(widths)) {
            length('spacing', size.variable, ['width', size.name], size.px);
        }
    }
    for (const [name, weight] of [
        ['normal', 400],
        ['medium', 500],
    ] as const) {
        tokens.push({
            kind: 'fontWeight',
            variable: `--font-weight-${name}`,
            path: ['font-weight', name],
            light: String(weight),
            number: weight,
        });
    }
    tokens.push({
        kind: 'fontFamily',
        variable: '--font-sans',
        path: ['font', 'sans'],
        light: familyName(system.fontFamily),
    });
    return tokens;
};

const valueIn = (token: Token, mode: 'light' | 'dark') =>
    mode === 'dark' ? (token.dark ?? token.light) : token.light;

/** The tokens one mode writes; with both, light in full and dark only where it differs. */
const forMode = (tokens: Token[], mode: 'light' | 'dark') =>
    tokens.map(token => [token.variable, valueIn(token, mode)] as const);

/* ---------- CSS and JSON ---------- */

export const toCss = (system: SystemValues, tokens: Token[], mode: TokenMode) => {
    const lines = (entries: (readonly [string, string])[]) =>
        entries.map(([name, value]) => `    ${name}: ${value};`).join('\n');
    const head = `/* ${system.label}: Continuum's tokens in Tailwind's names, values resolved. */`;
    if (mode !== 'both') return `${head}\n:root {\n${lines(forMode(tokens, mode))}\n}\n`;
    const dark = tokens
        .filter(token => token.dark)
        .map(token => [token.variable, token.dark ?? ''] as const);
    return `${head}\n:root {\n${lines(forMode(tokens, 'light'))}\n}\n\n[data-mode="dark"] {\n    color-scheme: dark;\n${lines(dark)}\n}\n`;
};

export const toJson = (tokens: Token[], mode: TokenMode) => {
    const flat = (entries: (readonly [string, string])[]) =>
        Object.fromEntries(entries.map(([name, value]) => [name.slice(2), value]));
    if (mode !== 'both') return { [mode]: flat(forMode(tokens, mode)) };
    return {
        light: flat(forMode(tokens, 'light')),
        dark: flat(
            tokens
                .filter(token => token.dark)
                .map(token => [token.variable, token.dark ?? ''] as const),
        ),
    };
};

/* ---------- W3C design tokens (Format Module 2025.10) ---------- */

/** A colour as DTCG writes it: oklch components, with the sRGB hex as the fallback it allows. */
const dtcgColour = (value: string) => {
    const paint = parseColor(value);
    if (!paint) return value;
    const { l, c, h } = paint.color;
    const colour: Record<string, unknown> = {
        colorSpace: 'oklch',
        components: [Number(l.toFixed(4)), Number(c.toFixed(4)), Number(h.toFixed(2))],
        hex: oklchToHex(paint.color),
    };
    if (paint.alpha < 1) colour.alpha = Number(paint.alpha.toFixed(3));
    return colour;
};

/** The DTCG group a token sits in, its $type, and its name within the group. */
const dtcgPlace = (token: Token): { group: string; type: string; path: string[] } => {
    const rest = token.path.slice(1);
    switch (token.kind) {
        case 'color':
            return { group: 'color', type: 'color', path: rest };
        case 'radius':
            return { group: 'radius', type: 'dimension', path: rest };
        case 'fontSize':
            return { group: 'fontSize', type: 'dimension', path: rest };
        case 'lineHeight':
            return token.path[0] === 'leading'
                ? { group: 'lineHeight', type: 'number', path: rest }
                : { group: 'lineHeight', type: 'dimension', path: rest };
        case 'letterSpacing':
            return { group: 'letterSpacing', type: 'dimension', path: rest };
        case 'spacing':
            return { group: 'dimension', type: 'dimension', path: token.path };
        case 'fontWeight':
            return { group: 'fontWeight', type: 'fontWeight', path: rest };
        case 'fontFamily':
            return { group: 'fontFamily', type: 'fontFamily', path: rest };
    }
};

const dtcgFile = (tokens: Token[], mode: 'light' | 'dark', coloursOnly: boolean) => {
    const file: Record<string, Record<string, unknown>> = {};
    for (const token of tokens) {
        if (coloursOnly && !(token.kind === 'color' && token.dark)) continue;
        const place = dtcgPlace(token);
        file[place.group] ??= {};
        const group = file[place.group] as Record<string, unknown>;
        // One $type per group; the unitless line height states its own.
        group.$type ??= place.type === 'number' ? 'dimension' : place.type;
        let node = group;
        for (const key of place.path.slice(0, -1)) {
            node[key] ??= {};
            node = node[key] as Record<string, unknown>;
        }
        const raw = valueIn(token, mode);
        const $value =
            token.kind === 'color'
                ? dtcgColour(raw)
                : token.kind === 'fontFamily'
                  ? [raw, 'ui-sans-serif', 'system-ui', 'sans-serif']
                  : place.type === 'dimension'
                    ? { value: token.number ?? 0, unit: 'px' }
                    : (token.number ?? raw);
        const entry: Record<string, unknown> = { $value };
        if (place.type !== group.$type) entry.$type = place.type;
        if (token.description) entry.$description = token.description;
        node[place.path.at(-1) ?? token.variable] = entry;
    }
    return file;
};

export const toDtcg = (tokens: Token[], mode: TokenMode) => {
    if (mode !== 'both') {
        const file = JSON.stringify(dtcgFile(tokens, mode, false));
        return { files: { [`continuum.${mode}.tokens.json`]: file } };
    }
    // Each file as its text, ready to write: as nested objects they cost three times as much.
    return {
        files: {
            'continuum.tokens.json': JSON.stringify(dtcgFile(tokens, 'light', false)),
            'continuum.dark.tokens.json': JSON.stringify(dtcgFile(tokens, 'dark', true)),
        },
    };
};

/* ---------- Paper ---------- */

/** Paper takes hex and oklch(); a wash written as color-mix() goes over as hex with its alpha. */
const paperValue = (token: Token, mode: 'light' | 'dark') => {
    if (token.kind === 'fontWeight') return token.number ?? 400;
    const value = valueIn(token, mode);
    if (token.kind !== 'color' || !value.startsWith('color-mix')) return value;
    const paint = parseColor(value);
    if (!paint) return value;
    const alpha = Math.round(paint.alpha * 255)
        .toString(16)
        .padStart(2, '0');
    return `${oklchToHex(paint.color)}${alpha}`;
};

/**
 * Paper's create_tokens takes { type, name, value, description }, colours first (roles, then
 * neutral, primary and the status ramps), the rest smallest first, which is the set's own order.
 * Paper has no modes, so dark is a switch: one set_tokens call with the colours that change.
 */
export const toPaper = (tokens: Token[], mode: TokenMode) => {
    const base = mode === 'dark' ? 'dark' : 'light';
    const create = tokens.map(token => {
        const entry: Record<string, unknown> = {
            type: token.kind,
            name: token.variable,
            value: paperValue(token, base),
        };
        if (token.description) entry.description = token.description;
        return entry;
    });
    const switchTo = (to: 'light' | 'dark') =>
        tokens
            .filter(token => token.dark)
            .map(token => ({ name: token.variable, value: paperValue(token, to) }));
    if (mode !== 'both') return { create_tokens: { tokens: create } };
    return {
        create_tokens: { tokens: create },
        to_dark: { set_tokens: { tokens: switchTo('dark') } },
        to_light: { set_tokens: { tokens: switchTo('light') } },
    };
};

/* ---------- Figma ---------- */

const figmaColour = (value: string) => {
    const paint = parseColor(value);
    const rgb = paint ? parseHex(oklchToHex(paint.color)) : null;
    if (!paint || !rgb) return { r: 0, g: 0, b: 0, a: 1 };
    const [r, g, b] = rgb.map(channel => Number(channel.toFixed(4)));
    return { r, g, b, a: Number(paint.alpha.toFixed(3)) };
};

const figmaScopes: Record<Kind, string[]> = {
    color: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'],
    radius: ['CORNER_RADIUS'],
    fontSize: ['FONT_SIZE'],
    lineHeight: ['LINE_HEIGHT'],
    letterSpacing: ['LETTER_SPACING'],
    spacing: ['WIDTH_HEIGHT', 'GAP'],
    fontWeight: ['FONT_WEIGHT'],
    fontFamily: ['FONT_FAMILY'],
};

/** The body of the use_figma script: it creates the collection from the payload above it. */
const figmaScript = `const collection = figma.variables.createVariableCollection(payload.collection);
const modeIds = { [payload.modes[0]]: collection.modes[0].modeId };
collection.renameMode(collection.modes[0].modeId, payload.modes[0]);
for (const mode of payload.modes.slice(1)) modeIds[mode] = collection.addMode(mode);
for (const v of payload.variables) {
  const variable = figma.variables.createVariable(v.name, collection, v.type);
  variable.scopes = v.scopes;
  if (v.description) variable.description = v.description;
  for (const [mode, value] of Object.entries(v.values)) variable.setValueForMode(modeIds[mode], value);
}
return { collection: payload.collection, variables: payload.variables.length };`;

/**
 * Figma variables: one collection, a Light and a Dark mode, COLOR in 0–1 sRGB channels, FLOAT
 * in px, STRING for the family, named with slashes so Figma groups them.
 */
export const toFigma = (tokens: Token[], mode: TokenMode) => {
    const modes = mode === 'both' ? ['Light', 'Dark'] : [mode === 'dark' ? 'Dark' : 'Light'];
    const variables = tokens
        // Figma binds line height in px, so the unitless ratio stays out.
        .filter(token => token.variable !== '--leading-normal')
        .map(token => {
            const type =
                token.kind === 'color' ? 'COLOR' : token.kind === 'fontFamily' ? 'STRING' : 'FLOAT';
            const value = (m: 'light' | 'dark') =>
                type === 'COLOR'
                    ? figmaColour(valueIn(token, m))
                    : type === 'STRING'
                      ? token.light
                      : (token.number ?? 0);
            const values = Object.fromEntries(
                modes.map(name => [name, value(name === 'Dark' ? 'dark' : 'light')]),
            );
            const variable: Record<string, unknown> = {
                name: token.path.join('/'),
                type,
                values,
                scopes: figmaScopes[token.kind],
            };
            if (token.description) variable.description = token.description;
            return variable;
        });
    // The payload rides inside the script, so the script is the whole hand-over to use_figma.
    const payload = JSON.stringify({ collection: 'Continuum', modes, variables });
    return {
        collection: 'Continuum',
        modes,
        variables: variables.length,
        script: `const payload = ${payload};\n${figmaScript}`,
    };
};

/* ---------- Theme options ---------- */

const fontIds = Object.keys(themeFontFamilies);
const harmonyIds = chartHarmonies.map(harmony => harmony.id as string);
const greyNames = Object.keys(tailwindGreys);
const hueNames = Object.keys(tailwindHues);

const choiceList = (choices: readonly { value: number; label: string }[]) =>
    choices.map(choice => `${choice.value} (${choice.label.toLowerCase()})`).join(', ');

/** Every option the builder offers, its choices and its default, for an agent choosing a theme. */
export const themeChoices = () => ({
    presets: presets.map(preset => ({ id: preset.id, label: preset.label, options: preset.theme })),
    options: {
        accent: `A hex colour, or a Tailwind hue (${hueNames.join(', ')}). It becomes the primary ramp's accentStep. Default: none (Continuum's indigo #3939e5).`,
        accentStep: `Which step of the primary ramp the accent is: ${rampSteps.join(', ')}. Default 500.`,
        neutral: `The greys: a Tailwind grey (${greyNames.join(', ')}), a hex colour whose hue and chroma tint them, or { hue, tint } (tint 0–0.08). Default: achromatic.`,
        font: `${fontIds.join(', ')}, or any family name. Default geist.`,
        type: `Base type size in px: ${choiceList(typeChoices)}.`,
        unit: `Spacing unit in px: ${choiceList(unitChoices)}.`,
        size: `Height scale of controls, rows and bars: ${choiceList(heightChoices)}.`,
        radius: 'Corner scale, 0–2: 1 as drawn, 0 square.',
        action: `What fills the primary button and checked controls: accent or neutral (near-black). Default ${defaultThemeOptions.action}.`,
        actionStyle:
            'flat, lit (a top highlight and a ring) or glossy (with a gradient). Default flat.',
        tint: 'The selected wash: neutral (a translucent grey) or accent (its palest step). Default neutral.',
        nav: 'The current page in the sidebar: quiet, tinted or raised. Default quiet.',
        elevation:
            'flat (only what floats has a shadow) or full (cards and controls too). Default flat.',
        dock: 'pill or rounded. Default pill.',
        gamut: 'p3 (as Tailwind) or srgb. Default p3.',
        tracking: 'Letter spacing in em, -0.03–0.08. Default 0.025.',
        leading: 'Line height as a share of the size, 1.1–1.7. Default 1.25.',
        shadowStrength: '0.25–3, with elevation full. Default 1.',
        shadowSize: '0.5–3, with elevation full. Default 1.',
        chartHarmony: `How chart series 2 to 4 follow the primary: ${harmonyIds.join(', ')}. Default auto.`,
        chartTexture: 'none, stripes or dots. Default none.',
        name: 'The data-theme name. Default custom.',
    },
});

const fail = (option: string, what: string) => {
    throw new ToolError(
        `options.${option}: ${what} Call create_theme without options to see every option and its choices.`,
    );
};

const oneOf = (option: string, value: unknown, allowed: readonly (string | number)[]) => {
    if (!allowed.includes(value as never)) {
        fail(option, `${JSON.stringify(value)} is not one of ${allowed.join(', ')}.`);
    }
    return value;
};

const inRange = (option: string, value: unknown, min: number, max: number) => {
    if (typeof value !== 'number' || value < min || value > max) {
        fail(option, `${JSON.stringify(value)} is not a number from ${min} to ${max}.`);
    }
    return value as number;
};

const hexOf = (value: string) => {
    const text = value.trim();
    return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)
        ? text.startsWith('#')
            ? text
            : `#${text}`
        : null;
};

/** A Tailwind palette ramp's 500 as hex. */
const paletteHex = (ramp: readonly (readonly [number, number, number])[]) => {
    const [l, c, h] = ramp[5] ?? [0.5, 0, 0];
    return oklchToHex({ l, c, h });
};

/** The greys as the builder sets them from a colour: its hue, and its chroma capped at 0.08. */
const neutralFrom = (value: unknown): ThemeOptions['neutral'] => {
    if (value && typeof value === 'object') {
        const { hue, tint } = value as { hue?: unknown; tint?: unknown };
        return {
            hue: inRange('neutral.hue', hue, 0, 360),
            tint: inRange('neutral.tint', tint, 0, 0.08),
        };
    }
    if (typeof value !== 'string')
        return fail('neutral', 'give a Tailwind grey, a hex colour or { hue, tint }.');
    const grey = tailwindGreys[value.toLowerCase()];
    const hex = grey ? paletteHex(grey) : hexOf(value);
    const own = hex ? hexToOklch(hex) : null;
    if (!own) {
        return fail(
            'neutral',
            `${JSON.stringify(value)} is neither a Tailwind grey (${greyNames.join(', ')}) nor a hex colour.`,
        );
    }
    const tint = Math.min(0.08, Number(own.c.toFixed(3)));
    return tint < 0.001 ? undefined : { hue: Math.round(own.h), tint };
};

const passThrough = ['curves', 'charts', 'chartSpread', 'chartTurns', 'chartSteps', 'chartLead'];

/**
 * Theme options checked against what the builder offers, with names turned into values (a
 * Tailwind hue for the accent, a Tailwind grey for the greys). Throws a ToolError naming the
 * option and its choices. A preset id starts from that preset's options.
 */
export const readThemeOptions = (input: Record<string, unknown> = {}, preset?: string) => {
    const options: ThemeOptions = {};
    if (preset) {
        const found = presets.find(item => item.id === preset);
        if (!found) {
            throw new ToolError(
                `No preset named ${preset}. The presets are ${presets.map(item => item.id).join(', ')}; call create_theme without options to see them.`,
            );
        }
        Object.assign(options, found.theme);
    }
    const set = options as Record<string, unknown>;
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) continue;
        switch (key) {
            case 'name':
                set.name = String(value);
                break;
            case 'accent': {
                const text = String(value);
                const hue = tailwindHues[text.toLowerCase()];
                const hex = hue ? paletteHex(hue) : hexOf(text);
                if (!hex) {
                    fail(
                        'accent',
                        `${JSON.stringify(value)} is neither a hex colour nor a Tailwind hue (${hueNames.join(', ')}).`,
                    );
                }
                set.accent = hex;
                break;
            }
            case 'accentStep':
                set.accentStep = String(oneOf(key, String(value), rampSteps));
                break;
            case 'neutral':
                set.neutral = neutralFrom(value);
                break;
            case 'font': {
                const font = String(value).trim();
                const id = fontIds.find(item => item === font.toLowerCase().replace(/\s+/g, '-'));
                set.font = id ?? font;
                break;
            }
            case 'type':
                set.type = oneOf(
                    key,
                    value,
                    typeChoices.map(choice => choice.value),
                );
                break;
            case 'unit':
                set.unit = oneOf(
                    key,
                    value,
                    unitChoices.map(choice => choice.value),
                );
                break;
            case 'size':
                set.size = oneOf(
                    key,
                    value,
                    heightChoices.map(choice => choice.value),
                );
                break;
            case 'radius':
                set.radius = inRange(key, value, 0, 2);
                break;
            case 'action':
                set.action = oneOf(key, value, ['accent', 'neutral']);
                break;
            case 'actionStyle':
                set.actionStyle = oneOf(key, value, ['flat', 'lit', 'glossy']);
                break;
            case 'tint':
                set.tint = oneOf(key, value, ['neutral', 'accent']);
                break;
            case 'nav':
                set.nav = oneOf(key, value, ['quiet', 'tinted', 'raised']);
                break;
            case 'elevation':
                set.elevation = oneOf(key, value, ['flat', 'full']);
                break;
            case 'dock':
                set.dock = oneOf(key, value, ['pill', 'rounded']);
                break;
            case 'gamut':
                set.gamut = oneOf(key, value, ['p3', 'srgb']);
                break;
            case 'tracking':
                set.tracking = inRange(key, value, -0.03, 0.08);
                break;
            case 'leading':
                set.leading = inRange(key, value, 1.1, 1.7);
                break;
            case 'shadowStrength':
                set.shadowStrength = inRange(key, value, 0.25, 3);
                break;
            case 'shadowSize':
                set.shadowSize = inRange(key, value, 0.5, 3);
                break;
            case 'chartHarmony':
                set.chartHarmony = oneOf(key, value, harmonyIds);
                break;
            case 'chartTexture':
                set.chartTexture = oneOf(key, value, ['none', 'stripes', 'dots']);
                break;
            default:
                if (passThrough.includes(key)) set[key] = value;
                else {
                    throw new ToolError(
                        `options.${key} is not a theme option. The options are ${[...Object.keys(themeChoices().options), ...passThrough].join(', ')}. Call create_theme without options to see their choices.`,
                    );
                }
        }
    }
    return options;
};
