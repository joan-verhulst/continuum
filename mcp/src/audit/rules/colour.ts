import { deltaE, hexToOklch } from '@contui/ui';
import {
    type ColourToken,
    describeToken,
    nearestColour,
    readColour,
    roleOf,
    type SystemValues,
} from '../../system/values';
import type { Fact, Finding, Mode } from '../../types';
import { canName, writeFix } from '../fix';
import {
    chroma,
    colourToken,
    fieldName,
    findingFor,
    isKeyword,
    isReference,
    nearestNeutral,
    quietName,
    type Rule,
    sure,
    wordsOf,
} from './shared';

/*
 * Colour: every fill, border and text is a role of the theme (foundations.md › Colour › Roles).
 * The token a colour becomes is chosen by look and then by what it paints: a grey border is the
 * hairline, grey text a text step, a saturated fill on a control the action colour, a red the
 * error ramp. A colour a breath away from a token snaps to it; one far from every token is a
 * colour of its own (a brand's, a chart's), asked about rather than replaced.
 */

type Paint = 'text' | 'background' | 'border' | 'other';

const paintOf = (property: string): Paint | null => {
    if (property === 'color' || /^(caret|text-decoration|placeholder)-color$/.test(property))
        return 'text';
    if (property === 'background-color') return 'background';
    if (/^border(-(top|right|bottom|left|block|inline)(-start|-end)?)?-color$/.test(property))
        return 'border';
    if (/^(outline|column-rule)-color$/.test(property)) return 'border';
    if (property === 'fill' || property === 'stroke' || property === 'accent-color') return 'other';
    return null;
};

/** The Tailwind prefix for a colour property: bg, text, border-t, outline, fill … */
const tailwindPrefix = (property: string) => {
    if (property === 'background-color') return 'bg';
    if (property === 'color') return 'text';
    const side = /^border-(top|right|bottom|left)-color$/.exec(property)?.[1];
    if (side) return `border-${side[0]}`;
    if (/^border(-(block|inline)(-start|-end)?)?-color$/.test(property)) return 'border';
    if (property === 'outline-color') return 'outline';
    if (property === 'text-decoration-color') return 'decoration';
    if (property === 'caret-color') return 'caret';
    if (property === 'accent-color') return 'accent';
    if (property === 'fill' || property === 'stroke') return property;
    return undefined;
};

const why =
    'Every colour is a role of the theme, read by its name, never a value of its own (foundations.md › Colour › Roles, › Never).';

/** The steps text is written in: the surface (on a dark fill), secondary, quieter body, value, primary. */
const textSteps = ['neutral-50', 'neutral-600', 'neutral-700', 'neutral-900', 'neutral-950'];

/** The ramps a saturated colour can belong to; anything else is a second accent. */
const ramps = ['primary', 'error', 'success', 'warning'] as const;

const isControl = (fact: Fact) =>
    fact.subject.kind === 'control' || fact.subject.kind === 'icon-control';

/** Grey text lighter than neutral-600 (300 to 500): text-tone's to report. */
export const isPaleText = (fact: Fact, system: SystemValues, mode: Mode) => {
    if (
        fact.property !== 'color' ||
        fact.subject.picture ||
        quietName.test(fact.subject.name ?? '') ||
        // Disabled text is exempt, whatever names it (foundations.md › Colour › Roles).
        /(^|[:\s-])disabled\b|aria-disabled/.test(fact.written.text)
    )
        return false;
    // The theme's own pale greys, by name: on the ramp, and still too light to read.
    const named = /^var\(--color-(neutral-\d+)\)$/.exec(fact.value.trim())?.[1];
    if (named) return /^neutral-(300|400|500)$/.test(named);
    const colour = readColour(fact.value);
    if (!colour || colour.alpha < 0.5 || chroma(fact.value) > 0.04) return false;
    const match = nearestNeutral(system, mode, colour.hex);
    return Boolean(match && /^neutral-(300|400|500)$/.test(match.token.name));
};

/** A wash or a status tint, translucent by design: neutral-950 at a few percent, a tone's 500 at 20%. */
const isKnownWash = (system: SystemValues, mode: Mode, value: string) => {
    const colour = readColour(value);
    const oklch = colour && hexToOklch(colour.hex);
    if (!colour || !oklch) return false;
    if (colour.alpha <= 0.12 && oklch.c < 0.03) return true;
    if (colour.alpha >= 0.35 && colour.alpha <= 0.45 && oklch.l < 0.1) return true;
    const solid = nearestColour(system, mode, colour.hex);
    return Boolean(
        solid &&
            solid.distance < 6 &&
            /-500$/.test(solid.token.name) &&
            Math.abs(colour.alpha - 0.2) < 0.06,
    );
};

