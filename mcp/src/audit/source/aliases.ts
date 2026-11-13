import type { Written } from '../../types';

/*
 * The one table of spellings. Every syntax names the same few properties its own way (camelCase
 * in a style object, 'radius' and 'font.pixelSize' in QML, 'background' in QSS, 'cornerRadius' in
 * a modifier), and every value comes in its own units (8.dp, 10pt, a bare number). This file turns
 * them all into CSS: the property kebab-case with its sides spelt out, the value as CSS writes it.
 * Readers call it and judge nothing; the rules only ever see the CSS.
 */

export type Syntax = NonNullable<Written['syntax']>;

/** A property and value in CSS, after aliasing and shorthand expansion. */
export type Pair = { property: string; value: string };

const sides = ['top', 'right', 'bottom', 'left'] as const;
const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const;

/** CSS properties as JS writes them: backgroundColor → background-color. */
export const kebab = (name: string) =>
    name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`).replace(/^-/, '');

/**
 * Spellings that are not CSS's, keyed by the name lower-cased with dots kept. A function picks by
 * what the value sits on: QML's 'color' paints a Text's glyphs but a Rectangle's fill.
 */
const aliases: Record<string, string | ((text: boolean) => string)> = {
    // QML and Qt Quick.
    color: text => (text ? 'color' : 'background-color'),
    radius: 'border-radius',
    'font.pixelsize': 'font-size',
    'font.pointsize': 'font-size',
    'font.weight': 'font-weight',
    'font.bold': 'font-weight',
    'font.family': 'font-family',
    'font.letterspacing': 'letter-spacing',
    implicitheight: 'height',
    implicitwidth: 'width',
    'border.color': 'border-color',
    'border.width': 'border-width',
    spacing: 'gap',
    leftpadding: 'padding-left',
    rightpadding: 'padding-right',
    toppadding: 'padding-top',
    bottompadding: 'padding-bottom',
    horizontalpadding: 'padding-inline',
    verticalpadding: 'padding-block',
    lineheight: 'line-height',
    // Style objects (React Native, MUI's sx), modifiers and named arguments in code.
    paddinghorizontal: 'padding-inline',
    paddingvertical: 'padding-block',
    marginhorizontal: 'margin-inline',
    marginvertical: 'margin-block',
    cornerradius: 'border-radius',
    roundedcornershape: 'border-radius',
    rounding: 'border-radius',
    fontsize: 'font-size',
    pixelsize: 'font-size',
    pointsize: 'font-size',
    fontweight: 'font-weight',
    textcolor: 'color',
    foregroundcolor: 'color',
    foregroundstyle: 'color',
    contentcolor: 'color',
    containercolor: 'background-color',
    backgroundcolor: 'background-color',
    bordercolor: 'border-color',
    borderwidth: 'border-width',
    // Qt stylesheets.
    'gridline-color': 'border-top-color',
    'selection-background-color': 'background-color',
    'alternate-background-color': 'background-color',
    'selection-color': 'color',
    'placeholder-text-color': 'color',
    'grid-gap': 'gap',
    'grid-row-gap': 'row-gap',
    'grid-column-gap': 'column-gap',
};

/** The properties a rule can judge, in their CSS spelling. Everything else is not read. */
const known =
    /^(color|background(-color)?|border(-(top|right|bottom|left))?(-(color|width|style))?|border(-(top|bottom)-(left|right))?-radius|border-(start|end)-(start|end)-radius|outline(-(color|width))?|font(-(size|weight|family))?|line-height|letter-spacing|(min-|max-)?(height|width)|(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?|(row-|column-)?gap|box-shadow|opacity|fill|stroke|(caret|accent|text-decoration|column-rule)-color|position|z-index)$/;

/** The CSS property a spelling names, or null when no rule reads it. */
export const canonicalProperty = (name: string, text = false, syntax?: Syntax): string | null => {
    const raw = name.trim().replace(/^['"]|['"]$/g, '');
    if (raw.startsWith('--') || raw.startsWith('$') || raw.startsWith('@')) return null;
    // Only QML paints a box with 'color'; everywhere else it is the text's colour.
    if (raw === 'color' && syntax !== 'qml') return 'color';
    const alias = aliases[raw.toLowerCase()];
    if (alias) return typeof alias === 'function' ? alias(text) : alias;
    const css = raw.includes('-') ? raw.toLowerCase() : kebab(raw);
    return known.test(css) ? css : null;
};

/* ---------- Values ---------- */

/** Splits a value on spaces outside brackets: '0 calc(1px + 2px) #fff' → three parts. */
export const parts = (value: string) => {
    const out: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of value.trim()) {
        if (char === '(' || char === '[') depth++;
        if (char === ')' || char === ']') depth--;
        if (/\s/.test(char) && depth === 0) {
            if (current) out.push(current);
            current = '';
        } else current += char;
    }
    if (current) out.push(current);
    return out;
};

const lengthProperty =
    /^(font-size|line-height|letter-spacing|(min-|max-)?(height|width)|(padding|margin)(-.*)?|(row-|column-)?gap|border(-.*)?-(width|radius)|border-radius|outline-width)$/;

export const colourProperty = (property: string) => /(^|-)color$|^(fill|stroke)$/.test(property);

const weights: Record<string, number> = {
    thin: 100,
    hairline: 100,
    w100: 100,
    extralight: 200,
    ultralight: 200,
    w200: 200,
    light: 300,
    lighter: 300,
    w300: 300,
    normal: 400,
    regular: 400,
    book: 400,
    w400: 400,
    medium: 500,
    w500: 500,
    semibold: 600,
    demibold: 600,
    w600: 600,
    bold: 700,
    bolder: 700,
    w700: 700,
    extrabold: 800,
    ultrabold: 800,
    heavy: 800,
    w800: 800,
    black: 900,
    w900: 900,
};

/**
 * A weight in any spelling as its number: 600, 'bold', FontWeight.SemiBold, Font.DemiBold,
 * .semibold, FontWeight.w600, QML's font.bold: true.
 */
export const readWeight = (value: string): string | null => {
    const text = value.trim().replace(/^['"]|['"]$/g, '');
    if (/^\d{3}$/.test(text)) return text;
    if (text === 'true') return '700';
    if (text === 'false') return '400';
    const word = text.split(/[.\s]/).at(-1)?.toLowerCase().replace(/[-_]/g, '') ?? '';
    const weight = weights[word];
    return weight ? String(weight) : null;
};

/**
 * A length as CSS writes it. Units that mean a device pixel (dp, sp, a point in code, a bare
 * number outside CSS) become px; a point in a stylesheet is 4/3 of a px; CSS's own units stay.
 */
export const readLength = (value: string, syntax: Syntax): string | null => {
    const text = value.trim().replace(/^['"]|['"]$/g, '');
    if (/^(var|calc|min|max|clamp|env|theme)\(/.test(text)) return text;
    const unit = /^(-?\d*\.?\d+)\s*(\.?dp|\.?sp|\.?pt|f|px|rem|em|%|vh|vw|dvh|svh|ch)?$/.exec(text);
    if (!unit) return null;
    const number = Number(unit[1]);
    const suffix = (unit[2] ?? '').replace(/^\./, '');
    if (suffix === 'pt') {
        const px = syntax === 'css' || syntax === 'qss' ? (number * 4) / 3 : number;
        return `${Math.round(px * 100) / 100}px`;
    }
    if (!suffix || suffix === 'dp' || suffix === 'sp' || suffix === 'f') return `${number}px`;
    return `${number}${suffix}`;
};

/** A colour written in code, as CSS: Color(0xFF3B82F6) → #3b82f6. Null when it is not one. */
export type CodeColour = (text: string) => string | null;

/**
 * One value in CSS syntax for its property, or null when it is not one a rule can read (an
 * expression, a binding). Quotes go; the colour reader turns code forms into CSS.
 */
export const normaliseValue = (
    property: string,
    raw: string,
    syntax: Syntax,
    codeColour?: CodeColour,
): string | null => {
    let value = raw
        .trim()
        .replace(/\s*!important$/, '')
        .replace(/[,;]$/, '')
        .trim();
    if (!value) return null;
    if (/^(['"`]).*\1$/s.test(value)) value = value.slice(1, -1).trim();
    if (property === 'font-weight') return readWeight(value);
    if (property === 'font-family' || property === 'box-shadow' || property === 'position')
        return value;
    if (property === 'opacity' || property === 'z-index') return value;
    if (colourProperty(property)) return codeColour?.(value) ?? value;
    if (property === 'line-height' && /^\d*\.?\d+$/.test(value) && Number(value) < 4) return value;
    if (lengthProperty.test(property)) {
        // A value bound to an expression is not one the source states: it reads as null.
        const pieces = parts(value);
        if (pieces.length > 1)
            return pieces.map(piece => readLength(piece, syntax) ?? piece).join(' ');
        return readLength(value, syntax);
    }
    return value;
};

