import { type Oklch, oklchToHex, parseCssColor } from 'continuum';

/*
 * Colours as the tools take them: any CSS colour a reader types or pastes (hex, rgb(), hsl(),
 * oklch(), a name such as `rebeccapurple`), read to oklch, and a palette as a list of them. The
 * library reads the forms with numbers in them; a name is read by the browser's own canvas.
 */

let canvas: CanvasRenderingContext2D | null | undefined;

/** A colour name or any other form the library does not read, as the browser reads it. */
const viaBrowser = (text: string): Oklch | null => {
    if (typeof document === 'undefined') return null;
    if (canvas === undefined) canvas = document.createElement('canvas').getContext('2d');
    if (!canvas) return null;
    // A colour the browser cannot read leaves the fill as it was, so two different starts tell.
    canvas.fillStyle = '#000001';
    canvas.fillStyle = text;
    const first = String(canvas.fillStyle);
    canvas.fillStyle = '#000002';
    canvas.fillStyle = text;
    const second = String(canvas.fillStyle);
    return first === second ? parseCssColor(first) : null;
};

/** Any CSS colour as oklch, or null when it is not one. */
export const readColour = (text: string): Oklch | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    return parseCssColor(trimmed) ?? viaBrowser(trimmed);
};

/** A colour as the hex a well shows, lower case. */
export const hexOf = (color: Oklch) => oklchToHex(color).toLowerCase();

/**
 * A palette pasted as text: colours split by commas, semicolons, spaces or new lines, where a
 * colour's own commas and spaces (`rgb(0, 0, 0)`, `oklch(62% 0.2 260)`) stay inside its brackets.
 * A token that is not a colour (a name such as `--color-brand-500:` before it) is skipped.
 */
export const parsePalette = (text: string): Oklch[] => {
    // A bare word counts only standing alone, so `red` in `--color-red-500` is not taken for a colour.
    const tokens =
        text.match(/[a-z]+\([^)]*\)|#[0-9a-f]{3,8}\b|(?<![\w-])[a-z]+(?![\w(-])/gi) ?? [];
    return tokens.flatMap(token => {
        const color = readColour(token);
        return color ? [color] : [];
    });
};

/* ---------- A stylesheet's colours ---------- */

/** A colour with the name it was given: `neutral-500` in the group `neutral`, at its step `500`. */
export type NamedColour = { name: string; group: string; label: string; color: Oklch };

/** What a text holds: its colours in light, and in dark where a stylesheet sets dark values. */
export type ColourSource = {
    light: NamedColour[];
    dark: NamedColour[] | null;
    /** Read from custom properties (an app.css, a :root block) rather than a bare list. */
    named: boolean;
};

type Declaration = { name: string; value: string; dark: boolean };

/**
 * The custom properties a stylesheet sets, each with whether it sits under a dark selector
 * (`[data-mode="dark"]`, `.dark`, a `prefers-color-scheme: dark` query), at any depth.
 */
const customProperties = (css: string): Declaration[] => {
    const found: Declaration[] = [];
    const scopes: string[] = [];
    let chunk = '';
    const close = () => {
        const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(chunk);
        if (match?.[1] && match[2]) {
            found.push({
                name: match[1],
                value: match[2].trim(),
                dark: scopes.some(scope => /dark/i.test(scope)),
            });
        }
        chunk = '';
    };
    for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
        if (char === '{') {
            scopes.push(chunk.trim());
            chunk = '';
        } else if (char === ';') {
            close();
        } else if (char === '}') {
            close();
            scopes.pop();
        } else {
            chunk += char;
        }
    }
    close();
    return found;
};

/** A value with its `var(--name)` references read from the same sheet, a few levels deep. */
const resolved = (value: string, values: Map<string, string>, depth = 0): string =>
    depth > 6
        ? value
        : value.replace(
              /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g,
              (_, name: string, fallback?: string) => {
                  const next = values.get(name) ?? fallback;
                  return next === undefined ? 'none' : resolved(next.trim(), values, depth + 1);
              },
          );

/** A see-through colour has no contrast of its own: a wash, a mix, anything with an alpha. */
const seeThrough = /color-mix|transparent|\/\s*[\d.]+%?\s*\)|rgba\(|hsla\(/i;

const named = (values: Map<string, string>): NamedColour[] => {
    const all = [...values.keys()];
    // A theme names its colours --color-*; a sheet without any is read whole.
    const names = all.some(name => name.startsWith('--color-'))
        ? all.filter(name => name.startsWith('--color-'))
        : all;
    return names.flatMap(property => {
        const value = resolved(values.get(property) ?? '', values);
        if (seeThrough.test(value)) return [];
        const color = readColour(value);
        if (!color) return [];
        const name = property.replace(/^--(color-)?/, '');
        const step = /^(.+)-(\d+)$/.exec(name);
        return [
            {
                name,
                group: step?.[1] ?? 'roles',
                label: step?.[2] ?? name,
                color,
            },
        ];
    });
};

/**
 * The colours of a pasted text. A stylesheet (an exported app.css, a shadcn globals.css, a few
 * `--name: value;` lines) gives its custom properties by name, in light and in dark; anything else
 * is read as a list of colours, numbered in the order given.
 */
export const readSource = (text: string): ColourSource => {
    const declared = customProperties(text);
    if (declared.length > 0) {
        const light = new Map<string, string>();
        const dark = new Map<string, string>();
        for (const item of declared) (item.dark ? dark : light).set(item.name, item.value);
        const inLight = named(light);
        if (inLight.length > 0 || dark.size > 0) {
            // Dark sets only what changes: the rest of the names keep their light values.
            const inDark = dark.size > 0 ? named(new Map([...light, ...dark])) : null;
            return {
                light: inLight.length > 0 ? inLight : (inDark ?? []),
                dark: inLight.length > 0 ? inDark : null,
                named: true,
            };
        }
    }
    const palette = parsePalette(text);
    return {
        light: palette.map((color, i) => ({
            name: String(i + 1),
            group: '',
            label: String(i + 1),
            color,
        })),
        dark: null,
        named: false,
    };
};

/* ---------- Colours in words ---------- */

/** A colour's name in a word, by its hue: what a person would call it across a table. */
export const hueName = (color: Oklch) => {
    if (color.c < 0.03) return color.l > 0.93 ? 'white' : color.l < 0.22 ? 'black' : 'grey';
    const hue = ((color.h % 360) + 360) % 360;
    if (hue < 15 || hue >= 325) return 'pink';
    if (hue < 37) return 'red';
    if (hue < 75) return color.l < 0.55 ? 'brown' : 'orange';
    if (hue < 115) return color.l < 0.6 ? 'olive' : 'yellow';
    if (hue < 165) return 'green';
    if (hue < 215) return 'teal';
    if (hue < 285) return 'blue';
    return 'purple';
};

/**
 * A name for every colour of a set, no two alike: two of a hue are the light and the dark one,
 * more are numbered in the order given.
 */
export const namesOf = (colors: readonly Oklch[]) => {
    const names = colors.map(hueName);
    return names.map((name, i) => {
        const same = names.flatMap((other, j) => (other === name ? [j] : []));
        if (same.length === 1) return name;
        const [first = 0, second = 0] = same;
        const a = colors[first];
        const b = colors[second];
        if (same.length === 2 && a && b && Math.abs(a.l - b.l) >= 0.05) {
            const lighter = a.l > b.l ? first : second;
            return `${i === lighter ? 'light' : 'dark'} ${name}`;
        }
        return `${name} ${same.indexOf(i) + 1}`;
    });
};

export const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