const hueGap = (a: number, b: number) => {
    const gap = Math.abs(a - b) % 360;
    return gap > 180 ? 360 - gap : gap;
};

/** The ramp a saturated colour's hue belongs to (blue, indigo, sky → primary; red → error …). */
const rampOf = (system: SystemValues, mode: Mode, hue: number, status = true) => {
    let best: { ramp: (typeof ramps)[number]; gap: number } | null = null;
    for (const ramp of ramps) {
        // A status ramp is only for a status: elsewhere its hue is a second accent.
        if (!status && ramp !== 'primary') continue;
        const anchor = colourToken(system, mode, `${ramp}-500`);
        if (!anchor) continue;
        const gap = hueGap(hue, anchor.oklch.h);
        if (!best || gap < best.gap) best = { ramp, gap };
    }
    return best && best.gap <= 40 ? best.ramp : undefined;
};

const nearestAmong = (
    system: SystemValues,
    mode: Mode,
    hex: string,
    keep: (token: ColourToken) => boolean,
) => {
    const oklch = hexToOklch(hex);
    if (!oklch) return null;
    let best: { token: ColourToken; distance: number } | null = null;
    for (const token of system.colours[mode]) {
        if (token.alpha < 0.99 || !keep(token)) continue;
        const distance = deltaE(oklch, token.oklch);
        if (!best || distance < best.distance) best = { token, distance };
    }
    return best;
};

/**
 * Of the tokens that share a value, the one a person would write: the action colour on a filled
 * control, on-action on its label, otherwise a ramp step before a part's own token.
 */
const twin = (system: SystemValues, mode: Mode, token: ColourToken, paint: Paint, fact: Fact) => {
    const twins = system.colours[mode].filter(
        each => each.hex === token.hex && Math.abs(each.alpha - token.alpha) < 0.01,
    );
    const want =
        paint === 'background' && isControl(fact)
            ? 'action'
            : paint === 'text' && isControl(fact)
              ? 'on-action'
              : undefined;
    return (
        twins.find(each => each.name === want) ??
        twins.find(each => /^(neutral|primary|success|warning|error)-\d+$/.test(each.name)) ??
        twins.find(each => ['action', 'on-action', 'selected', 'tint'].includes(each.name)) ??
        token
    );
};

/**
 * A token chosen by role (the action colour, the hairline, a ramp by its hue) is a fix however
 * far it looks; a second accent is advice, whatever is nearest.
 */
type Choice = {
    token: ColourToken;
    distance: number;
    reason: string;
    byRole?: boolean;
    accent?: boolean;
};

/** Words that say a colour means a state: only there may a status ramp be used. */
const statusWords =
    /(^|[^a-z])(status|state|error|errors|danger|destructive|invalid|alert|warning|warn|success|positive|negative|delta|trend|badge|toast|overdue|failed|paid)([^a-z]|$)/i;

const inStatus = (fact: Fact) => fact.subject.kind === 'badge' || statusWords.test(wordsOf(fact));

/** A field's box (an input, a select), whose fill is the surface whatever else it is. */
const isField = (fact: Fact) =>
    isControl(fact) &&
    (fieldName.test(wordsOf(fact)) || /^(input|select|textarea)$/i.test(fact.subject.tag ?? ''));

const accentWhy =
    'One accent: the primary ramp and the action colour, and status colours only for status. A hue of its own, or a status hue on something that is no status, is a second accent: a brand or data colour, or a mistake (foundations.md › Colour › Never, › Status colour).';

/** Text by its role: primary (neutral-950), secondary (neutral-600), or the surface on a dark fill. */
const textByRole = (system: SystemValues, mode: Mode, lightness: number) =>
    colourToken(
        system,
        mode,
        lightness > 0.75 ? 'neutral-50' : lightness >= 0.34 ? 'neutral-600' : 'neutral-950',
    );

