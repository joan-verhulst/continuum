import type { ColourToken, SizeToken, SystemValues } from '../system/values';
import type { AuditReport, Finding, Medium, Mode } from '../types';

/*
 * What both audits share: how a fix is written per stack, and how findings become a report.
 */

/** The CSS property a colour fills, as Tailwind prefixes it. */
export type ColourProperty =
    | 'background'
    | 'text'
    | 'border'
    | 'ring'
    | 'outline'
    | 'fill'
    | 'stroke';

const tailwindColourPrefix: Record<ColourProperty, string> = {
    background: 'bg',
    text: 'text',
    border: 'border',
    ring: 'ring',
    outline: 'outline',
    fill: 'fill',
    stroke: 'stroke',
};

const cssColourProperty: Record<ColourProperty, string> = {
    background: 'background-color',
    text: 'color',
    border: 'border-color',
    ring: 'outline-color',
    outline: 'outline-color',
    fill: 'fill',
    stroke: 'stroke',
};

const qssColourProperty: Partial<Record<ColourProperty, string>> = {
    background: 'background-color',
    text: 'color',
    border: 'border-color',
};

const canvasColourProperty: Partial<Record<ColourProperty, string>> = {
    background: 'backgroundColor',
    text: 'color',
    border: 'borderColor',
};

/** A colour fix in every medium: the variable in CSS, the class in Tailwind, the value on a canvas. */
export const colourFix = (property: ColourProperty, token: ColourToken) => {
    const fix: Finding['fix'] = {
        css: `${cssColourProperty[property]}: var(${token.variable});`,
        tailwind: `${tailwindColourPrefix[property]}-${token.name}`,
    };
    const qss = qssColourProperty[property];
    if (qss) fix.qss = `${qss}: ${token.hex};`;
    const canvas = canvasColourProperty[property];
    if (canvas) fix.canvas = JSON.stringify({ [canvas]: token.hex });
    return fix;
};

/** The Tailwind class prefix for a length property; spacing ones are multiples of the unit. */
const lengthPrefix: Record<string, string> = {
    height: 'h',
    'min-height': 'min-h',
    width: 'w',
    padding: 'p',
    'padding-inline': 'px',
    'padding-block': 'py',
    'padding-top': 'pt',
    'padding-right': 'pr',
    'padding-bottom': 'pb',
    'padding-left': 'pl',
    gap: 'gap',
    'row-gap': 'gap-y',
    'column-gap': 'gap-x',
    'border-radius': 'rounded',
    'font-size': 'text',
};

const canvasProperty: Record<string, string> = {
    height: 'height',
    'min-height': 'minHeight',
    width: 'width',
    padding: 'padding',
    'padding-inline': 'paddingInline',
    'padding-block': 'paddingBlock',
    'padding-top': 'paddingTop',
    'padding-right': 'paddingRight',
    'padding-bottom': 'paddingBottom',
    'padding-left': 'paddingLeft',
    gap: 'gap',
    'row-gap': 'rowGap',
    'column-gap': 'columnGap',
    'border-radius': 'borderRadius',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
};

/**
 * A length fix. A named token (h-control, rounded-card, text-xs) when one fits exactly; otherwise
 * a step on the spacing scale (p-3), in the theme's unit.
 */
export const lengthFix = (
    system: SystemValues,
    property: string,
    px: number,
    token?: SizeToken,
): Finding['fix'] => {
    const prefix = lengthPrefix[property];
    const css = token ? `${property}: var(${token.variable});` : `${property}: ${px}px;`;
    let tailwind: string | undefined;
    if (prefix && token) tailwind = `${prefix}-${token.name}`;
    else if (prefix && property !== 'border-radius' && property !== 'font-size') {
        const step = px / system.unit;
        tailwind = Number.isInteger(step * 4) ? `${prefix}-${step}` : `${prefix}-[${px}px]`;
    }
    const fix: Finding['fix'] = { css, qss: `${property}: ${px}px;` };
    if (tailwind) fix.tailwind = tailwind;
    const canvas = canvasProperty[property];
    if (canvas) fix.canvas = JSON.stringify({ [canvas]: `${px}px` });
    return fix;
};

/** Findings in the order an agent should take them: fixes before advice, sure before unsure. */
const order = (finding: Finding) =>
    (finding.severity === 'fix' ? 0 : 10) + { high: 0, medium: 1, low: 2 }[finding.confidence];

export const report = (
    findings: Finding[],
    medium: Medium,
    system: SystemValues,
    mode: Mode,
    notes: string[] = [],
): AuditReport => {
    const byRule: Record<string, number> = {};
    for (const finding of findings) byRule[finding.rule] = (byRule[finding.rule] ?? 0) + 1;
    return {
        medium,
        theme: system.label,
        mode,
        summary: {
            fix: findings.filter(finding => finding.severity === 'fix').length,
            advise: findings.filter(finding => finding.severity === 'advise').length,
            byRule,
        },
        findings: [...findings].sort((a, b) => order(a) - order(b)),
        notes,
    };
};
