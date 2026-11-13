import type { SizeToken } from '../../system/values';
import type { Fact } from '../../types';
import { writeFix } from '../fix';
import {
    fieldName,
    findingFor,
    near,
    nearestOf,
    onePx,
    px,
    type Rule,
    type RuleContext,
    sizeToken,
    sure,
    wordsOf,
} from './shared';

/*
 * Heights: anything in a row is 34 or 38, so a button and a field beside it line up; the few
 * exceptions are squares sized to the bar they sit in and marks sized to their glyph
 * (foundations.md › Heights). Only things that sit in a row are held to it: a container's height
 * is its content's.
 */

const why =
    'A control sits on one of two rows, 34 or 38, never between them, read by name so the theme reaches it (foundations.md › Heights).';

type Target = {
    token: SizeToken;
    why: string;
    severity: 'fix' | 'advise';
    confidence: 'high' | 'medium' | 'low';
};

/** What a height should be for the kind of thing it sits on; undefined when it is already right. */
const targetFor = (fact: Fact, found: number, { system }: RuleContext): Target | undefined => {
    const named = (name: string, fallback: number) => sizeToken(system, name, fallback);
    const control = named('control', 34);
    const large = named('control-lg', 38);
    const small = named('control-sm', 28);
    const xl = named('control-xl', 48);
    const fits = (...heights: number[]) => heights.some(each => near(each, found, 1));
    const words = wordsOf(fact);
    const role = fact.subject.role ?? '';
    const field = fieldName.test(words);
    const pick = () => {
        if (found <= 30) return small;
        if (found >= 46) return xl;
        if (found > 38) return large;
        if (near(found, 36)) return field ? large : control;
        return nearestOf([control, large], found) ?? control;
    };
    switch (fact.subject.kind) {
        case 'control': {
            if (found < 20 || found > 60) return undefined;
            if (role === 'tab' || /\btab\b/i.test(words)) {
                if (
                    fits(
                        named('segment', 29).px,
                        named('cell', 32).px,
                        control.px,
                        named('tab', 44).px,
                    )
                )
                    return undefined;
                return {
                    token: control,
                    why: 'A pill tab sits on the control row, 34; a line tab is 44 on its own hairline (foundations.md › Heights).',
                    severity: 'fix',
                    confidence: 'medium',
                };
            }
            if (/option|menuitem/.test(role)) {
                if (
                    fits(
                        30,
                        named('option', 36).px,
                        named('option-md', 44).px,
                        named('option-lg', 56).px,
                    )
                )
                    return undefined;
                return {
                    token: named('option', 36),
                    why: 'A menu option is 36 high, 44 or 56 with a description (components.md › DropdownMenu).',
                    severity: 'fix',
                    confidence: 'medium',
                };
            }
            if (/checkbox|radio|switch|slider/.test(role)) return undefined;
            if (fits(control.px, large.px, xl.px, small.px)) return undefined;
            return { token: pick(), why, severity: 'fix', confidence: 'high' };
        }
        case 'icon-control':
            if (found < 20 || found > 60) return undefined;
            // Squares sized to the bar they sit in: a dialog's close 30, a sheet's 36, a dock item 32.
            if (fits(25, small.px, 29, 30, 32, control.px, 36, large.px)) return undefined;
            return {
                token: found <= 31 ? small : control,
                why,
                severity: 'fix',
                confidence: 'medium',
            };
        case 'badge':
            if (fits(21, 22, 25)) return undefined;
            return {
                token: { name: 'badge', variable: '--spacing-5.5', px: 22 },
                why: 'A badge is 22 high in every variant, 11/500 text (components.md › Badge).',
                severity: 'fix',
                confidence: 'medium',
            };
        case 'row': {
            const row = named('table-row', 41);
            if (found < 28 || found > 64 || fits(row.px, named('row', 40).px)) return undefined;
            return {
                token: row,
                why: 'A ruled table’s rows and head are 41 high (foundations.md › Heights).',
                severity: 'advise',
                confidence: 'medium',
            };
        }
        case 'unknown':
        case undefined:
            // A height near the control row on something the reader could not place: worth a look.
            if (
                found < 30 ||
                found > 44 ||
                fits(control.px, large.px, named('row', 40).px, named('table-row', 41).px, 44)
            )
                return undefined;
            return {
                token: pick(),
                why: `${why} If this is not a control, leave it.`,
                severity: 'advise',
                confidence: 'low',
            };
        default:
            return undefined;
    }
};

export const height: Rule = {
    id: 'height',
    applies: property => property === 'height' || property === 'min-height',
    judge: (fact, context) => {
        if (fact.subject.picture || fact.subject.library) return null;
        const found = onePx(fact.value);
        if (found === null) return null;
        const target = targetFor(fact, found, context);
        if (!target || near(target.token.px, found, 0.5)) return null;
        const { token } = target;
        const named = token.name !== 'badge';
        const step = token.px / context.system.unit;
        const prefix = fact.property === 'min-height' ? 'min-h' : 'h';
        return findingFor(fact, {
            rule: 'height',
            severity: target.severity,
            confidence:
                target.severity === 'advise' ? target.confidence : sure(fact, target.confidence),
            found: px(found),
            expected: `${token.px}px (${named ? `h-${token.name}` : 'badge'})`,
            why: target.why,
            fix: writeFix(fact, {
                css: named ? `var(${token.variable})` : `${token.px}px`,
                raw: `${token.px}px`,
                tailwind: named ? `${prefix}-${token.name}` : `${prefix}-${step}`,
                token: named ? `h-${token.name}` : undefined,
                part: fact.value.trim(),
            }),
        });
    },
};