/* ---------- Shorthands ---------- */

const colourWord =
    /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|var)\(.*\)|[a-z]+)$/i;
const lengthWord = /^-?\d*\.?\d+[a-z%]*$|^(var|calc|min|max|clamp)\(/i;
const styleWord = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/;

/** Four sides from one to four values, as CSS spreads them. */
const four = (values: string[]) => {
    const [a = '', b = a, c = a, d = b] = values;
    return [a, b, c, d];
};

const borderParts = (value: string) => {
    let width: string | undefined;
    let style: string | undefined;
    let color: string | undefined;
    for (const part of parts(value)) {
        if (styleWord.test(part)) style = part;
        else if (lengthWord.test(part) && !part.startsWith('var(')) width = part;
        else if (/^(thin|medium|thick)$/.test(part)) width = part;
        else if (colourWord.test(part)) color = part;
    }
    return { width, style, color };
};

/**
 * A property and its value as the CSS longhands a rule reads: padding to four sides, border to
 * its width, style and colour per side, border-radius per corner, font to its size and weight,
 * background to its colour. A property no rule reads comes back empty.
 */
export const expand = (property: string, value: string): Pair[] => {
    const out: Pair[] = [];
    const add = (name: string, text: string | undefined) => {
        if (text !== undefined && text !== '') out.push({ property: name, value: text });
    };
    const box = /^(padding|margin)$/.exec(property);
    if (box) {
        for (const [index, part] of four(parts(value)).entries())
            add(`${box[1]}-${sides[index]}`, part);
        return out;
    }
    const axis = /^(padding|margin)-(inline|block)(-(start|end))?$/.exec(property);
    if (axis) {
        const [first = '', second = first] = parts(value);
        const [start, end] = axis[2] === 'inline' ? ['left', 'right'] : ['top', 'bottom'];
        if (axis[4] !== 'end') add(`${axis[1]}-${start}`, first);
        if (axis[4] !== 'start') add(`${axis[1]}-${end}`, axis[4] ? first : second);
        return out;
    }
    if (property === 'gap') {
        const [row = '', column] = parts(value);
        if (column) {
            add('row-gap', row);
            add('column-gap', column);
        } else add('gap', row);
        return out;
    }
    const border = /^border(-(top|right|bottom|left))?$/.exec(property);
    if (border) {
        const { width, style, color } = borderParts(value);
        for (const side of border[2] ? [border[2]] : sides) {
            add(`border-${side}-width`, width);
            add(`border-${side}-style`, style);
            add(`border-${side}-color`, color);
        }
        return out;
    }
    const each = /^border-(color|width|style)$/.exec(property);
    if (each) {
        for (const [index, part] of four(parts(value)).entries())
            add(`border-${sides[index]}-${each[1]}`, part);
        return out;
    }
    if (property === 'border-radius') {
        const [horizontal = ''] = value.split('/');
        for (const [index, part] of four(parts(horizontal)).entries())
            add(`border-${corners[index]}-radius`, part);
        return out;
    }
    const logical = /^border-(start|end)-(start|end)-radius$/.exec(property);
    if (logical) {
        const corner = `${logical[1] === 'start' ? 'top' : 'bottom'}-${logical[2] === 'start' ? 'left' : 'right'}`;
        add(`border-${corner}-radius`, value);
        return out;
    }
    if (property === 'outline') {
        const { width, color } = borderParts(value);
        add('outline-width', width);
        add('outline-color', color);
        return out;
    }
    if (property === 'background') {
        // Only the colour of a background is read; an image or a gradient keeps its own stops.
        const colours = parts(value).filter(
            part =>
                colourWord.test(part) &&
                !/^(none|no-repeat|repeat|center|cover|contain|fixed|scroll|url)/.test(part),
        );
        const colour = colours.at(-1);
        if (colour) add('background-color', colour);
        return out;
    }
    if (property === 'font') {
        const words = parts(value);
        const size = words.findIndex(
            word => /^\d*\.?\d+(px|pt|rem|em|%)?(\/.*)?$/.test(word) && !/^\d{3}$/.test(word),
        );
        for (const word of words.slice(0, Math.max(size, 0))) {
            const weight = readWeight(word);
            if (weight && word !== 'normal') add('font-weight', weight);
        }
        if (size >= 0) {
            const [fontSize, lineHeight] = (words[size] ?? '').split('/');
            add('font-size', fontSize);
            add('line-height', lineHeight);
            add('font-family', words.slice(size + 1).join(' '));
        }
        return out;
    }
    add(property, value);
    return out;
};

/**
 * A written property and value as the CSS pairs a rule reads: the spelling aliased, the shorthand
 * expanded, each value normalised. Empty when nothing in it is read.
 */
export const toCss = (
    name: string,
    raw: string,
    syntax: Syntax,
    { text = false, codeColour }: { text?: boolean; codeColour?: CodeColour } = {},
): Pair[] => {
    const property = canonicalProperty(name, text, syntax);
    if (!property) return [];
    let value = raw
        .trim()
        .replace(/\s*!important$/, '')
        .replace(/[,;]$/, '')
        .trim();
    if (/^(['"`]).*\1$/s.test(value)) value = value.slice(1, -1).trim();
    if (!value) return [];
    const out: Pair[] = [];
    for (const pair of expand(property, value)) {
        const normal = normaliseValue(pair.property, pair.value, syntax, codeColour);
        if (normal !== null && normal !== '') out.push({ property: pair.property, value: normal });
    }
    return out;
};
