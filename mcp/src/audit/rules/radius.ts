import type { SizeToken, SystemValues } from '../../system/values';
import type { Confidence, Fact } from '../../types';
import { writeFix } from '../fix';
import {
    corners,
    fieldName,
    findingFor,
    isReference,
    lengthsIn,
    near,
    nearestOf,
    px,
    type Rule,
    sure,
    wordsOf,
} from './shared';

/*
 * Corners: named steps that nest, panel ⊃ card ⊃ control ⊃ item ⊃ chip (foundations.md › Radius).
 * A button or a field is control, a badge chip; anything else may take any step, and is snapped
 * to the nearest when it sits between them. Whether a corner nests in what holds it is a question
 * of the tree, asked in structure.ts.
 */

const why =
    'Corners are named steps, scaled by the theme: chip 6 · item 10 · control 12 · card 16 · panel 20; buttons and fields are control (foundations.md › Radius).';

const controlWords =
    /button|btn|input|select|textarea|field|combobox|textbox|searchbox|spinbutton|lineedit|spinbox|pushbutton|toolbutton/i;

/** The corner a subject takes by what it is, and how sure that is. */
const cornerFor = (
    fact: Fact,
    system: SystemValues,
    found: number,
): { token?: SizeToken; confidence: Confidence; byKind: boolean } => {
    const all = corners(system);
    const pick = (name: string) => all.find(corner => corner.name === name);
    const words = wordsOf(fact);
    const kind = fact.subject.kind;
    if (kind === 'badge') return { token: pick('chip'), confidence: 'high', byKind: true };
    if (kind === 'icon-control' && found <= 8)
        return { token: pick('chip'), confidence: 'medium', byKind: true };
    if (
        (kind === 'control' || kind === 'icon-control') &&
        (controlWords.test(words) || fieldName.test(words))
    )
        return { token: pick('control'), confidence: 'high', byKind: true };
    if (/badge|chip|\btag\b|kbd|checkbox/i.test(words))
        return { token: pick('chip'), confidence: 'medium', byKind: false };
    if (/sheet|panel|drawer/i.test(words))
        return { token: pick('panel'), confidence: 'medium', byKind: false };
    // A ruled table's frame takes control corners, not a card's (foundations.md › Radius).
    if (/\btable\b|data-?grid/i.test(words))
        return { token: pick('control'), confidence: 'medium', byKind: false };
    if (/card|dialog|modal/i.test(words))
        return { token: pick('card'), confidence: 'medium', byKind: false };
    if (controlWords.test(words))
        return { token: pick('control'), confidence: 'medium', byKind: false };
    if (/item|option|\bnav\b|menu|tile/i.test(words))
        return { token: pick('item'), confidence: 'medium', byKind: false };
    // A box drawn as a container (a border, a corner, padding) with no name is a card: control's
    // corner belongs to controls, so a container between steps goes up to card unless it is as
    // tight as an item (a card inside a list) or as round as a panel.
    if (kind === 'container') {
        const item = pick('item');
        const panel = pick('panel');
        const token =
            item && found <= item.px
                ? item
                : panel && found >= panel.px
                  ? panel
                  : (pick('card') ?? nearestOf(all, found));
        return { token, confidence: 'medium', byKind: true };
    }
    return {
        token: nearestOf(all, found),
        confidence: kind === 'floating' ? 'medium' : 'low',
        byKind: false,
    };
};

const tailwindPrefix = (property: string) => {
    const corner = /^border-(top|bottom)-(left|right)-radius$/.exec(property);
    return corner ? `rounded-${corner[1]?.[0]}${corner[2]?.[0]}` : 'rounded';
};

export const radius: Rule = {
    id: 'radius',
    applies: property => /^border(-(top|bottom)-(left|right))?-radius$/.test(property),
    judge: (fact, { system }) => {
        if (fact.subject.picture || fact.subject.library) return null;
        const value = fact.value.trim();
        if (isReference(value) || /%|full|9999/.test(value)) return null;
        // An elliptical corner (8px / 4px) is drawn on purpose.
        if (value.includes('/')) return null;
        for (const length of lengthsIn(value)) {
            const found = length.px;
            // None, or round on purpose: a pill or a circle, which no token needs to name.
            if (found <= 0 || found >= 100) continue;
            const { token, confidence, byKind } = cornerFor(fact, system, found);
            if (!token) continue;
            if (byKind ? near(token.px, found) : system.radii.some(each => near(each.px, found)))
                continue;
            return findingFor(fact, {
                rule: 'radius',
                severity: 'fix',
                confidence: sure(fact, confidence, byKind),
                found: px(found),
                expected: `${token.px}px (rounded-${token.name})`,
                why,
                fix: writeFix(fact, {
                    css: `var(${token.variable})`,
                    raw: `${token.px}px`,
                    tailwind: `${tailwindPrefix(fact.property)}-${token.name}`,
                    token: `rounded-${token.name}`,
                    part: length.text,
                }),
            });
        }
        return null;
    },
};
