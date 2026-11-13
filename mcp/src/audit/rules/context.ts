import { hexToOklch } from 'continuum';
import { readColour } from '../../system/values';
import type { Finding, UINode } from '../../types';

/*
 * The questions asked of a rendered node: is it a control, a badge, part of a picture, a part the
 * library already draws, does it float. tree.ts asks them to say what each fact sits on, and
 * structure.ts and match.ts ask them of the tree; kept here so all three answer them the same way.
 */

/** Where a finding points: the source line when the stack told us, then the node's path. */
export const where = (node: UINode) => {
    if (node.source && node.id) return `${node.source} · ${node.id}`;
    return node.source ?? node.id ?? node.tag ?? 'node';
};

/** How a person finds the node on screen: its name, its text, or its tag. */
export const label = (node: UINode) => {
    const text = node.name ?? node.content;
    const short = text && text.length > 40 ? `${text.slice(0, 39)}…` : text;
    return short ? `${node.tag ?? 'node'} "${short}"` : (node.tag ?? 'node');
};

export const finding = (node: UINode, fields: Omit<Finding, 'at' | 'node'>): Finding => ({
    ...fields,
    at: where(node),
    node: label(node),
});

const words = (node: UINode) => `${node.name ?? ''} ${node.classes ?? ''}`.toLowerCase();

const named = (node: UINode, pattern: RegExp) => pattern.test(words(node));

const graphicTags = new Set([
    'svg',
    'path',
    'g',
    'canvas',
    'img',
    'picture',
    'video',
    'image',
    'iframe',
]);
const graphicWords =
    /\b(chart|recharts|apexcharts|echarts|plot|sparkline|avatar|logo|mark|illustration|map|swatch|color-picker|colour)\b|data-slot=(chart|avatar|logo|color)/;

/** Part of a picture, a chart or an avatar: its colours are data or identity, not roles. */
export const inGraphic = (node: UINode, parents: UINode[]) =>
    [node, ...parents].some(
        each =>
            graphicTags.has(each.tag ?? '') ||
            each.role === 'img' ||
            each.role === 'presentation' ||
            named(each, graphicWords),
    );

/**
 * A picture's own marks: inside an image, a chart, an avatar. A box named for a chart that frames
 * one (a bordered card holding it) is still a box, held to the corners and spacing of any other.
 */
export const isPicture = (node: UINode, parents: UINode[]) => {
    if (!inGraphic(node, parents)) return false;
    const tagged = [node, ...parents].some(
        each =>
            graphicTags.has(each.tag ?? '') || each.role === 'img' || each.role === 'presentation',
    );
    const frame = Boolean(node.children?.length) && (hasFill(node) || Boolean(node.border));
    return tagged || !frame;
};

/** Disabled, or dimmed as disabled things are: the contrast rules do not hold for it. */
export const isDisabled = (node: UINode, parents: UINode[]) =>
    [node, ...parents].some(
        each =>
            (each.layout?.opacity !== undefined && each.layout.opacity < 0.75) ||
            /\[disabled\]|\bdisabled\b|\bopacity-50\b/.test(each.classes ?? ''),
    );

const continuumClasses =
    /(?:^|\s)(?:h-control(?:-lg|-sm|-xl)?|rounded-(?:control|chip|item|card|panel|dock)|bg-action|text-on-action|h-table-row|bg-selected|bg-tint)(?:\s|$)/;

/**
 * A part the library already draws (a React project using Continuum): its values are the
 * component's own, judged in the component, so the audit leaves them alone.
 */
export const isContinuumPart = (node: UINode, parents: UINode[]) => {
    const classes = node.classes ?? '';
    if (!/data-slot=/.test(classes)) return false;
    if (continuumClasses.test(classes)) return true;
    return parents.some(parent => /(?:^|\s)continuum(?:\s|$)/.test(parent.classes ?? ''));
};

/** Inside a part the library draws, at any depth. */
export const inContinuumPart = (node: UINode, parents: UINode[]) =>
    isContinuumPart(node, parents) ||
    parents.some((parent, index) => isContinuumPart(parent, parents.slice(0, index)));

const fieldRoles = new Set(['textbox', 'searchbox', 'combobox', 'spinbutton']);
const buttonRoles = new Set(['button']);

export type ControlKind = 'button' | 'field' | 'tab' | 'option' | 'mark' | 'link' | undefined;

