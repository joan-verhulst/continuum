import { snapSpacing } from '../../system/values';
import type { Fact } from '../../types';
import { writeFix } from '../fix';
import { findingFor, isReference, lengthsIn, px, type Rule } from './shared';

/*
 * Spacing on the scale: every padding, margin and gap lands on a step, half a unit up to four
 * units, a whole unit above (foundations.md › Spacing). The step a box wants follows what it
 * holds, which the rule cannot see; it snaps to the nearest and points at get_spacing. The one
 * rule that also holds for a library part, since a part's spacing on the page is the page's.
 */

const why =
    'Every padding, margin and gap lands on the spacing scale, never between steps; the step a box wants follows what it holds (foundations.md › Spacing). get_spacing works out the right one.';

const spacing =
    /^(padding|margin)(-(top|right|bottom|left|inline|block)(-start|-end)?)?$|^(row-|column-)?gap$/;

const sidePrefix: Record<string, string> = {
    top: 't',
    right: 'r',
    bottom: 'b',
    left: 'l',
    inline: 'x',
    block: 'y',
    'inline-start': 's',
    'inline-end': 'e',
    'block-start': 't',
    'block-end': 'b',
};

/** The Tailwind prefix for one length of a spacing value: p, px, pt, m, -mt, gap-x … */
const prefixFor = (property: string, index: number, count: number) => {
    if (property === 'row-gap') return 'gap-y';
    if (property === 'column-gap') return 'gap-x';
    if (property === 'gap') return count === 1 ? 'gap' : index === 0 ? 'gap-y' : 'gap-x';
    const base = property.startsWith('margin') ? 'm' : 'p';
    const side = property.split('-').slice(1).join('-');
    if (side) return `${base}${sidePrefix[side] ?? ''}`;
    // The shorthand: which sides this length sets.
    const sides =
        count === 1
            ? ['']
            : count === 2
              ? ['y', 'x']
              : count === 3
                ? ['t', 'x', 'b']
                : ['t', 'r', 'b', 'l'];
    return `${base}${sides[index] ?? ''}`;
};

const isCard = (child: { tag: string; kind: string }) =>
    child.kind === 'container' || /card|panel|tile/i.test(child.tag);

/**
 * What a gap separates, from what its box holds, and the gap the rule gives for it
 * (foundations.md › Spacing › The page's rhythm): a stack of settings cards 24, other alike
 * cards 16, controls in a row 8. Between unlike blocks it is the block gap, which only the
 * formula knows (px left out). Undefined when the box's children are not known.
 */
const gapRole = (fact: Fact): { px?: number; what: string; why: string } | undefined => {
    const holds = fact.subject.holds ?? [];
    if (holds.length < 2) {
        if (fact.subject.kind !== 'page') return undefined;
    } else if (holds.every(isCard)) {
        if (holds.every(child => child.settings))
            return {
                px: 24,
                what: 'a stack of settings cards',
                why: 'Settings cards stack 24 apart (pages.md › Settings; foundations.md › The page’s rhythm).',
            };
        return {
            px: 16,
            what: 'alike cards',
            why: 'Alike cards in a grid or a stack are 16 apart: 1.1× their padding (foundations.md › Spacing › The gap between alike boxes).',
        };
    } else if (holds.every(child => child.kind === 'control' || child.kind === 'icon-control')) {
        return {
            px: 8,
            what: 'controls in a row',
            why: 'Controls side by side are 8 apart, like the actions in a page head (pages.md › The page head).',
        };
    }
    const unlike = new Set(holds.map(child => `${child.tag}|${child.kind}`)).size > 1;
    if (!unlike && fact.subject.kind !== 'page') return undefined;
    return {
        what: 'between unlike blocks, worked out by get_spacing from what each holds, about 32 to 64',
        why: 'Between unlike blocks (a page head, a card, a table, a section) the gap is the block gap: each block claims room by what it holds and the gap is the two added (foundations.md › Spacing › The gap between unlike blocks). Call get_spacing with what each block holds; the nearest step stands in until then.',
    };
};

export const spacingRule: Rule = {
    id: 'spacing',
    applies: property => spacing.test(property),
    judge: (fact, { system }) => {
        if (fact.subject.picture) return null;
        const value = fact.value.trim();
        if (isReference(value) || /%|auto|em\b|vh|vw|calc/.test(value)) return null;
        const margin = fact.property.startsWith('margin');
        const lengths = lengthsIn(value);
        const rendered = fact.written.form === 'rendered';
        for (const [index, length] of lengths.entries()) {
            const size = Math.abs(length.px);
            if (size < (margin || rendered ? 4 : 2)) continue;
            // Between a half step and a whole one, the whole one: 13 is p-3, not p-3.5.
            const half = snapSpacing(system, size);
            const whole = Math.round(size / system.unit) * system.unit;
            const snapped = Math.abs(whole - size) <= Math.abs(half - size) ? whole : half;
            // A rendered box carries sub-pixel sizes from em and rem; a px off is a choice.
            if (Math.abs(snapped - size) < (rendered ? 1 : 0.01)) {
                // On the scale but written as an arbitrary class (gap-[10px]): the step has a
                // name, and an arbitrary value hides it from anyone reading the scale.
                if (fact.written.form !== 'utility' || !/\[[^\]]*\d/.test(fact.written.text))
                    continue;
                const named = `${length.px < 0 ? '-' : ''}${prefixFor(fact.property, index, lengths.length)}-${snapped / system.unit}`;
                return findingFor(fact, {
                    rule: 'spacing',
                    severity: 'fix',
                    confidence: 'high',
                    found: fact.written.text,
                    expected: `${named} (${px(snapped)}, the scale's own step)`,
                    why: 'Spacing is written by its step on the scale, so the scale stays readable in the code (foundations.md › Spacing).',
                    fix: writeFix(fact, {
                        css: `${length.px < 0 ? '-' : ''}${snapped}px`,
                        raw: `${length.px < 0 ? '-' : ''}${snapped}px`,
                        tailwind: named,
                        part: length.text,
                    }),
                });
            }
            const sign = length.px < 0 ? '-' : '';
            const between = /gap$/.test(fact.property) ? gapRole(fact) : undefined;
            const want = between?.px ?? snapped;
            const step = want / system.unit;
            const steps = `${step} unit${step === 1 ? '' : 's'}`;
            return findingFor(fact, {
                rule: 'spacing',
                severity: 'fix',
                confidence: between?.px ? 'high' : 'medium',
                found: px(length.px),
                expected: between
                    ? between.px
                        ? `${sign}${want}px (${steps}, ${between.what})`
                        : `the block gap (${between.what}); the nearest step is ${sign}${want}px (${steps})`
                    : `${sign}${want}px (${steps}, the nearest step on the scale)`,
                why: between ? `${between.why} ${why}` : why,
                fix: writeFix(fact, {
                    css: `${sign}${want}px`,
                    raw: `${sign}${want}px`,
                    tailwind: `${sign}${prefixFor(fact.property, index, lengths.length)}-${step}`,
                    part: length.text,
                }),
            });
        }
        return null;
    },
};
