import { nearestColour, type SystemValues } from '../system/values';
import type { Finding, Mode, UINode } from '../types';
import {
    chroma,
    controlKind,
    hasFill,
    inGraphic,
    isBordered,
    isContainer,
    isPicture,
    lightness,
    looksLikeButton,
    radiusOf,
    where,
} from './rules/context';

/*
 * Advice on the tree as a whole, the decisions no single box shows: one primary action, space
 * rather than lines, no container in a container, views in the dock, one page title, two
 * weights. Every finding here is 'advise': a structural change the person agrees to first.
 */

type Visit = { node: UINode; parents: UINode[] };

const flatten = (root: UINode) => {
    const all: Visit[] = [];
    const walk = (node: UINode, parents: UINode[]) => {
        all.push({ node, parents });
        for (const child of node.children ?? []) walk(child, [...parents, node]);
    };
    walk(root, []);
    return all;
};

const list = (visits: Visit[]) => {
    const shown = visits.slice(0, 3).map(each => where(each.node));
    return visits.length > 3
        ? `${shown.join(', ')} (+${visits.length - 3} more)`
        : shown.join(', ');
};

const advise = (at: string, fields: Omit<Finding, 'at' | 'severity' | 'confidence'>): Finding => ({
    severity: 'advise',
    confidence: 'medium',
    at,
    ...fields,
});

/** Filled in the action colour, or any saturated fill with light text on it. */
const isPrimaryFilled = (system: SystemValues, mode: Mode, node: UINode) => {
    if (!hasFill(node)) return false;
    const match = nearestColour(system, mode, node.fill ?? '');
    const action = system.colours[mode].find(each => each.name === 'action');
    if (match && action && match.token.hex === action.hex && match.distance < 6) return true;
    const label = node.font?.color ?? node.children?.find(child => child.font?.color)?.font?.color;
    return chroma(node.fill) > 0.08 && (lightness(label) ?? 0) > 0.8;
};

const inside = (parents: UINode[], roles: string[]) =>
    parents.some(
        parent =>
            roles.includes(parent.role ?? '') ||
            /\b(segment|dock|tabs?)\b/.test(
                `${parent.classes ?? ''} ${parent.name ?? ''}`.toLowerCase(),
            ),
    );

export const analyseStructure = (root: UINode, system: SystemValues, mode: Mode): Finding[] => {
    const visits = flatten(root);
    const findings: Finding[] = [];

    // One primary action per view.
    const primaries = visits.filter(
        ({ node, parents }) =>
            (controlKind(node) === 'button' ||
                (controlKind(node) === 'link' && looksLikeButton(node))) &&
            !inside(parents, ['tablist', 'radiogroup']) &&
            isPrimaryFilled(system, mode, node),
    );
    // A dialog or a sheet is a view of its own, with its own one primary action.
    const viewOf = ({ parents }: Visit) =>
        [...parents]
            .reverse()
            .find(
                parent =>
                    ['dialog', 'alertdialog'].includes(parent.role ?? '') ||
                    parent.tag === 'dialog',
            ) ?? root;
    const views = new Map<UINode, Visit[]>();
    for (const visit of primaries) {
        const view = viewOf(visit);
        views.set(view, [...(views.get(view) ?? []), visit]);
    }
    for (const group of views.values()) {
        if (group.length < 2) continue;
        findings.push(
            advise(list(group), {
                rule: 'one-primary',
                found: `${group.length} buttons in the action colour`,
                expected: 'one primary action per view; the rest secondary or ghost',
                why: 'One primary action per view, in the action colour; everything else is secondary or ghost (pages.md › Standing decisions).',
            }),
        );
    }

    // Space, not dividers, between sections.
    const lines = visits.filter(({ node, parents }) => {
        if (
            parents.some(
                parent =>
                    isBordered(parent) ||
                    parent.role === 'dialog' ||
                    parent.role === 'menu' ||
                    parent.tag === 'table',
            )
        )
            return false;
        if (node.tag === 'hr' || node.role === 'separator') return true;
        const box = node.box;
        const parentWidth = parents[parents.length - 1]?.box?.width;
        return Boolean(
            box?.height &&
                box.height <= 1.5 &&
                hasFill(node) &&
                box.width &&
                parentWidth &&
                box.width >= parentWidth * 0.9,
        );
    });
    if (lines.length) {
        findings.push(
            advise(list(lines), {
                rule: 'dividers',
                found: `${lines.length} line${lines.length > 1 ? 's' : ''} between sections`,
                expected: 'distance: 40 between sections, 20 between blocks',
                why: 'Space, not dividers: sections and groups are separated by distance; a rule only inside a bordered container (foundations.md › Surfaces and depth).',
            }),
        );
    }

    // A container never sits inside a container.
    const boxed = (node: UINode) => isContainer(node) && isBordered(node) && radiusOf(node) >= 6;
    const nested = visits.filter(
        ({ node, parents }) =>
            boxed(node) &&
            !isPicture(node, parents) &&
            parents.some(
                parent =>
                    boxed(parent) &&
                    parent.role !== 'dialog' &&
                    !/sheet|dialog|modal/.test(parent.name ?? '') &&
                    // The page's own surface (the main panel) holds cards; it is no card itself.
                    parent.tag !== 'main' &&
                    parent.role !== 'main' &&
                    (parent.box?.width ?? 0) < 900,
            ),
    );
    if (nested.length) {
        findings.push(
            advise(list(nested), {
                rule: 'nested-containers',
                found: `${nested.length} bordered container${nested.length > 1 ? 's' : ''} inside another`,
                expected: 'one container; inside it, a hairline or an eyebrow marks the group',
                why: 'A container never sits inside a container: inside a card the mark is a hairline or an eyebrow (foundations.md › Surfaces and depth).',
            }),
        );
    }

    // Views of a list go in the dock, not in tabs above the table.
    const hasTable = (node: UINode): boolean =>
        node.tag === 'table' ||
        node.role === 'table' ||
        node.role === 'grid' ||
        (node.children ?? []).some(hasTable);
    const tabsOverTables = visits.filter(({ node, parents }) => {
        if (node.role !== 'tablist') return false;
        const parent = parents[parents.length - 1];
        const siblings = parent?.children ?? [];
        const index = siblings.indexOf(node);
        return siblings.slice(index + 1, index + 3).some(hasTable);
    });
    if (tabsOverTables.length) {
        findings.push(
            advise(list(tabsOverTables), {
                rule: 'views-in-dock',
                found: 'tabs directly above a table',
                expected: 'the views in the floating dock, beside the page’s one primary action',
                why: 'Views go in the dock: the views of a list live in the floating dock, not above the table as tabs (pages.md › Standing decisions; patterns.md).',
            }),
        );
    }

    // One page title.
    const titles = visits.filter(
        ({ node, parents }) =>
            node.content &&
            (node.font?.size ?? 0) >= 23.5 &&
            (node.font?.size ?? 0) < 31 &&
            !parents.some(isBordered) &&
            !inGraphic(node, parents),
    );
    if (titles.length > 1) {
        findings.push(
            advise(list(titles), {
                rule: 'page-title',
                found: `${titles.length} page titles at 24`,
                expected: 'one page title, 24/500; section titles 16/500',
                why: 'The page head is one title, 24 medium, over one description line; sections are titled at 16 (pages.md › The page head).',
            }),
        );
    }

    // Two weights.
    const weights = new Set(
        visits
            .filter(
                ({ node, parents }) =>
                    node.content && node.font?.weight && !inGraphic(node, parents),
            )
            .map(({ node }) => node.font?.weight),
    );
    if (weights.size >= 3) {
        findings.push(
            advise(root.id ?? 'page', {
                rule: 'weights',
                found: `text in ${weights.size} weights: ${[...weights].sort().join(', ')}`,
                expected: 'two weights, 400 and 500',
                why: 'Hierarchy comes from colour and weight, in two weights; labels quiet, data loud (foundations.md › Type › Weight and hierarchy).',
            }),
        );
    }
    return findings;
};

