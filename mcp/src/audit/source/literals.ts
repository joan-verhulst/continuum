import type { Fact } from '../../types';
import { canonicalProperty, colourProperty } from './aliases';
import type { Consumed } from './scan';
import { subjectOf, wordsOf } from './subject';

/*
 * Colours written as values on their own, in any language: a hex in a TypeScript constant, a
 * Color(0xFF3B82F6) in Kotlin or Dart, a QColor, an ImVec4 of floats, a SwiftUI Color(red:green:
 * blue:). Each becomes a CSS colour. What it paints is guessed from the name it is assigned to,
 * so these facts are marked guessed and the rules hold them more loosely.
 */

const hex2 = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, '0');

const hexOf = (r: number, g: number, b: number, a = 1) =>
    `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;

/** A number as written in code: 0.5f, 59, 59/255, 0x3B. */
const number = (text: string) => {
    const clean = text.trim().replace(/[fFdD]$/, '');
    const ratio = /^([\d.]+)\s*\/\s*([\d.]+)$/.exec(clean);
    if (ratio) return Number(ratio[1]) / Number(ratio[2]);
    if (/^0x[0-9a-f]+$/i.test(clean)) return Number.parseInt(clean, 16);
    const value = Number(clean);
    return Number.isFinite(value) ? value : null;
};

/** Channels as 0–255, reading 0–1 floats when any of them is written as one. */
const channels = (values: string[], floats?: boolean) => {
    const numbers = values.map(number);
    if (numbers.some(value => value === null)) return null;
    const list = numbers as number[];
    const asFloat = floats ?? values.some(value => /\.|\//.test(value));
    return asFloat ? list.map(value => value * 255) : list;
};

const args = (text: string) => {
    const open = text.indexOf('(');
    return text
        .slice(open + 1, text.lastIndexOf(')'))
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
};

/** 0xAARRGGBB, Android's and Flutter's order. */
const argb = (text: string) => {
    const value = /0x([0-9a-f]{8}|[0-9a-f]{6})\b/i.exec(text)?.[1];
    if (!value) return null;
    const full = value.length === 6 ? `ff${value}` : value;
    const alpha = Number.parseInt(full.slice(0, 2), 16) / 255;
    return `#${full.slice(2).toLowerCase()}${alpha < 1 ? full.slice(0, 2).toLowerCase() : ''}`;
};

/**
 * A colour in any code form as CSS, or null. CSS's own forms pass through; hex is lower-cased.
 */
