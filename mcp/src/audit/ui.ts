import type { SystemValues } from '../system/values';
import type { AuditReport, Fact, Medium, Mode } from '../types';
import { auditFacts } from './engine';
import { factsOf, normalise, type TreeFormat } from './tree';

/*
 * The audit of rendered UI: a tree of boxes (a browser snapshot, a canvas's computed styles) is
 * read into facts like any other input and judged by the one rule set; the tree is kept for what
 * only a tree can answer. Facts another tool extracted itself go straight to the rules.
 */

export type UiAuditOptions = {
    system: SystemValues;
    mode?: Mode;
    medium: Medium;
    /** Add the tree-level advice (one primary, nested containers, views in the dock). */
    structure?: boolean;
    format?: TreeFormat;
};

export const auditTree = (input: unknown, options: UiAuditOptions): AuditReport =>
    auditUi({ tree: input }, options);

/** A tree, facts, or both: the tree's facts and the given ones are judged together. */
export const auditUi = (
    input: { tree?: unknown; facts?: Fact[] },
    options: UiAuditOptions,
): AuditReport => {
    const notes: string[] = [];
    const facts: Fact[] = [...(input.facts ?? [])];
    let mode = options.mode;
    let root: ReturnType<typeof normalise>['root'] | undefined;
    if (input.tree !== undefined && input.tree !== null) {
        const normalised = normalise(input.tree, options.format);
        root = normalised.root;
        notes.push(...normalised.notes);
        mode ??= normalised.mode;
        const read = factsOf(root);
        facts.push(...read.facts);
        if (!read.withFont && read.seen > 1)
            notes.push(
                'No node carried font values, so type, weight and text colour went unchecked.',
            );
        if (read.library)
            notes.push(
                `${read.library} nodes are Continuum's own parts: only their spacing on the page was judged.`,
            );
    }
    return auditFacts(
        { facts, tree: root },
        {
            system: options.system,
            mode: mode ?? 'light',
            medium: options.medium,
            structure: options.structure,
            notes,
        },
    );
};