/** The token a solid colour becomes, by what it paints first, then by how it looks. */
const choose = (
    system: SystemValues,
    mode: Mode,
    fact: Fact,
    hex: string,
    paint: Paint,
): Choice | null => {
    const oklch = hexToOklch(hex);
    if (!oklch) return null;
    const status = inStatus(fact);
    const ramp = rampOf(system, mode, oklch.h, status);
    const by = (token: ColourToken | undefined, reason: string): Choice | null =>
        token ? { token, distance: deltaE(oklch, token.oklch), reason, byRole: true } : null;

    // A border is the hairline, whatever its hue: unless it marks a state or the focus.
    if (paint === 'border' && !(status && ramp && ramp !== 'primary')) {
        if (/focus|ring/.test(fact.written.text) || fact.property === 'outline-color')
            return by(
                colourToken(system, mode, 'neutral-500'),
                `${why} The focus ring is neutral-500 (foundations.md › Colour › Focus).`,
            );
        const nearest = nearestNeutral(system, mode, hex);
        const keep =
            oklch.c <= 0.05 &&
            nearest &&
            ['neutral-300', 'neutral-500'].includes(nearest.token.name);
        return by(
            colourToken(
                system,
                mode,
                keep ? (nearest?.token.name ?? 'neutral-200') : 'neutral-200',
            ),
            `${why} Every border is the 1px neutral-200 hairline; neutral-300 only on hover and unchecked marks.`,
        );
    }
    // A field's fill is the surface: an input reads as part of the page.
    if (paint === 'background' && isField(fact))
        return by(
            colourToken(system, mode, 'neutral-50'),
            `${why} A field is the surface with the hairline (foundations.md › Surfaces and depth).`,
        );

    // A grey is a grey; a pale tint is one too, unless it sits on a coloured token of its hue.
    const near = nearestColour(system, mode, hex);
    const tinted =
        near &&
        near.distance < 6 &&
        !/^neutral-/.test(near.token.name) &&
        oklch.c >= 0.008 &&
        hueGap(oklch.h, near.token.oklch.h) <= (status ? 40 : 20);
    if (oklch.c <= 0.05 && !tinted) {
        const nearest = nearestNeutral(system, mode, hex);
        if (!nearest) return null;
        if (paint === 'text') {
            const exact = nearestNeutral(system, mode, hex, textSteps);
            if (exact && exact.distance < 2) return { ...exact, reason: why };
            return by(
                textByRole(system, mode, oklch.l),
                `${why} Text is primary (neutral-950) or secondary (neutral-600) (foundations.md › Colour › Roles).`,
            );
        }
        if (paint === 'background' && oklch.l < 0.3)
            return by(
                colourToken(system, mode, isControl(fact) ? 'action' : 'neutral-950'),
                `${why} A dark fill is neutral-950, the step primary text and the action colour are drawn from.`,
            );
        return { ...nearest, reason: why };
    }
    // Coloured text that means no state is text all the same: primary or secondary.
    if (paint === 'text' && !status && !fact.guessed && fact.subject.text)
        return by(
            // A control's label is primary text, whatever colour it was given.
            isControl(fact) && oklch.l <= 0.75
                ? colourToken(system, mode, 'neutral-950')
                : textByRole(system, mode, oklch.l),
            `${why} Text is primary (neutral-950) or secondary (neutral-600); colour in text is for a state only (foundations.md › Colour › Roles, › Status colour).`,
        );
    // A filled button in a colour of its own is the one primary action; a pale one is a tint.
    const action = colourToken(system, mode, 'action');
    const destructive = status && ramp === 'error';
    if (
        paint === 'background' &&
        isControl(fact) &&
        action &&
        !destructive &&
        (oklch.c > 0.08 || oklch.l < 0.5)
    ) {
        return by(
            action,
            'One colour does everything that acts: a filled button takes the action colour, and nothing else does (foundations.md › Colour › The action colour).',
        );
    }
    if (!ramp) {
        const nearest =
            paint === 'text'
                ? (() => {
                      const token = textByRole(system, mode, oklch.l);
                      return token ? { token, distance: deltaE(oklch, token.oklch) } : null;
                  })()
                : nearestAmong(system, mode, hex, token =>
                      /^(neutral|primary)-\d+$/.test(token.name),
                  );
        if (!nearest) return null;
        return {
            ...nearest,
            distance: Math.max(nearest.distance, 12.5),
            reason: accentWhy,
            accent: true,
        };
    }
    const inRamp = nearestAmong(system, mode, hex, token => token.name.startsWith(`${ramp}-`));
    if (!inRamp) return null;
    return {
        ...inRamp,
        byRole: true,
        reason:
            ramp === 'primary'
                ? why
                : `${why} ${ramp[0]?.toUpperCase()}${ramp.slice(1)} colour is for ${ramp} states only (foundations.md › Status colour).`,
    };
};

const change = (fact: Fact, token: ColourToken) => {
    const prefix = tailwindPrefix(fact.property);
    return writeFix(fact, {
        css: `var(${token.variable})`,
        raw: token.hex,
        tailwind: prefix ? `${prefix}-${token.name}` : undefined,
        token: roleOf(token.name) ? `${token.name}, ${roleOf(token.name)}` : token.name,
    });
};

