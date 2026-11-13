import type { SystemValues } from '../system/values';
import type { AuditReport, ElementFact, Fact, Finding, Medium, Mode, UINode } from '../types';
import { elementParts, treeParts } from './match';
import { report } from './report';
import { judge } from './rules';
import { analyseStructure, concentric } from './structure';

/*
 * The one audit. Whatever was read (a rendered tree, a stylesheet, class strings, literals in
 * code, the values another tool hands over) arrives as facts, and every fact goes through the
 * same rules. Raw elements go to the part matcher; a tree, when there is one, also answers what
 * only a tree can (corners that nest, one primary action, containers in containers). A mistake
 * repeated down forty rows comes back once, with the count.
 */

export type AuditInput = { facts: Fact[]; elements?: ElementFact[]; tree?: UINode };

export type AuditOptions = {
    system: SystemValues;
    mode: Mode;
    medium: Medium;
    /** Add the tree-level advice (one primary, nested containers, views in the dock). */
    structure?: boolean;
    notes?: string[];
};

/** At most this many findings go back; the rest wait for the next audit, after these are fixed. */
const limit = 60;

/* ---------- Shorthands into their parts ---------- */

const colourIn = (value: string) =>
    /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb|color-mix)\([^)]*\)|\bvar\([^)]*\)|\b(?:white|black|transparent)\b/i.exec(
        value,
    )?.[0];

const widthIn = (value: string) =>
    /(^|\s)(\d*\.?\d+(?:px|rem)?|thin|medium|thick)(?=\s|$)/.exec(value)?.[2];

/**
 * A shorthand a reader passed whole ('border: 2px solid #ccc', 'background: #fff') as the
 * longhands the rules read. Readers may split them themselves; this catches the ones they did not.
 */
const expand = (fact: Fact): Fact[] => {
    const part = (property: string, value: string | undefined): Fact[] => {
        if (value === undefined) return [];
        const written =
            fact.written.form === 'declaration' || fact.written.form === 'rendered'
                ? { ...fact.written, text: `${property}: ${value}` }
                : fact.written;
        return [{ ...fact, property, value, written }];
    };
    const border = /^(border(?:-(?:top|right|bottom|left))?|outline)$/.exec(fact.property);
    if (border) {
        const value = fact.value.trim();
        if (/^(none|0|initial|unset|inherit)$/i.test(value)) return [];
        const width = widthIn(value.replace(colourIn(value) ?? '', ''));
        return [
            ...part(`${border[1]}-width`, width),
            ...part(`${border[1]}-color`, colourIn(value)),
        ];
    }
    if (fact.property === 'background') {
        const colour = colourIn(fact.value);
        if (!colour || /url\(|gradient\(/.test(fact.value)) return [];
        return part('background-color', colour);
    }
    return [fact];
};

/* ---------- One finding for many ---------- */

/** The file a place is in ('src/a.scss:14' → 'src/a.scss'), or the tree's own ids. */
const fileOf = (at: string) => /^(.+?):\d+/.exec(at)?.[1] ?? '';

const dedupe = (findings: Finding[]) => {
    const groups = new Map<string, Finding[]>();
    for (const each of findings) {
        const key = [
            fileOf(each.at),
            each.rule,
            each.property,
            each.found,
            each.expected,
            each.component,
        ].join('|');
        const group = groups.get(key);
        if (group) group.push(each);
        else groups.set(key, [each]);
    }
    return [...groups.values()].flatMap(group => {
        const first = group[0] as Finding;
        const places = [...new Set(group.map(each => each.at))];
        if (places.length === 1) return [first];
        // Lines of one file read as 'file:14,43', which finds each line on its own.
        const file = fileOf(first.at);
        const lines = places.map(at => /^.+?:(\d+)/.exec(at)?.[1]);
        const oneFile =
            Boolean(file) && lines.every(Boolean) && places.every(at => fileOf(at) === file);
        // A few nodes of a tree are each worth their own finding; a mistake down a list is one.
        if (!oneFile && places.length <= 3) return group;
        const count = Math.min(oneFile ? 6 : 3, places.length);
        const shown = oneFile
            ? `${file}:${lines.slice(0, count).join(',')}`
            : places.slice(0, count).join(', ');
        const more = places.length - count;
        return [
            {
                ...first,
                at: more > 0 ? `${shown} (+${more} more)` : shown,
                found: `${first.found} ×${places.length}`,
            },
        ];
    });
};

/* ---------- The audit ---------- */

export const auditFacts = (input: AuditInput, options: AuditOptions): AuditReport => {
    const { system, mode, medium } = options;
    const notes = [...(options.notes ?? [])];
    const context = { system, mode };
    let findings: Finding[] = input.facts.flatMap(expand).flatMap(fact => judge(fact, context));

    if (input.elements?.length) findings.push(...elementParts(input.elements, medium));

    const tree = input.tree;
    if (tree) {
        // A corner that nests in what holds it is right though no token names it.
        const nesting = concentric(tree);
        findings = findings.filter(each => each.rule !== 'radius' || !nesting.nested.has(each.at));
        findings.push(...nesting.findings);
        const byPlace = new Map<string, Finding[]>();
        for (const each of findings) byPlace.set(each.at, [...(byPlace.get(each.at) ?? []), each]);
        findings.push(...treeParts(tree, medium, at => byPlace.get(at) ?? []));
        if (options.structure !== false) findings.push(...analyseStructure(tree, system, mode));
    }

    const guessed = input.facts.filter(fact => fact.guessed).length;
    if (guessed)
        notes.push(
            `${guessed} values were read without knowing what they paint (a colour in code, say): their findings are a step less sure.`,
        );
    const unknown = input.facts.filter(
        fact => (fact.subject.kind ?? 'unknown') === 'unknown',
    ).length;
    if (unknown && unknown === input.facts.length && input.facts.length > 3)
        notes.push(
            'No value said what it sits on, so heights and corners were judged by value alone. A subject kind (control, badge, row, container …) makes the audit surer.',
        );
    if (!input.facts.length && !input.elements?.length && !tree)
        notes.push('Nothing to audit: no facts, elements or tree were given.');

    const built = report(dedupe(findings), medium, system, mode, notes);
    if (built.findings.length > limit) {
        built.notes.push(
            `${built.findings.length - limit} more findings held back: apply these, then audit again.`,
        );
        built.findings = built.findings.slice(0, limit);
    }
    return built;
};
