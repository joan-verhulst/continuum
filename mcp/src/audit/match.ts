import { findComponent } from '../knowledge/components';
import type { ElementFact, Finding, Medium, UINode } from '../types';
import {
    chroma,
    controlKind,
    hasFill,
    inContinuumPart,
    isBadge,
    isBordered,
    label,
    lightness,
    looksLikeButton,
    where,
} from './rules/context';

/*
 * Which Continuum part a node is, from its tag, role, classes, name and shape. Conservative on
 * purpose: a node it is unsure of is no part at all, since a wrong "use <Dialog>" costs more
 * than a missed one.
 */

export type PartMatch = { name: string; props?: Record<string, string> };

const words = (node: UINode) => `${node.name ?? ''} ${node.classes ?? ''}`.toLowerCase();

const has = (node: UINode, pattern: RegExp) => pattern.test(words(node));

const buttonVariant = (node: UINode) => {
    if (!hasFill(node) && !node.border) return 'ghost';
    const fill = node.fill;
    const text = node.font?.color ?? node.children?.find(child => child.font)?.font?.color;
    const dark = (lightness(fill) ?? 1) < 0.45;
    const lightText = (lightness(text) ?? 0) > 0.8;
    if (chroma(fill) > 0.06 || (dark && lightText)) return 'primary';
    return 'secondary';
};

const buttonSize = (node: UINode) => {
    const height = node.box?.height ?? 34;
    const width = node.box?.width ?? 0;
    const square = Math.abs(height - width) <= 2;
    if (square) return height <= 30 ? 'icon-sm' : 'icon';
    // 36 is off the rows and snaps down to 34 (the height rule), so it reads as md.
    return height > 36 ? 'lg' : 'md';
};

/** The part a node is, or undefined when the signs do not agree. */
export const matchPart = (node: UINode): PartMatch | undefined => {
    const role = node.role ?? '';
    const tag = node.tag ?? '';
    const kind = controlKind(node);
    if (role === 'checkbox') return { name: 'Checkbox' };
    if (role === 'switch') return { name: 'Switch' };
    if (role === 'radiogroup') return { name: 'RadioGroup' };
    if (role === 'slider') return { name: 'Slider' };
    if (role === 'tablist') return { name: 'Tabs' };
    if (role === 'dialog' || role === 'alertdialog' || tag === 'dialog')
        return { name: has(node, /sheet|drawer/) ? 'Sheet' : 'Dialog' };
    if (role === 'tooltip') return { name: 'Tooltip' };
    if (role === 'menu') return { name: 'DropdownMenu' };
    if (role === 'progressbar' || tag === 'progress') return { name: 'Progress' };
    if (role === 'meter' || tag === 'meter') return { name: 'Meter' };
    if (tag === 'table' || role === 'table' || role === 'grid') return { name: 'Table' };
    if (tag === 'textarea') return { name: 'Textarea' };
    if (tag === 'select') return { name: 'Select' };
    if (role === 'navigation' && has(node, /breadcrumb/)) return { name: 'Breadcrumb' };
    if (role === 'navigation' && has(node, /pagination|pager/)) return { name: 'Pagination' };
    if (kind === 'field' && (role === 'textbox' || role === 'searchbox' || tag === 'input'))
        return { name: 'Input', props: { size: (node.box?.height ?? 34) >= 36 ? 'md' : 'sm' } };
    if (kind === 'button' || (kind === 'link' && looksLikeButton(node) && node.content)) {
        return { name: 'Button', props: { variant: buttonVariant(node), size: buttonSize(node) } };
    }
    if (has(node, /\b(spinner|loader|loading-spinner)\b/)) return { name: 'Spinner' };
    if (has(node, /\bskeleton\b/)) return { name: 'Skeleton' };
    if (has(node, /\bavatar\b/)) return { name: 'Avatar' };
    if (has(node, /\b(toast|sonner-toast)\b/)) return { name: 'Toast' };
    if (has(node, /\bempty[-_ ]?state\b/)) return { name: 'EmptyState' };
    if (isBadge(node) && has(node, /\bchip\b/)) return { name: 'Chip' };
    if (isBadge(node) && has(node, /badge|tag|status|pill/)) return { name: 'Badge' };
    if (has(node, /\b(card|panel)\b/) && isBordered(node) && (node.children?.length ?? 0) > 0)
        return { name: has(node, /\b(stat|kpi|metric)\b/) ? 'StatCard' : 'Card' };
    return undefined;
};

const jsx = (match: PartMatch) => {
    const props = Object.entries(match.props ?? {})
        // The defaults (variant primary, size md) go unwritten, as the library's own code does.
        .filter(
            ([key, value]) =>
                !(key === 'variant' && value === 'primary') && !(key === 'size' && value === 'md'),
        )
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('');
    return `<${match.name}${props}>`;
};

/** The library's import for a part: its own exports, the part's name leading. */
const importLine = (name: string) => {
    const part = findComponent(name);
    const from = part?.from ?? 'continuum';
    const exports = (part?.exports ?? [name]).filter(each => each.startsWith(name)).slice(0, 4);
    return `import { ${(exports.length ? exports : [name]).join(', ')} } from '${from}';`;
};

