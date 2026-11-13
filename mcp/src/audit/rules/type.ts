import { nearestSize } from '../../system/values';
import { writeFix } from '../fix';
import { findingFor, isReference, near, onePx, px, type Rule, sure } from './shared';

/*
 * Type: sizes on the scale, two weights, the theme's family (foundations.md › Type).
 */

export const typeSize: Rule = {
    id: 'type-size',
    applies: property => property === 'font-size',
    judge: (fact, { system }) => {
        if (fact.subject.picture || fact.subject.library) return null;
        const size = onePx(fact.value);
        if (size === null || size <= 0) return null;
        if (system.text.some(step => near(step.px, size))) return null;
        let target = nearestSize(system.text, size);
        // 12 sits between the meta size and the base: meta (a badge, a count) takes 11.
        if (near(size, 12)) {
            const meta = fact.subject.kind === 'badge';
            target = system.text.find(step => step.name === (meta ? 'xxs' : 'xs')) ?? target;
        }
        if (!target) return null;
        return findingFor(fact, {
            rule: 'type-size',
            severity: 'fix',
            confidence: sure(fact, Math.abs(target.px - size) <= 1 ? 'high' : 'medium'),
            found: px(size),
            expected: `${target.px}px (text-${target.name})`,
            why: 'Sizes are fixed steps: 11 · 13 (the base) · 14 · 16 · 18 · 20 · 24; most of a screen is 13 (foundations.md › Type › Scale).',
            fix: writeFix(fact, {
                css: `var(${target.variable})`,
                raw: `${target.px}px`,
                tailwind: `text-${target.name}`,
                token: `text-${target.name}`,
                part: fact.value.trim(),
            }),
        });
    },
};

/** A weight as a number: 600, bold → 700, normal → 400; null when it is not one. */
const weightOf = (value: string) => {
    const text = value.trim().toLowerCase();
    if (text === 'bold' || text === 'bolder' || text === 'true') return 700;
    if (text === 'normal') return 400;
    if (text === 'lighter') return 300;
    const number = Number(text);
    return Number.isFinite(number) && number >= 100 && number <= 1000 ? number : null;
};

export const weight: Rule = {
    id: 'weight',
    applies: property => property === 'font-weight',
    judge: fact => {
        if (fact.subject.picture || fact.subject.library || isReference(fact.value)) return null;
        const found = weightOf(fact.value);
        if (found === null || found === 400 || found === 500) return null;
        const target = found >= 450 ? 500 : 400;
        return findingFor(fact, {
            rule: 'weight',
            severity: 'fix',
            confidence: sure(fact, found >= 600 || found < 400 ? 'high' : 'medium'),
            found: `font-weight ${fact.value.trim()}`,
            expected: `${target} (font-${target === 500 ? 'medium' : 'normal'})`,
            why: 'Two weights, 400 and 500; never semibold or bold. Hierarchy comes from colour and weight, not size (foundations.md › Type › Weight and hierarchy).',
            fix: writeFix(fact, {
                css: String(target),
                raw: String(target),
                tailwind: target === 500 ? 'font-medium' : 'font-normal',
            }),
        });
    },
};

/** The first family named, without quotes or a 'Variable' suffix, lower case. */
const familyName = (family: string) =>
    (family.split(',')[0] ?? '')
        .replace(/["']/g, '')
        .replace(/\s+variable$/i, '')
        .trim()
        .toLowerCase();

/** Families that are right where they are: code, icons, emoji, the system's own stack. */
const exempt =
    /mono|courier|consolas|menlo|icon|symbol|emoji|lucide|material|awesome|inherit|^ui-sans-serif|^system-ui|^sans-serif|^-apple-system/i;

export const fontFamily: Rule = {
    id: 'font-family',
    applies: property => property === 'font-family',
    judge: (fact, { system }) => {
        if (fact.subject.picture || fact.subject.library || isReference(fact.value)) return null;
        const found = familyName(fact.value);
        if (!found || exempt.test(found) || exempt.test(fact.value)) return null;
        const theme = system.fontFamily.split(',')[0]?.replace(/["']/g, '').trim() ?? 'Geist';
        if (found === familyName(system.fontFamily)) return null;
        return findingFor(fact, {
            rule: 'font-family',
            severity: 'advise',
            confidence: sure(fact, 'medium'),
            found,
            expected: `${theme} (font-sans)`,
            why: "One family, the theme's; monospace only for code (foundations.md › Type › Family).",
            fix: writeFix(fact, {
                css: 'var(--font-sans)',
                raw: theme.replace(/\s+variable$/i, ''),
                tailwind: 'font-sans',
            }),
        });
    },
};
