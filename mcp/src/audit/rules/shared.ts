import { deltaE, hexToOklch } from 'continuum';
import {
    type ColourToken,
    readColour,
    type SizeToken,
    type SystemValues,
    toPx,
} from '../../system/values';
import type { Confidence, Fact, Finding, Mode } from '../../types';

/*
 * What every rule over a fact shares: the context it is handed, how a finding is written from a
 * fact, how sure a judgement is, and the lookups from a value to the system's name for it. No
 * rule here knows a stack: they read a property, a value in CSS syntax and what it sits on.
 */

export type RuleContext = { system: SystemValues; mode: Mode };

/** One rule: a fact in, one finding or nothing out. */
export type Rule = {
    id: string;
    /** The canonical properties the rule reads. */
    applies: (property: string) => boolean;
    judge: (fact: Fact, context: RuleContext) => Finding | null;
};

/** How a person finds what the value sits on: its name, its tag, or the text as written. */
export const nodeOf = (fact: Fact) => {
    const { name, tag } = fact.subject;
    const short = name && name.length > 50 ? `${name.slice(0, 49)}…` : name;
    if (short && tag && !short.includes(tag)) return `${tag} "${short}"`;
    return short ?? tag;
};

export const findingFor = (fact: Fact, fields: Omit<Finding, 'at' | 'node' | 'property'>) => {
    const out: Finding = { at: fact.at, property: fact.property, ...fields };
    const node = nodeOf(fact);
    if (node) out.node = node;
    return out;
};

const steps: Confidence[] = ['high', 'medium', 'low'];

/** One step less sure: a guess, or a kind the rule needs that the reader could not tell. */
export const lower = (confidence: Confidence, by = 1): Confidence =>
    steps[Math.min(steps.length - 1, steps.indexOf(confidence) + by)] as Confidence;

/** The confidence a rule gives, less one step for a guessed fact and one if it needs the kind. */
export const sure = (fact: Fact, confidence: Confidence, needsKind = false) => {
    let by = fact.guessed ? 1 : 0;
    if (needsKind && (fact.subject.kind ?? 'unknown') === 'unknown') by += 1;
    return lower(confidence, by);
};

/* ---------- Reading a value ---------- */

/** A token by reference: var(--color-…), var(--spacing-control), theme(…). Not judged. */
export const isReference = (value: string) => /\bvar\(|\btheme\(|\$[\w-]+|@[\w-]+/.test(value);

export const isKeyword = (value: string) =>
    /^\s*(inherit|initial|unset|revert|currentcolor|transparent|none|auto|normal)\s*$/i.test(value);

/** The lengths a value holds, as written and in px: '8px 12px' → two, '0.5rem' → 8. */
export const lengthsIn = (value: string) =>
    [...value.matchAll(/(^|[\s(,])(-?\d*\.?\d+)(px|rem)?(?=$|[\s),])/g)]
        .map(match => {
            const text = `${match[2]}${match[3] ?? ''}`;
            const px = match[3] === 'rem' ? Number(match[2]) * 16 : Number(match[2]);
            return { text, px, index: (match.index ?? 0) + (match[1]?.length ?? 0) };
        })
        .filter(length => Number.isFinite(length.px));

/** One length in px; null for a percentage, a keyword, a reference or more than one length. */
export const onePx = (value: string): number | null => {
    if (
        isReference(value) ||
        /%|vh|vw|em\b|fr\b|calc|fit-content|min-content|max-content/.test(value)
    )
        return /^\s*[\d.]+rem\s*$/.test(value) ? toPx(value) : null;
    const lengths = lengthsIn(value.trim());
    return lengths.length === 1 ? (lengths[0]?.px ?? null) : null;
};

export const px = (value: number) => `${Math.round(value * 10) / 10}px`;

export const near = (a: number, b: number, tolerance = 0.5) => Math.abs(a - b) <= tolerance;

/** Words that name a thing quiet on purpose: disabled, an icon, a placeholder glyph. */
export const quietName = /disabled|\bicon\b|svg|lucide|glyph/i;

/** Names that mark a thing that floats over the page, where a shadow belongs. */
export const floatingName =
    /popover|dialog|modal|menu|dropdown|toast|tooltip|sheet|drawer|popup|overlay|command|listbox|dock|float|composer|hovercard|flyout|snackbar|knob|thumb/i;

/** Words that mark a field rather than a button, whatever the stack calls it. */
export const fieldName =
    /input|select|textarea|textfield|textbox|searchbox|combobox|field|search|lineedit|spinbox|dateedit|textedit/i;

/** The subject's words, for the few judgements that read names: field or button, floating. */
export const wordsOf = (fact: Fact) =>
    `${fact.subject.tag ?? ''} ${fact.subject.role ?? ''} ${fact.subject.name ?? ''}`;

/* ---------- The system's names ---------- */

export const colourToken = (system: SystemValues, mode: Mode, name: string) =>
    system.colours[mode].find(token => token.name === name);

export const sizeToken = (system: SystemValues, name: string, fallback: number): SizeToken =>
    system.sizes.find(token => token.name === name) ?? {
        name,
        variable: `--spacing-${name}`,
        px: fallback,
    };

/** The corners a written radius can become: the nesting set, not dock, pill or full. */
export const corners = (system: SystemValues) =>
    system.radii.filter(radius =>
        ['chip', 'item', 'control', 'card', 'panel'].includes(radius.name),
    );

/** The nearest of some named sizes; between two, the larger (8 is item 10, not chip 6). */
export const nearestOf = <T extends SizeToken>(tokens: Array<T | undefined>, value: number) =>
    tokens
        .filter((token): token is T => Boolean(token))
        .reduce<T | undefined>((best, token) => {
            if (!best) return token;
            const gap = Math.abs(token.px - value) - Math.abs(best.px - value);
            return gap < 0 || (gap === 0 && token.px > best.px) ? token : best;
        }, undefined);

/** The nearest neutral step of those named (all of them by default), matched by how it looks. */
export const nearestNeutral = (
    system: SystemValues,
    mode: Mode,
    hex: string,
    among?: string[],
): { token: ColourToken; distance: number } | null => {
    const oklch = hexToOklch(hex);
    if (!oklch) return null;
    let best: { token: ColourToken; distance: number } | null = null;
    for (const token of system.colours[mode]) {
        if (!/^neutral-\d+$/.test(token.name) || (among && !among.includes(token.name))) continue;
        const distance = deltaE(oklch, token.oklch);
        if (!best || distance < best.distance) best = { token, distance };
    }
    return best;
};

export const chroma = (value: string) => {
    const colour = readColour(value);
    return colour ? (hexToOklch(colour.hex)?.c ?? 0) : 0;
};