/** What kind of control a node is, from its tag and role; undefined when it is none. */
export const controlKind = (node: UINode): ControlKind => {
    const role = node.role ?? '';
    const tag = node.tag ?? '';
    if (['checkbox', 'radio', 'switch', 'slider'].includes(role)) return 'mark';
    if (role === 'tab') return 'tab';
    if (
        role === 'menuitem' ||
        role === 'option' ||
        role === 'menuitemcheckbox' ||
        role === 'menuitemradio'
    )
        return 'option';
    if (tag === 'textarea') return undefined;
    if (fieldRoles.has(role) || tag === 'select' || tag === 'input') return 'field';
    if (buttonRoles.has(role) || tag === 'button') return 'button';
    if (role === 'link' || tag === 'a') return 'link';
    return undefined;
};

/** A link drawn as a button: it has a fill or a border and a control's height. */
export const looksLikeButton = (node: UINode) =>
    Boolean(
        (hasFill(node) || node.border) &&
            node.box?.height &&
            node.box.height >= 24 &&
            node.box.height <= 56,
    );

export const hasFill = (node: UINode) => {
    const colour = readColour(node.fill);
    return Boolean(colour && colour.alpha > 0.02);
};

/** Bordered on every side. */
export const isBordered = (node: UINode) =>
    Boolean(node.border && node.border.width > 0 && !node.border.sides?.length);

/** The node's own text, or the text of a single text child (a label in a span). */
export const textOf = (node: UINode): string | undefined =>
    node.content ?? (node.children?.length === 1 ? textOf(node.children[0] as UINode) : undefined);

/** A badge: a small, quiet, filled mark with a word or a number on it, not a control. */
export const isBadge = (node: UINode) => {
    const height = node.box?.height;
    const width = node.box?.width;
    const text = textOf(node);
    if (!height || !width || !text || node.interactive) return false;
    if (height < 16 || height > 26 || width > 160 || text.length > 24) return false;
    if (node.children?.some(child => child.interactive)) return false;
    return (
        hasFill(node) &&
        (named(node, /badge|tag|status|pill|label|count|chip/) || radiusOf(node) >= 4)
    );
};

export const radiusOf = (node: UINode) => {
    const radius = node.box?.radius;
    if (radius === undefined) return 0;
    return Array.isArray(radius) ? Math.max(...radius) : radius;
};

/** A box that holds other boxes: not a control, not text, bigger than a row. */
export const isContainer = (node: UINode) =>
    !node.interactive &&
    !controlKind(node) &&
    Boolean(node.children?.length) &&
    // A size the reader did not give is no reason to doubt a box holds others.
    (node.box?.height ?? Number.POSITIVE_INFINITY) > 48 &&
    (node.box?.width ?? Number.POSITIVE_INFINITY) > 120;

/** Floats over the page: a dialog, a menu, a popover, the dock. Only these carry a shadow. */
export const floats = (node: UINode, parents: UINode[]) =>
    [node, ...parents.slice(-2)].some(
        each =>
            ['dialog', 'alertdialog', 'menu', 'listbox', 'tooltip'].includes(each.role ?? '') ||
            each.layout?.position === 'fixed' ||
            (each.layout?.position === 'absolute' && each.layout.zIndex !== undefined) ||
            named(
                each,
                /popover|popup|toast|sonner|dock|sheet|dialog|modal|menu|dropdown|tooltip|composer|float|knob|thumb|drawer/,
            ),
    );

/** OKLab lightness of a colour, 0 to 1; null when it cannot be read. */
export const lightness = (value: string | undefined) => {
    const colour = readColour(value);
    if (!colour || colour.alpha === 0) return null;
    return hexToOklch(colour.hex)?.l ?? null;
};

export const chroma = (value: string | undefined) => {
    const colour = readColour(value);
    if (!colour) return 0;
    return hexToOklch(colour.hex)?.c ?? 0;
};

/** The solid fill a node's text sits on: its own or the nearest ancestor's. */
export const backdrop = (node: UINode, parents: UINode[]) => {
    for (const each of [node, ...[...parents].reverse()]) {
        const colour = readColour(each.fill);
        if (colour && colour.alpha > 0.5) return each.fill;
    }
    return undefined;
};

export const near = (a: number, b: number, tolerance = 0.5) => Math.abs(a - b) <= tolerance;

export const px = (value: number) => `${Math.round(value * 10) / 10}px`;