export const codeColour = (value: string): string | null => {
    const text = value.trim().replace(/^['"]|['"]$/g, '');
    if (/^#[0-9a-f]{3,8}$/i.test(text)) return text.toLowerCase();
    // CSS's own forms; Color( with a capital is code's, read below.
    if (/^(rgba?|hsla?|oklch|oklab|hwb|lab|lch)\(/i.test(text) || text.startsWith('color('))
        return text;
    const quoted = /^\w[\w.]*\(\s*["'](#[0-9a-f]{3,8})["']\s*\)$/i.exec(text);
    if (quoted) return (quoted[1] ?? '').toLowerCase();
    if (/^0x[0-9a-f]{6,8}$/i.test(text)) return argb(text);
    const call = /^([\w.]+)\s*\(/.exec(text)?.[1];
    if (!call) return null;
    // Color(hex: "#3b82f6"), QColor("#3b82f6"): a hex inside a call.
    const inner = /["'](#[0-9a-f]{3,8})["']/i.exec(text)?.[1];
    if (inner) return inner.toLowerCase();
    const list = args(text);
    const named = (key: string) =>
        list.find(arg => arg.startsWith(`${key}:`))?.slice(key.length + 1) ?? undefined;
    if (/fromARGB|FromArgb/.test(call) && list.length === 4) {
        const [a, r, g, b] = list.map(number);
        if ([a, r, g, b].some(each => each === null || each === undefined)) return null;
        return hexOf(r as number, g as number, b as number, (a as number) / 255);
    }
    if (/fromRGBO/.test(call) && list.length === 4) {
        const [r, g, b, o] = list.map(number);
        if ([r, g, b, o].some(each => each === null || each === undefined)) return null;
        return hexOf(r as number, g as number, b as number, o as number);
    }
    if (/^(Color|UIColor|NSColor|CGColor|Color\.init)$/.test(call) && named('red')) {
        const rgb = channels([named('red') ?? '', named('green') ?? '', named('blue') ?? ''], true);
        if (!rgb) return null;
        const alpha = number(named('alpha') ?? named('opacity') ?? '1') ?? 1;
        return hexOf(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, alpha);
    }
    if (/^(Color|QColor)$/.test(call) && list.length === 1 && /^0x/i.test(list[0] ?? ''))
        return argb(list[0] ?? '');
    if (/^(ImVec4|Qt\.rgba|Qt\.rgb|ImColor)$/.test(call) && list.length >= 3) {
        const rgb = channels(list.slice(0, 3), call !== 'ImColor' || undefined);
        if (!rgb) return null;
        const alpha = number(list[3] ?? '1') ?? 1;
        return hexOf(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, alpha > 1 ? alpha / 255 : alpha);
    }
    if (/^(Color|QColor|IM_COL32|Color\.FromRgb|RGB|RGBA)$/.test(call) && list.length >= 3) {
        if (list.some(arg => /[a-z]{2,}/i.test(arg) && !/^0x/i.test(arg))) return null;
        const rgb = channels(list.slice(0, 3));
        if (!rgb) return null;
        const raw = number(list[3] ?? '255') ?? 255;
        const floats = list.some(value => /\./.test(value));
        return hexOf(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, floats ? raw : raw / 255);
    }
    return null;
};

/** Every colour literal in code, by its forms. */
const literal = new RegExp(
    [
        '#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\\w-])',
        '\\b(?:rgba?|hsla?|oklch|oklab|hwb)\\([^)]*\\)',
        '\\b(?:Color\\.fromARGB|Color\\.fromRGBO|Color\\.FromArgb|Color\\.FromRgb|Qt\\.rgba|Qt\\.rgb|UIColor|NSColor|QColor|ImVec4|ImColor|IM_COL32|Color)\\s*\\((?:[^()]|\\([^()]*\\))*\\)',
        '\\b0x[0-9a-fA-F]{8}\\b',
    ].join('|'),
    'g',
);

/** A colour's name hints at what it paints: bg, border, text. */
const paintFromName = (name: string, kind: string | undefined) => {
    const last = name.split(/[.\s]/).at(-1) ?? '';
    const property = canonicalProperty(last);
    if (property && colourProperty(property)) return property;
    const words = wordsOf(name);
    if (words.some(word => /^(bg|background|backdrop|surface|fill|canvas|base)$/.test(word)))
        return 'background-color';
    if (
        words.some(word =>
            /^(border|stroke|outline|divider|separator|hairline|line|rule|ring)$/.test(word),
        )
    )
        return 'border-top-color';
    if (
        words.some(word => /^(text|fg|foreground|ink|label|title|heading|caption|font)$/.test(word))
    )
        return 'color';
    if (kind && /control|container|badge|row|floating|page/.test(kind)) return 'background-color';
    return 'color';
};

/**
 * Files whose colours are data: a chart's series, mock and seed records, a data-vis palette.
 * A theme's or a tokens file's colours are not data: they are the palette the UI is painted
 * with, the first thing to move onto the system's names, so they are read like any other.
 */
export const dataPath = (path: string) =>
    /(^|[/._-])(charts?|data|datasets?|mocks?|__mocks__|__fixtures__|seeds?|palettes?)([/._-]|$)/i.test(
        path.replace(/\\/g, '/'),
    );

/**
 * The colour literals in a file that no other reader took, each a guessed 'color' fact on the
 * name it is assigned to. URLs, SVG path data, ids and anchors are not colours.
 */
export const readLiterals = (
    path: string,
    text: string,
    consumed: Consumed,
    line: (offset: number) => number,
): Fact[] => {
    const facts: Fact[] = [];
    const data = dataPath(path);
    for (const match of text.matchAll(literal)) {
        const offset = match.index ?? 0;
        if (consumed.has(offset)) continue;
        const written = match[0];
        const lineStart = text.lastIndexOf('\n', offset) + 1;
        const lineEnd = text.indexOf('\n', offset);
        const before = text.slice(lineStart, offset);
        const after = text.slice(offset + written.length, lineEnd < 0 ? undefined : lineEnd);
        if (written.startsWith('#')) {
            const previous = text[offset - 1] ?? '';
            // An entity (&#123;), an anchor or id (href="#add"), a URL fragment, a selector.
            if (/[\w&#/$]/.test(previous)) continue;
            if (
                /\b(href|to|id|for|xlink:href|src|url|routerLink|name)\s*=\s*["'{]?\s*$/i.test(
                    before,
                )
            )
                continue;
            if (/^\d{4}$/.test(written.slice(1))) continue;
            if (/^\s*[{,]/.test(after) && !before.includes(':')) continue;
        }
        if (/\b(d|points|path|viewBox)\s*=\s*["'][^"']*$/.test(before)) continue;
        if (/url\([^)]*$|https?:\/\/\S*$/.test(before)) continue;
        const value = codeColour(written);
        if (!value) continue;
        // The name the colour is given: `const muted = …`, `colors[ImGuiCol_Button] = …`, `fill="…"`.
        const assigned =
            /([A-Za-z_$][\w$.-]*(?:\[[\w.:'"]+\])?)\s*(?:=|:|\()\s*["'`{]?\s*(?:[\w.]+\()?\s*$/.exec(
                before,
            )?.[1] ?? '';
        const name = assigned.replace(/^.*\[["']?|["']?\]$/g, '') || assigned;
        const svgAttribute = /^(fill|stroke|stop-color|stopColor|flood-color)$/.test(name);
        const subject = subjectOf({ names: name ? [name] : [] });
        if (data || svgAttribute) subject.picture = true;
        const property = svgAttribute
            ? name.startsWith('stroke')
                ? 'stroke'
                : 'fill'
            : paintFromName(name, subject.kind);
        if (property === 'color') subject.text = true;
        facts.push({
            at: `${path}:${line(offset)}`,
            property,
            value,
            subject,
            written: { form: 'literal', text: written },
            guessed: true,
        });
    }
    return facts;
};