/** Where the library is there to import, the part itself; elsewhere, the part's spec to hold it to. */
const partFinding = (
    at: string,
    node: string,
    found: string,
    match: PartMatch,
    libraryAvailable: boolean,
    medium: Medium,
    off?: string,
): Finding => {
    const part = findComponent(match.name);
    const name = part?.names[0] ?? match.name;
    const lead = { ...match, name };
    if (libraryAvailable) {
        return {
            rule: 'component',
            severity: 'advise',
            confidence: 'medium',
            at,
            node,
            found,
            expected: `${jsx(lead)} from the library`,
            why: `The library has this part, with its heights, states and focus ring: compose from it rather than restyling a ${node} (components.md › ${name}). get_component ${name} gives its props.`,
            fix: { code: `${importLine(name)}\n${jsx(lead)}…</${name}>` },
            component: name,
        };
    }
    return {
        rule: 'component',
        severity: 'advise',
        confidence: 'medium',
        at,
        node,
        found: off ? `a ${name} off its spec: ${off}` : found,
        expected: `this is a ${name}${match.props ? ` (${Object.values(match.props).join(', ')})` : ''}: hold it to its spec`,
        why: `The system has this part, with its heights, states and focus ring (components.md › ${name}). get_component ${name} ${medium} gives every value, written for this medium.`,
        fix: { code: `get_component ${name} ${medium}` },
        component: name,
    };
};

/** The page renders the library's own parts, so its parts are one import away. */
export const rendersLibrary = (root: UINode) => {
    const visit = (node: UINode, parents: UINode[]): boolean =>
        inContinuumPart(node, parents) ||
        (node.children ?? []).some(child => visit(child, [...parents, node]));
    return visit(root, []);
};

/**
 * The component findings for a rendered tree. Where the library is not there, a part is only
 * worth naming when the rules found its values off: the finding gathers them under the part.
 */
export const treeParts = (
    root: UINode,
    medium: Medium,
    findingsAt: (at: string) => Finding[],
): Finding[] => {
    const library = rendersLibrary(root);
    const out: Finding[] = [];
    const visit = (node: UINode, parents: UINode[]) => {
        if (!inContinuumPart(node, parents)) {
            const match = matchPart(node);
            if (match) {
                const at = where(node);
                const own = findingsAt(at).filter(each => each.severity === 'fix');
                const written = `<${node.tag ?? 'div'}${node.classes ? ` class="${node.classes.slice(0, 60)}"` : ''}>`;
                if (library || own.length) {
                    const off = own
                        .map(
                            each =>
                                `${each.property ?? each.rule} ${each.found} → ${each.expected}`,
                        )
                        .join('; ');
                    out.push(partFinding(at, label(node), written, match, library, medium, off));
                }
            }
        }
        for (const child of node.children ?? []) visit(child, [...parents, node]);
    };
    visit(root, []);
    return out;
};

/* ---------- Raw elements in markup ---------- */

/** The part a raw element stands for; null when it is none (a hidden input, a plain span). */
const elementPart = (element: ElementFact): PartMatch | null => {
    const attributes = element.attributes;
    const type = (attributes.type ?? '').toLowerCase();
    const role = (attributes.role ?? '').toLowerCase();
    const classes = `${attributes.class ?? ''} ${attributes.className ?? ''}`.toLowerCase();
    if (role === 'dialog' || role === 'alertdialog') return { name: 'Dialog' };
    switch (element.tag) {
        case 'button':
            return { name: 'Button' };
        case 'select':
            return { name: 'Select' };
        case 'textarea':
            return { name: 'Textarea' };
        case 'table':
            return { name: 'Table' };
        case 'dialog':
            return { name: 'Dialog' };
        case 'input':
            if (type === 'checkbox') return { name: 'Checkbox' };
            if (type === 'radio') return { name: 'RadioGroup' };
            if (type === 'range') return { name: 'Slider' };
            if (['hidden', 'file', 'submit', 'reset', 'image', 'color'].includes(type)) return null;
            return { name: 'Input' };
        case 'span':
        case 'div': {
            // A badge drawn by hand: named one, or a small rounded tinted label in the meta size.
            if (/\b(badge|chip|status-pill|tag-pill)\b/.test(classes)) return { name: 'Badge' };
            const rounded = /\brounded-(full|pill|chip)\b/.test(classes);
            const small = /\bpx-(1\.5|2|2\.5)\b/.test(classes) && /\btext-(xxs|xs)\b/.test(classes);
            return rounded && small && /\bbg-/.test(classes) ? { name: 'Badge' } : null;
        }
    }
    return null;
};

const dividers =
    'Space, not dividers: sections and groups are separated by distance; a line is kept only inside a bordered container (foundations.md › Surfaces and depth).';

/** Raw elements where the system has a part, and rules drawn between sections. */
export const elementParts = (elements: ElementFact[], medium: Medium): Finding[] => {
    const out: Finding[] = [];
    for (const element of elements) {
        if (element.tag === 'hr') {
            out.push({
                rule: 'dividers',
                severity: 'advise',
                confidence: 'low',
                at: element.at,
                node: '<hr>',
                found: 'a rule drawn as an element',
                expected:
                    'distance: 40 between sections, 20 between blocks; a hairline only inside a bordered container',
                why: dividers,
            });
            continue;
        }
        const match = elementPart(element);
        if (!match) continue;
        const written = `<${element.tag}${element.attributes.role ? ` role="${element.attributes.role}"` : ''}>`;
        out.push(
            partFinding(
                element.at,
                written,
                `hand-rolled ${written}`,
                match,
                element.libraryAvailable,
                medium,
            ),
        );
    }
    return out;
};
