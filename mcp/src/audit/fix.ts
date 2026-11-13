import type { Fact, Finding } from '../types';

/*
 * A fix written back in the form the value was found in, so an agent replaces like with like: a
 * utility class for a class, the same declaration in the same syntax for a declaration (the
 * variable where the syntax has variables, the literal where it has none), the token's value and
 * name for a bare literal, and a style patch for a rendered node. CSS and a Tailwind class always
 * come along, so an agent in any stack can pick the one it writes.
 */

/** What a value becomes, in each spelling a stack might need. */
export type Change = {
    /** In CSS, by the system's variable when it names one: 'var(--spacing-control)', '12px'. */
    css: string;
    /** Where there are no variables (QSS, QML, a canvas): '34px', '#d2d2d2', '500'. */
    raw: string;
    /** The utility class: 'h-control', 'bg-neutral-200', 'p-3'. */
    tailwind?: string;
    /** The token and its role, for a literal's comment: 'neutral-200 (hairline)'. */
    token?: string;
    /** Only this part of the written value changes (one length of a shorthand). */
    part?: string;
    /** Declarations that go with it: a removed shadow's hairline. */
    also?: Array<{ property: string; css: string; raw: string; tailwind?: string }>;
};

/**
 * Whether the place a value was written in can name a token. A stylesheet, a style object and a
 * class can; QSS and QML have no variables, so the token's value written out is already right.
 */
export const canName = (fact: Fact) => {
    const syntax = fact.written.syntax;
    return fact.written.form !== 'rendered' && syntax !== 'qss' && syntax !== 'qml';
};

const camel = (property: string) =>
    property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

/** The property as the source spelt it ('minHeight', 'font.pixelSize', '$brand'), else the canonical one. */
const writtenProperty = (fact: Fact) => {
    const match = /^\s*([\w.$@-]+)\s*:/.exec(fact.written.text);
    return match?.[1] ?? fact.property;
};

/** The whole new value: the changed part put back into what was written, or the value alone. */
const whole = (fact: Fact, value: string, change: Change) => {
    if (!change.part) return value;
    const index = fact.value.indexOf(change.part);
    if (index < 0) return value;
    return `${fact.value.slice(0, index)}${value}${fact.value.slice(index + change.part.length)}`;
};

const isColour = (raw: string) => /^#[0-9a-f]{3,8}$/i.test(raw);

/** QML's spelling: bare numbers, quoted colours, Font.Medium for a weight. */
const qmlValue = (fact: Fact, change: Change) => {
    if (fact.property === 'font-weight')
        return Number(change.raw) >= 500 ? 'Font.Medium' : 'Font.Normal';
    if (isColour(change.raw)) return `"${change.raw}"`;
    return whole(fact, change.raw, change).replace(/(\d)px\b/g, '$1');
};

const qmlLine = (fact: Fact, change: Change) => {
    const property = writtenProperty(fact);
    // font.bold: true has no 500; the weight is set instead.
    if (property === 'font.bold') return `font.bold: false; font.weight: ${qmlValue(fact, change)}`;
    return `${property}: ${qmlValue(fact, change)}`;
};

const cssLines = (property: string, value: string, change: Change, raw = false) =>
    [
        `${property}: ${value};`,
        ...(change.also ?? []).map(each => `${each.property}: ${raw ? each.raw : each.css};`),
    ].join(' ');

const tailwindOf = (change: Change) =>
    [change.tailwind, ...(change.also ?? []).map(each => each.tailwind)]
        .filter(Boolean)
        .join(' ') || undefined;

const canvasOf = (fact: Fact, change: Change) => {
    const patch: Record<string, string | number> = {};
    const raw = whole(fact, change.raw, change);
    patch[camel(fact.property)] = fact.property === 'font-weight' ? Number(raw) : raw;
    for (const each of change.also ?? []) patch[camel(each.property)] = each.raw;
    return JSON.stringify(patch);
};

/** The fix for a fact, in its own form first, then CSS and Tailwind. */
export const writeFix = (fact: Fact, change: Change): NonNullable<Finding['fix']> => {
    const fix: NonNullable<Finding['fix']> = {};
    const tailwind = tailwindOf(change);
    const css = cssLines(fact.property, whole(fact, change.css, change), change);
    switch (fact.written.form) {
        case 'utility':
            if (tailwind) fix.tailwind = tailwind;
            fix.css = css;
            break;
        case 'declaration': {
            const syntax = fact.written.syntax ?? 'css';
            const property = writtenProperty(fact);
            if (syntax === 'css')
                fix.css = cssLines(property, whole(fact, change.css, change), change);
            else if (syntax === 'qss')
                fix.qss = cssLines(property, whole(fact, change.raw, change), change, true);
            else if (syntax === 'qml') fix.code = qmlLine(fact, change);
            else {
                const lines = [
                    `${property}: '${whole(fact, change.css, change)}'`,
                    ...(change.also ?? []).map(each => `${camel(each.property)}: '${each.css}'`),
                ];
                fix.code = lines.join(', ');
            }
            if (!fix.css) fix.css = css;
            if (tailwind) fix.tailwind = tailwind;
            break;
        }
        case 'literal': {
            const named = change.token ? ` (${change.token})` : '';
            const variable = /var\(/.test(change.css)
                ? ` · ${change.css} where the code can read CSS variables`
                : '';
            fix.code = `${change.raw}${named}${variable}`;
            fix.css = css;
            if (tailwind) fix.tailwind = tailwind;
            break;
        }
        case 'rendered':
            fix.css = css;
            if (tailwind) fix.tailwind = tailwind;
            fix.canvas = canvasOf(fact, change);
            break;
    }
    return fix;
};