/* ---------- Corners that nest ---------- */

const visible = (node: UINode) => hasFill(node) || Boolean(node.border);

/** Round on purpose: a pill or a circle, which nesting does not apply to. */
const isRound = (node: UINode, radius: number) => {
    const short = Math.min(
        node.box?.width ?? Number.POSITIVE_INFINITY,
        node.box?.height ?? Number.POSITIVE_INFINITY,
    );
    return radius >= 999 || radius >= short / 2 - 0.5;
};

/** How far the node sits inside its parent's edge: measured when the boxes say, else the padding. */
const inset = (node: UINode, parent: UINode) => {
    const a = node.box;
    const b = parent.box;
    if (a?.x !== undefined && b?.x !== undefined && a.y !== undefined && b.y !== undefined) {
        return Math.min(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }
    return Math.min(
        b?.paddingLeft ?? Number.POSITIVE_INFINITY,
        b?.paddingTop ?? Number.POSITIVE_INFINITY,
    );
};

export type Concentric = {
    findings: Finding[];
    /** Where a corner is right because it nests (R − d), though no token names it. */
    nested: Set<string>;
};

/**
 * A part inset by d in a rounded box of radius R takes R − d, whatever its name, so the two curves
 * run parallel (foundations.md › Radius). Only a tree knows the inset, so only a tree asks.
 */
export const concentric = (root: UINode): Concentric => {
    const findings: Finding[] = [];
    const nested = new Set<string>();
    for (const { node, parents } of flatten(root)) {
        const parent = parents[parents.length - 1];
        const value = radiusOf(node);
        const outer = parent ? radiusOf(parent) : 0;
        if (!parent || value <= 0 || outer <= 0 || !visible(node) || !visible(parent)) continue;
        if (isRound(node, value) || isRound(parent, outer) || isPicture(node, parents)) continue;
        const d = inset(node, parent);
        if (!Number.isFinite(d)) continue;
        const want = outer - d;
        if (d < outer && want >= 2) {
            if (Math.abs(value - want) <= 2) {
                nested.add(where(node));
                continue;
            }
            findings.push({
                rule: 'concentric',
                severity: 'fix',
                confidence: 'medium',
                at: where(node),
                node: node.name ?? node.tag,
                property: 'border-radius',
                found: `${value}px, ${d}px inside a ${outer}px corner`,
                expected: `${want}px (the ${outer}px corner less the ${d}px inset)`,
                why: 'Corners nest: a part inset in a rounded box takes the box’s radius less the inset, so the curves run parallel (foundations.md › Radius).',
                fix: {
                    css: `border-radius: ${want}px;`,
                    tailwind: `rounded-[${want}px]`,
                    canvas: JSON.stringify({ borderRadius: `${want}px` }),
                },
            });
            nested.add(where(node));
        } else if (value > outer + 0.5) {
            findings.push(
                advise(where(node), {
                    rule: 'concentric',
                    property: 'border-radius',
                    found: `${value}px inside a ${outer}px corner`,
                    expected: `under ${outer}px, the corner of what holds it`,
                    why: 'Corners nest, each smaller than what holds it: panel ⊃ card ⊃ control ⊃ item ⊃ chip (foundations.md › Radius).',
                }),
            );
        }
    }
    return { findings, nested };
};
