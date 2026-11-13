import { oklchToHex, tailwindGreys, tailwindHues } from 'continuum';
import type { SystemValues } from '../../system/values';
import type { Fact, Subject } from '../../types';
import { type Pair, toCss } from './aliases';
import { type Consumed, closing, type Literal, stringLiterals } from './scan';
import { subjectOf } from './subject';

/*
 * Utility classes, wherever a file writes a class string: class="…", className, :class, [class],
 * [ngClass], class:list, cn()/clsx()/cva()/tv() arguments, tw`…`, @apply. Each class is read by
 * Tailwind's grammar into the CSS it sets (h-9 is height 36px, bg-blue-600 is Tailwind's blue),
 * and a name the theme defines (bg-neutral-200, h-control, rounded-card) into its variable, so a
 * class already in the system reads as the system. Variants stay in the written text.
 */

type ClassString = Literal & {
    /** The element the string is on: 'button', 'Card', 'div'. */
    tag?: string;
    /** The cva variable or the component the string is written in: 'buttonVariants', 'DialogContent'. */
    name?: string;
    /** The element's attributes before the class, for a role. */
    attributes?: string;
};

const callNames = /\b(cn|clsx|cx|classNames|classnames|twMerge|twJoin|cva|tv|tw)\s*\(/g;

/** Every class string in the (comment-masked) text, each once. */
export const classStrings = (text: string): ClassString[] => {
    const found = new Map<number, ClassString>();
    const keep = (literal: Literal, name?: string) => {
        if (!literal.text.trim() || found.has(literal.offset)) return;
        found.set(literal.offset, { ...literal, name });
    };
    // class="…" and className="…", not :class or [class] (bindings, below).
    for (const match of text.matchAll(/(^|[^\w:.[-])(className|class)\s*=\s*(["'])/g)) {
        const start = (match.index ?? 0) + match[0].length;
        const end = text.indexOf(match[3] ?? '"', start);
        if (end > start) keep({ text: text.slice(start, end), offset: start });
    }
    // className={…}, Svelte's class={…} and Astro's class:list={…}: the strings inside.
    for (const match of text.matchAll(/(^|[^\w:.[-])(className|class|class:list)\s*=\s*\{/g)) {
        const open = (match.index ?? 0) + match[0].length - 1;
        const body = text.slice(open, closing(text, open));
        for (const literal of stringLiterals(body, open)) keep(literal);
    }
    // Angular's [class] and [ngClass], Vue's :class: an expression whose strings are classes.
    for (const match of text.matchAll(
        /(\[(?:class|ngClass|className)\]|v-bind:class|:class)\s*=\s*"([^"]*)"/g,
    )) {
        const base = (match.index ?? 0) + match[0].indexOf('"') + 1;
        for (const literal of stringLiterals(match[2] ?? '', base)) keep(literal);
    }
    // One class toggled by a binding: Angular's [class.bg-x]="…", Svelte's class:bg-x={…}.
    for (const match of text.matchAll(/\[class\.([^\]=\s]+)\]|\bclass:(?!list\b)([^\s=>]+)/g)) {
        const name = match[1] ?? match[2] ?? '';
        keep({ text: name, offset: (match.index ?? 0) + match[0].indexOf(name) });
    }
    for (const match of text.matchAll(callNames)) {
        const open = (match.index ?? 0) + match[0].length - 1;
        const body = text.slice(open, closing(text, open));
        let name: string | undefined;
        if (match[1] === 'cva' || match[1] === 'tv') {
            const before = text.slice(Math.max(0, (match.index ?? 0) - 120), match.index);
            name = /(\w+)\s*=\s*$/.exec(before)?.[1];
        }
        for (const literal of stringLiterals(body, open)) keep(literal, name);
    }
    for (const match of text.matchAll(/\btw`([^`]*)`/g)) {
        keep({ text: match[1] ?? '', offset: (match.index ?? 0) + 3 });
    }
    for (const match of text.matchAll(/@apply\s+([^;{}]+)/g)) {
        keep({
            text: match[1] ?? '',
            offset: (match.index ?? 0) + match[0].indexOf(match[1] ?? ''),
        });
    }
    return [...found.values()].map(string => ({ ...string, ...placeOf(text, string) }));
};

/** The element a class string sits on, and the component it is written in. */
const placeOf = (text: string, string: ClassString) => {
    const before = text.slice(Math.max(0, string.offset - 600), string.offset);
    let tag: string | undefined;
    let attributes: string | undefined;
    const last = [...before.matchAll(/<([A-Za-z][\w.:-]*)/g)].at(-1);
    if (last) {
        const rest = before.slice((last.index ?? 0) + last[0].length);
        // A tag that closed before the string is not the one it sits on.
        if (!/\/>|<\/|>\s*[^\s<{]/.test(rest.replace(/=>/g, ''))) {
            tag = last[1];
            attributes = rest;
        }
    }
    const component = [
        ...text
            .slice(Math.max(0, string.offset - 4000), string.offset)
            .matchAll(/(?:const|function|class)\s+([A-Z]\w*)/g),
    ].at(-1)?.[1];
    // @apply sits in a rule: its selector names it.
    let selector: string | undefined;
    if (!tag && /@apply\s*$/.test(text.slice(Math.max(0, string.offset - 20), string.offset))) {
        const open = text.lastIndexOf('{', string.offset);
        const head = text.slice(text.lastIndexOf('}', open) + 1, open).trim();
        selector = head.split('\n').at(-1)?.trim();
    }
    return { tag, attributes, name: string.name ?? selector ?? (tag ? undefined : component) };
};

type Token = { raw: string; offset: number; variants: string[]; base: string; negative: boolean };

const tokens = (string: ClassString): Token[] => {
    const out: Token[] = [];
    for (const match of string.text.matchAll(/\S+/g)) {
        const raw = match[0];
        const parts: string[] = [];
        let depth = 0;
        let current = '';
        for (const char of raw) {
            if (char === '[' || char === '(') depth++;
            if (char === ']' || char === ')') depth--;
            if (char === ':' && depth === 0) {
                parts.push(current);
                current = '';
            } else current += char;
        }
        let base = current.replace(/^!|!$/g, '');
        const negative = base.startsWith('-');
        if (negative) base = base.slice(1);
        out.push({
            raw,
            offset: string.offset + (match.index ?? 0),
            variants: parts,
            base,
            negative,
        });
    }
    return out;
};

/* ---------- Tailwind's defaults ---------- */

const stepIndex = (step: number) => (step === 50 ? 0 : step === 950 ? 10 : step / 100);

/** A Tailwind default palette colour as hex: ('gray', 400) → '#99a1af'. Null if unknown. */
export const tailwindHex = (family: string, step: number) => {
    const ramp = tailwindHues[family] ?? tailwindGreys[family];
    const triple = ramp?.[stepIndex(step)];
    if (!triple) return null;
    return oklchToHex({ l: triple[0], c: triple[1], h: triple[2] });
};

/** Tailwind v4's radii. */
const tailwindRadius: Record<string, number> = {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    '4xl': 32,
    none: 0,
    full: 9999,
};

/** Tailwind v4's type sizes. */
const tailwindText: Record<string, number> = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
};

const tailwindWeight: Record<string, number> = {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
};

const black = (alpha: number) => `rgb(0 0 0 / ${alpha})`;

/** Tailwind v4's shadows. */
const tailwindShadow: Record<string, string> = {
    '2xs': `0 1px ${black(0.05)}`,
    xs: `0 1px 2px 0 ${black(0.05)}`,
    '': `0 1px 3px 0 ${black(0.1)}, 0 1px 2px -1px ${black(0.1)}`,
    sm: `0 1px 3px 0 ${black(0.1)}, 0 1px 2px -1px ${black(0.1)}`,
    md: `0 4px 6px -1px ${black(0.1)}, 0 2px 4px -2px ${black(0.1)}`,
    lg: `0 10px 15px -3px ${black(0.1)}, 0 4px 6px -4px ${black(0.1)}`,
    xl: `0 20px 25px -5px ${black(0.1)}, 0 8px 10px -6px ${black(0.1)}`,
    '2xl': `0 25px 50px -12px ${black(0.25)}`,
    none: 'none',
};

/* ---------- The grammar ---------- */

const sideNames: Record<string, string[]> = {
    '': ['top', 'right', 'bottom', 'left'],
    x: ['left', 'right'],
    y: ['top', 'bottom'],
    t: ['top'],
    r: ['right'],
    b: ['bottom'],
    l: ['left'],
    s: ['left'],
    e: ['right'],
};

const cornerNames: Record<string, string[]> = {
    '': ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
    t: ['top-left', 'top-right'],
    r: ['top-right', 'bottom-right'],
    b: ['bottom-right', 'bottom-left'],
    l: ['top-left', 'bottom-left'],
    s: ['top-left', 'bottom-left'],
    e: ['top-right', 'bottom-right'],
    tl: ['top-left'],
    tr: ['top-right'],
    br: ['bottom-right'],
    bl: ['bottom-left'],
    ss: ['top-left'],
    se: ['top-right'],
    es: ['bottom-left'],
    ee: ['bottom-right'],
};

/** Utilities that set lengths, by prefix: the properties each sets. */
const lengthUtilities: Record<string, string[]> = {
    p: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    px: ['padding-left', 'padding-right'],
    py: ['padding-top', 'padding-bottom'],
    pt: ['padding-top'],
    pr: ['padding-right'],
    pb: ['padding-bottom'],
    pl: ['padding-left'],
    ps: ['padding-left'],
    pe: ['padding-right'],
    m: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    mx: ['margin-left', 'margin-right'],
    my: ['margin-top', 'margin-bottom'],
    mt: ['margin-top'],
    mr: ['margin-right'],
    mb: ['margin-bottom'],
    ml: ['margin-left'],
    ms: ['margin-left'],
    me: ['margin-right'],
    gap: ['gap'],
    'gap-x': ['column-gap'],
    'gap-y': ['row-gap'],
    'space-x': ['column-gap'],
    'space-y': ['row-gap'],
    h: ['height'],
    'min-h': ['min-height'],
    'max-h': ['max-height'],
    w: ['width'],
    'min-w': ['min-width'],
    'max-w': ['max-width'],
    size: ['width', 'height'],
    leading: ['line-height'],
};

const lengthPrefixes = Object.keys(lengthUtilities).sort((a, b) => b.length - a.length);

/** Colour utilities, by prefix: the property each paints. */
const colourUtilities: Record<string, string[]> = {
    bg: ['background-color'],
    text: ['color'],
    placeholder: ['color'],
    caret: ['caret-color'],
    accent: ['accent-color'],
    decoration: ['text-decoration-color'],
    ring: ['outline-color'],
    outline: ['outline-color'],
    fill: ['fill'],
    stroke: ['stroke'],
    from: ['background-color'],
    via: ['background-color'],
    to: ['background-color'],
    divide: ['border-top-color'],
};

/** Arbitrary values: '[13px]' → '13px', '(--x)' → 'var(--x)', type hints dropped. */
const arbitrary = (value: string) => {
    if (/^\[.*\]$/.test(value))
        return value
            .slice(1, -1)
            .replace(/_/g, ' ')
            .replace(/^(length|color|number|percentage|family-name|image|url):/, '');
    if (/^\(.*\)$/.test(value))
        return `var(${value.slice(1, -1).replace(/^(length|color|number|percentage):/, '')})`;
    return null;
};

const isColourText = (value: string) =>
    /^(#|rgb|hsl|oklch|oklab|hwb|lab|lch|color\(|var\(--color)/i.test(value);

/** Reads one class into the CSS it sets, against the theme's names and then Tailwind's. */
export const readUtility = (base: string, negative: boolean, system: SystemValues): Pair[] => {
    const colourNames = new Set(system.colours.light.map(token => token.name));
    const sizes = new Map(system.sizes.map(token => [token.name, token.variable]));
    const radii = new Map(system.radii.map(token => [token.name, token.variable]));
    const texts = new Map(system.text.map(token => [token.name, token.variable]));
    const unit = system.unit;
    const sign = negative ? '-' : '';

    /** A colour name as CSS: the theme's by variable, Tailwind's by hex, with its opacity. */
    const colour = (name: string): string | null => {
        const [plain = '', opacity] = name.split('/');
        const alpha = opacity
            ? Number(arbitrary(opacity) ?? opacity) / (opacity.includes('.') ? 1 : 100)
            : 1;
        const raw = arbitrary(plain);
        if (raw !== null) return isColourText(raw) || /^[a-z]+$/.test(raw) ? raw : null;
        if (colourNames.has(plain)) {
            const variable = `var(--color-${plain})`;
            return alpha < 1
                ? `color-mix(in oklab, ${variable} ${Math.round(alpha * 100)}%, transparent)`
                : variable;
        }
        if (plain === 'white' || plain === 'black') {
            const hex = plain === 'white' ? '#ffffff' : '#000000';
            return alpha < 1
                ? `${hex}${Math.round(alpha * 255)
                      .toString(16)
                      .padStart(2, '0')}`
                : hex;
        }
        const step = /^([a-z]+)-(\d{2,3})$/.exec(plain);
        if (!step) return null;
        const hex = tailwindHex(step[1] ?? '', Number(step[2]));
        if (!hex) return null;
        return alpha < 1
            ? `${hex}${Math.round(alpha * 255)
                  .toString(16)
                  .padStart(2, '0')}`
            : hex;
    };

    /** A spacing step, a named size or an arbitrary value as a length. */
    const length = (value: string, named: Map<string, string>): string | null => {
        const raw = arbitrary(value);
        if (raw !== null)
            return /^-?[\d.]/.test(raw) || raw.startsWith('var(') ? `${sign}${raw}` : null;
        if (value === 'px') return `${sign}1px`;
        if (/^\d+(\.\d+)?$/.test(value)) return `${sign}${Number(value) * unit}px`;
        const variable = named.get(value);
        if (variable) return `var(${variable})`;
        return null;
    };

    const all = (properties: string[], value: string | null) =>
        value === null ? [] : properties.map(property => ({ property, value }));

    // Arbitrary properties: [box-shadow:…].
    const property = /^\[([a-z-]+):(.+)\]$/.exec(base);
    if (property) return toCss(property[1] ?? '', (property[2] ?? '').replace(/_/g, ' '), 'css');

    const weight = /^font-(\w+|\[\d+\])$/.exec(base);
    if (weight) {
        const name = weight[1] ?? '';
        const value = tailwindWeight[name] ?? Number(arbitrary(name));
        return Number.isFinite(value) && value > 0
            ? [{ property: 'font-weight', value: String(value) }]
            : [];
    }

    const text = /^text-(.+)$/.exec(base);
    if (text) {
        const value = text[1] ?? '';
        if (
            /^(left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(
                value,
            )
        )
            return [];
        const size = value.split('/')[0] ?? '';
        const variable = texts.get(size);
        if (variable) return [{ property: 'font-size', value: `var(${variable})` }];
        if (tailwindText[size])
            return [{ property: 'font-size', value: `${tailwindText[size]}px` }];
        const raw = arbitrary(value);
        if (raw !== null && /^[\d.]+(px|rem|em)$/.test(raw))
            return [{ property: 'font-size', value: raw }];
        return all(['color'], colour(value));
    }

    const rounded = /^rounded(?:-(t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/.exec(base);
    if (rounded) {
        const corners = cornerNames[rounded[1] ?? ''] ?? [];
        const name = rounded[2] ?? '';
        let value: string | null = null;
        const variable = radii.get(name || 'DEFAULT');
        if (variable) value = `var(${variable})`;
        else if (!name) value = '4px';
        else if (tailwindRadius[name] !== undefined) value = `${tailwindRadius[name]}px`;
        else value = arbitrary(name);
        return all(
            corners.map(corner => `border-${corner}-radius`),
            value,
        );
    }

    const shadow = /^shadow(?:-(.+))?$/.exec(base);
    if (shadow) {
        const name = shadow[1] ?? '';
        if (name && system.css.includes(`--shadow-${name}:`))
            return [{ property: 'box-shadow', value: `var(--shadow-${name})` }];
        if (tailwindShadow[name] !== undefined)
            return [{ property: 'box-shadow', value: tailwindShadow[name] ?? '' }];
        const raw = arbitrary(name);
        return raw !== null && !isColourText(raw) ? [{ property: 'box-shadow', value: raw }] : [];
    }

    const border = /^border(?:-([xytrblse]))?(?:-(.+))?$/.exec(base);
    if (border && !/^(collapse|separate|spacing)/.test(border[2] ?? '')) {
        const sides = sideNames[border[1] ?? ''] ?? [];
        const rest = border[2] ?? '';
        if (!rest || /^\d+$/.test(rest))
            return all(
                sides.map(side => `border-${side}-width`),
                `${rest || 1}px`,
            );
        if (/^(solid|dashed|dotted|double|hidden|none)$/.test(rest))
            return all(
                sides.map(side => `border-${side}-style`),
                rest,
            );
        const raw = arbitrary(rest);
        if (raw !== null && /^[\d.]+px$/.test(raw))
            return all(
                sides.map(side => `border-${side}-width`),
                raw,
            );
        return all(
            sides.map(side => `border-${side}-color`),
            colour(rest),
        );
    }

    const divide = /^divide-([xy])(?:-(\d+))?$/.exec(base);
    if (divide) return [{ property: 'border-top-width', value: `${divide[2] ?? 1}px` }];

    for (const prefix of lengthPrefixes) {
        if (!base.startsWith(`${prefix}-`)) continue;
        const value = base.slice(prefix.length + 1);
        const named = prefix === 'leading' ? new Map<string, string>() : sizes;
        if (prefix === 'leading' && !/^(\d|\[)/.test(value)) return [];
        return all(lengthUtilities[prefix] ?? [], length(value, named));
    }

    const paint =
        /^(bg|placeholder|caret|accent|decoration|ring|outline|fill|stroke|from|via|to|divide)-(.+)$/.exec(
            base,
        );
    if (paint) {
        const value = colour(paint[2] ?? '');
        return all(colourUtilities[paint[1] ?? ''] ?? [], value);
    }
    return [];
};

/* ---------- The reader ---------- */

/** The names the file imports from the library: these elements are already Continuum parts. */
export const libraryNames = (text: string) => {
    const names = new Set<string>();
    for (const match of text.matchAll(
        /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]((?:[^'"]*\/)?continuum(?:\/[\w-]+)?)['"]/g,
    )) {
        for (const name of (match[1] ?? '').split(',')) {
            const local = name
                .trim()
                .split(/\s+as\s+/)
                .at(-1)
                ?.trim();
            if (local) names.add(local);
        }
    }
    return names;
};

/** The subject of a class string: the element it is on, its other classes, its role. */
const subjectOfString = (string: ClassString, library: Set<string>): Subject => {
    const role = /\brole\s*=\s*["'](\w+)/.exec(string.attributes ?? '')?.[1];
    const subject = subjectOf({
        tag: string.tag,
        names: [string.name ?? '', string.text].filter(Boolean),
        role,
        classes: string.text,
    });
    if (string.tag && library.has(string.tag.split('.')[0] ?? '')) subject.library = true;
    return subject;
};

/** The utility classes in a file as facts, each at its line, with the element it sits on. */
export const readUtilities = (
    path: string,
    text: string,
    system: SystemValues,
    consumed: Consumed,
    line: (offset: number) => number,
): Fact[] => {
    const facts: Fact[] = [];
    const library = libraryNames(text);
    for (const string of classStrings(text)) {
        const subject = subjectOfString(string, library);
        let read = false;
        for (const token of tokens(string)) {
            for (const pair of readUtility(token.base, token.negative, system)) {
                read = true;
                const own: Subject =
                    pair.property === 'color' ? { ...subject, text: true } : { ...subject };
                if (token.base.startsWith('divide-')) own.kind = 'divider';
                facts.push({
                    at: `${path}:${line(token.offset)}`,
                    property: pair.property,
                    value: pair.value,
                    subject: own,
                    written: { form: 'utility', text: token.raw },
                });
            }
        }
        if (read) consumed.add(string.offset, string.offset + string.text.length);
    }
    return facts;
};