const judgeColour = (
    fact: Fact,
    { system, mode }: Parameters<Rule['judge']>[1],
): Finding | null => {
    const paint = paintOf(fact.property);
    if (!paint || fact.subject.picture || fact.subject.library) return null;
    const value = fact.value.trim();
    if (isReference(value) || isKeyword(value)) return null;
    const colour = readColour(value);
    if (!colour || colour.alpha <= 0.01) return null;
    if (isPaleText(fact, system, mode)) return null;
    const exact = nearestColour(system, mode, value);

    if (colour.alpha < 0.99) {
        if (isKnownWash(system, mode, value)) return null;
        if (exact && exact.distance < 2) {
            if (!canName(fact)) return null;
            return findingFor(fact, {
                rule: 'colour',
                severity: 'fix',
                confidence: sure(fact, 'high'),
                found: value,
                expected: `${describeToken(exact.token.name)}, the same colour by its name`,
                why,
                fix: change(fact, exact.token),
            });
        }
        return findingFor(fact, {
            rule: 'colour',
            severity: 'advise',
            confidence: 'low',
            found: value,
            expected:
                'a wash (neutral-950 at 5%, 7% as selected) or a status tint (a tone’s 500 at 20%)',
            why: 'Hover and selection are a translucent neutral-950, status a tone’s 500 at 20% (foundations.md › Washes, › Status colour).',
        });
    }

    const choice = choose(system, mode, fact, colour.hex, paint);
    // A token's own value, unless it is the wrong role for what it paints (neutral-100 as a border).
    const sameRole = !choice || choice.token.hex === exact?.token.hex;
    if (exact && exact.distance < 2 && sameRole) {
        const token = twin(system, mode, exact.token, paint, fact);
        if (!canName(fact)) {
            // Where no variable can be named the literal is the token, so it should be its exact
            // value; a rendered value is what the theme drew, rounding and all.
            if (
                fact.written.form === 'rendered' ||
                colour.hex.toLowerCase() === token.hex.toLowerCase()
            )
                return null;
            return findingFor(fact, {
                rule: 'colour',
                severity: 'fix',
                confidence: sure(fact, 'medium'),
                found: value,
                expected: `${describeToken(token.name)} ${token.hex}, the token's exact value`,
                why,
                fix: change(fact, token),
            });
        }
        return findingFor(fact, {
            rule: 'colour',
            severity: 'fix',
            confidence: sure(fact, 'high'),
            found: value,
            expected: `${describeToken(token.name)} ${token.hex}, the same colour by its name`,
            why,
            fix: change(fact, token),
        });
    }

    if (!choice) return null;
    const token = twin(system, mode, choice.token, paint, fact);
    const { distance } = choice;
    const expected = `${describeToken(token.name)} ${token.hex}`;
    if (choice.accent) {
        return findingFor(fact, {
            rule: 'colour',
            severity: 'advise',
            confidence: 'low',
            found: value,
            expected: `one accent: ${expected}, or the colour left out`,
            why: `A second accent: a brand or data colour? If not, use ${token.name}. ${choice.reason}`,
            fix: change(fact, token),
        });
    }
    if (distance > 12 && !choice.byRole) {
        return findingFor(fact, {
            rule: 'colour',
            severity: 'advise',
            confidence: 'low',
            found: value,
            expected,
            why: `A colour of its own, far from every token: a brand or data colour? If not, use ${token.name}. ${choice.reason}`,
            fix: change(fact, token),
        });
    }
    return findingFor(fact, {
        rule: 'colour',
        severity: 'fix',
        confidence: sure(
            fact,
            distance < 6 || (choice.byRole && distance < 12) ? 'high' : 'medium',
        ),
        found: value,
        expected,
        why: choice.reason,
        fix: change(fact, token),
    });
};

export const colourRole: Rule = {
    id: 'colour',
    applies: property => paintOf(property) !== null,
    judge: judgeColour,
};

export const textTone: Rule = {
    id: 'text-tone',
    applies: property => property === 'color',
    judge: (fact, { system, mode }) => {
        if (fact.subject.library || !isPaleText(fact, system, mode)) return null;
        const secondary = colourToken(system, mode, 'neutral-600');
        if (!secondary) return null;
        return findingFor(fact, {
            rule: 'text-tone',
            severity: 'fix',
            confidence: sure(fact, 'high'),
            found: fact.value.trim(),
            expected: `${describeToken('neutral-600')} ${secondary.hex}`,
            why: 'neutral-600 is the lightest text there is (4.5:1 on the surface); hints, placeholders and meta are told apart by size and place, not a paler grey (foundations.md › Colour › Roles).',
            fix: change(fact, secondary),
        });
    },
};
