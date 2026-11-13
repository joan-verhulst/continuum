import { writeFix } from '../fix';
import {
    colourToken,
    findingFor,
    floatingName,
    isReference,
    onePx,
    px,
    type Rule,
    sure,
    wordsOf,
} from './shared';

/*
 * One hairline weight, and shadows only on what floats (foundations.md › Surfaces and depth,
 * › Colour › Shadows).
 */

export const borderWidth: Rule = {
    id: 'border-width',
    applies: property =>
        /^border(-(top|right|bottom|left|block|inline)(-start|-end)?)?-width$/.test(property),
    judge: fact => {
        if (fact.subject.picture || fact.subject.library || isReference(fact.value)) return null;
        const width = onePx(fact.value);
        if (width === null || width <= 0 || width === 1 || width > 4) return null;
        // A tab's or a rail's 2px indicator is a mark, not a hairline; so is a selected tab's.
        if (
            width === 2 &&
            (fact.subject.role === 'tab' ||
                /\b(tab|selected|active|indicator|focus)\b/i.test(wordsOf(fact)))
        )
            return null;
        // Readers spell every side out, so the written text says whether one side was meant:
        // a single 2px side may still be an indicator the names did not reveal.
        const oneSide =
            /border-(top|right|bottom|left|block|inline|[trblxyse])\b/i.test(fact.written.text) ||
            /border(Top|Right|Bottom|Left)/.test(fact.written.text);
        const side = /^border-(top|right|bottom|left)-width$/.exec(fact.property)?.[1];
        return findingFor(fact, {
            rule: 'border-width',
            severity: 'fix',
            confidence: sure(fact, width === 2 && oneSide ? 'medium' : 'high'),
            found: px(width),
            expected: '1px (the hairline)',
            why: 'The hairline is 1px, always; there is no second border weight (foundations.md › Colour › Roles).',
            fix: writeFix(fact, {
                css: '1px',
                raw: '1px',
                tailwind: side ? `border-${side[0]}` : 'border',
                part: fact.value.trim(),
            }),
        });
    },
};

/** A ring drawn with box-shadow (0 0 0 1px): a border by another name. */
const isRing = (shadow: string) =>
    shadow
        .split(/,(?![^(]*\))/)
        .every(part =>
            /(^|\s)0(px)?\s+0(px)?\s+0(px)?\s+[\d.]+px/.test(
                part.replace(/rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+/gi, '').trim(),
            ),
        );

export const shadow: Rule = {
    id: 'shadow',
    applies: property => property === 'box-shadow',
    judge: (fact, { system, mode }) => {
        if (fact.subject.picture || fact.subject.library) return null;
        const value = fact.value.trim();
        if (!value || /^(none|0|initial|unset|inherit)$/i.test(value) || isReference(value))
            return null;
        if (/inset/.test(value) || isRing(value)) return null;
        const kind = fact.subject.kind ?? 'unknown';
        if (kind === 'floating' || floatingName.test(wordsOf(fact))) return null;
        // A theme with full elevation gives cards and controls a faint shadow of their own.
        if (/--shadow-card:\s*(?!none\b)[^\s;][^;]*;/.test(system.css)) return null;
        const hairline = colourToken(system, mode, 'neutral-200');
        return findingFor(fact, {
            rule: 'shadow',
            severity: 'fix',
            confidence: sure(fact, kind === 'unknown' ? 'medium' : 'high'),
            found: value.length > 60 ? `${value.slice(0, 59)}…` : value,
            expected: 'none, and a 1px neutral-200 hairline',
            why: 'Hairlines over shadows: a card, a button or a panel is the surface with a 1px neutral-200 border; only what floats (the dock, menus, popovers, dialogs, sheets) casts a shadow (foundations.md › Surfaces and depth, › Colour › Shadows).',
            fix: writeFix(fact, {
                css: 'none',
                raw: 'none',
                tailwind: 'shadow-none',
                also: [
                    {
                        property: 'border',
                        css: '1px solid var(--color-neutral-200)',
                        raw: `1px solid ${hairline?.hex ?? '#d2d2d2'}`,
                        tailwind: 'border border-neutral-200',
                    },
                ],
            }),
        });
    },
};
