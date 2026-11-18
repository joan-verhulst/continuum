import { nearestSize, type SystemValues } from '../../system/values';
import type { Fact } from '../../types';
import { writeFix } from '../fix';
import { findingFor, isReference, near, onePx, px, type Rule, sure } from './shared';

/*
 * Type: sizes on the scale, two weights, the theme's family (foundations.md › Type).
 */

/**
 * The size a text takes by what it is, when its name says: a page title 24, a section title 16, a
 * dialog's or sheet's title 14, a KPI value 18, a card title or a description 13
 * (foundations.md › Type › Scale; pages.md › The page head, › A section).
 */
const roleSizes: Array<[RegExp, string, string]> = [
    [/^h1$|\bpage[\s_-]?title\b|\bPageTitle\b/i, '2xl', 'a page title'],
    [/^(h2|h3)$|\bsection[\s_-]?title\b|\bSectionTitle\b/i, 'base', 'a section title'],
    [
        /\b(dialog|sheet|modal)[\s_-]?title\b|\b(Dialog|Sheet)Title\b/i,
        'sm',
        'a dialog or sheet title',
    ],
    [/\b(kpi|stat|metric)[\s_-]?value\b|\b(CardValue|StatValue)\b/i, 'lg', 'a KPI value'],
    [/\bcard[\s_-]?title\b|\bCardTitle\b|\bdescription\b|\bhint\b|\bhelper\b/i, 'xs', 'card text'],
];

/** The step a text's role gives it, and the role, when its tag or name says what it is. */
const roleOf = (fact: Fact, system: SystemValues) => {
    const tag = fact.subject.tag ?? '';
    const names = `${fact.subject.name ?? ''}`;
    for (const [pattern, name, role] of roleSizes) {
        if (!pattern.test(tag) && !pattern.test(names)) continue;
        const step = system.text.find(each => each.name === name);
        if (step) return { step, role };
    }
    return undefined;
};

/** The page title is the largest text in tool UI; above it is a marketing page's. */
const largest = 24;

const scaleWhy =
    'Sizes are fixed steps: 11 · 13 (the base) · 14 · 16 · 18 · 20 · 24; most of a screen is 13 (foundations.md › Type › Scale).';

export const typeSize: Rule = {
    id: 'type-size',
    applies: property => property === 'font-size',
    judge: (fact, { system }) => {
        if (fact.subject.picture || fact.subject.library) return null;
        // A size the theme names (text-4xl) is on the theme's scale, but tool UI stops at the title.
        const named = /^var\(--text-([\w.-]+)\)$/.exec(fact.value.trim())?.[1];
        const size = named
            ? (system.text.find(step => step.name === named)?.px ?? null)
            : onePx(fact.value);
        if (size === null || size <= 0) return null;
        const above = size > largest + 0.5;
        if (!above && (named || system.text.some(step => near(step.px, size)))) return null;
        const role = roleOf(fact, system);
        const title = system.text.find(step => near(step.px, largest));
        let target = role?.step ?? (above ? title : nearestSize(system.text, size));
        // 12 sits between the meta size and the base: meta (a badge, a count) takes 11.
        if (!role && near(size, 12)) {
            const meta = fact.subject.kind === 'badge';
            target = system.text.find(step => step.name === (meta ? 'xxs' : 'xs')) ?? target;
        }
        if (!target) return null;
        const close = Math.abs(target.px - size) <= 1;
        // By role the step is known; by nearness only a guess, unless it is a rounding.
        const confidence = role || close ? 'high' : above ? 'medium' : 'low';
        const by = role
            ? ` (${role.role})`
            : close
              ? ''
              : ', the nearest step: what the text is decides (24 a page title, 16 a section title, 13 the rest)';
        return findingFor(fact, {
            rule: 'type-size',
            severity: 'fix',
            confidence: sure(fact, confidence),
            found: named ? `${px(size)} (text-${named})` : px(size),
            expected: above
                ? `at most 24px (text-2xl, the page title)${role ? `; ${target.px}px (text-${target.name}) as ${role.role}` : ''}`
                : `${target.px}px (text-${target.name})${by}`,
            why: above
                ? `Tool UI stops at the page title, 24; a size above it is a marketing page's (foundations.md › Type › Scale; a 31 is only a chart card's leading headline). ${scaleWhy}`
                : scaleWhy,
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

/** Written in the secondary grey (or a paler one): a label, an eyebrow, a description. */
const quietText = /(^|\s)text-(neutral|gray|grey|slate|zinc|stone)-[456]00(\s|$)/;

export const weight: Rule = {
    id: 'weight',
    applies: property => property === 'font-weight',
    judge: fact => {
        if (fact.subject.picture || fact.subject.library || isReference(fact.value)) return null;
        const found = weightOf(fact.value);
        if (found === null || found === 400 || found === 500) return null;
        // Quiet text (a label, an eyebrow, a description in the secondary grey) is regular.
        const quiet = quietText.test(fact.subject.name ?? '');
        const target = !quiet && found >= 450 ? 500 : 400;
        return findingFor(fact, {
            rule: 'weight',
            severity: 'fix',
            confidence: sure(fact, found >= 600 || found < 400 ? 'high' : 'medium'),
            found: `font-weight ${fact.value.trim()}`,
            expected: `${target} (font-${target === 500 ? 'medium' : 'normal'})${quiet ? ', as quiet text in the secondary grey is' : ''}`,
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
