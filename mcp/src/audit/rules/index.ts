import type { Fact, Finding } from '../../types';
import { colourRole, textTone } from './colour';
import { height } from './height';
import { radius } from './radius';
import type { Rule, RuleContext } from './shared';
import { spacingRule } from './spacing';
import { borderWidth, shadow } from './surface';
import { fontFamily, typeSize, weight } from './type';

/*
 * The one rule set. Every reader, whatever it read (a rendered tree, a stylesheet, a class
 * string, a literal in code), hands its values over as facts, and these rules judge them the same
 * way, in the order a person reads a box: colour, type, size, shape.
 */

export const rules: Rule[] = [
    colourRole,
    textTone,
    typeSize,
    weight,
    fontFamily,
    height,
    radius,
    spacingRule,
    borderWidth,
    shadow,
];

/** A part the library draws is judged in the library: only its spacing on the page is the page's. */
const libraryRules = new Set(['spacing']);

/**
 * What a library part draws for itself: its height, corners, border and shadow. A class that
 * sets one of these on the part overrides a value already right, so its fix is to take it away.
 */
const drawnByPart = new Set(['height', 'radius', 'border-width', 'shadow']);

/** A part's own value, back: the fix removes the class instead of naming another. */
const removeFromPart = (fact: Fact, finding: Finding): Finding => {
    const part = fact.subject.part ?? 'part';
    const written = fact.written.text;
    return {
        ...finding,
        expected: `${finding.expected}, which the ${part} draws itself: remove ${written}`,
        why: `${finding.why} ${part} is the library's part and already draws this value; a class that sets it again only overrides it (components.md › ${part}).`,
        fix: { code: `remove ${written} from <${part} className>` },
    };
};

/** Every finding a fact earns, one per rule at most. */
export const judge = (fact: Fact, context: RuleContext): Finding[] => {
    const findings: Finding[] = [];
    for (const rule of rules) {
        if (fact.subject.library && !libraryRules.has(rule.id)) continue;
        if (!rule.applies(fact.property)) continue;
        const finding = rule.judge(fact, context);
        if (!finding) continue;
        findings.push(
            fact.subject.part &&
                fact.written.form === 'utility' &&
                finding.severity === 'fix' &&
                drawnByPart.has(finding.rule)
                ? removeFromPart(fact, finding)
                : finding,
        );
    }
    return findings;
};

export type { Rule, RuleContext } from './shared';
