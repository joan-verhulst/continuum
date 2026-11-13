import { ToolError } from '../support/tool';
import { readColour, toPx } from '../system/values';
import type { Fact, Mode, Subject, UINode } from '../types';
import {
    controlKind,
    floats,
    hasFill,
    inContinuumPart,
    isBadge,
    isDisabled,
    isPicture,
    looksLikeButton,
    where,
} from './rules/context';

/*
 * What audit_ui is handed, made into the neutral box tree. Two shapes come in: the snapshot the
 * browser script returns (already a UINode tree), and a tree of nodes with CSS styles, as a design
 * canvas gives them (Paper's get_computed_styles: a map of node id to camelCase CSS). A canvas
 * layer has no tag, so its kind is read off its name and shape.
 */

export type TreeFormat = 'snapshot' | 'styles';

export type Normalised = { root: UINode; notes: string[]; mode?: Mode };

type Styles = Record<string, string | number | undefined>;

type StyledNode = {
    id?: string;
    name?: string;
    tag?: string;
    type?: string;
    component?: string;
    text?: string;
    textContent?: string;
    characters?: string;
    content?: string;
    styles?: Styles;
    children?: StyledNode[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const cssKeys =
    /^(width|height|display|color|backgroundColor|background-color|fontSize|font-size|padding|borderRadius|border-radius|gap|flexDirection|position)$/;

const looksLikeStyles = (value: unknown) =>
    isObject(value) && Object.keys(value).some(key => cssKeys.test(key));

/** Which shape the tree is: a snapshot's nodes carry box and font, a styles tree carries styles. */
const detect = (input: unknown): TreeFormat => {
    if (Array.isArray(input)) return detect(input[0]);
    if (!isObject(input)) return 'snapshot';
    if ('styles' in input || 'nodes' in input) return 'styles';
    if ('box' in input || 'font' in input || 'fill' in input) return 'snapshot';
    const first = Object.values(input)[0];
    if (looksLikeStyles(first)) return 'styles';
    const children = input.children;
    if (Array.isArray(children) && children.length) return detect(children[0]);
    return 'snapshot';
};

/* ---------- Styles to a box ---------- */

const kebab = (key: string) => key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const reader = (styles: Styles) => (key: string) => {
    const value = styles[key] ?? styles[kebab(key)];
    return value === undefined || value === null ? undefined : String(value).trim();
};

const length = (value: string | undefined, fontSize = 16): number | undefined => {
    if (value === undefined || value === '' || value === 'auto' || value === 'normal')
        return undefined;
    if (/^-?[\d.]+em$/.test(value)) return Number.parseFloat(value) * fontSize;
    if (/^-?[\d.]+$/.test(value)) return Number(value);
    return toPx(value) ?? undefined;
};

/** A CSS shorthand of one to four lengths as top, right, bottom, left. */
const four = (value: string | undefined): [number, number, number, number] | undefined => {
    if (!value) return undefined;
    const parts = value.split(/\s+/).map(part => length(part) ?? 0);
    const [a = 0, b = a, c = a, d = b] = parts;
    return [a, b, c, d];
};

const borderShorthand = (value: string | undefined) => {
    if (!value || value === 'none') return undefined;
    const width = length(/([\d.]+px)/.exec(value)?.[1]) ?? 1;
    const style = /\b(solid|dashed|dotted|double|none|hidden)\b/.exec(value)?.[1] ?? 'solid';
    const color = value
        .replace(/[\d.]+px/, '')
        .replace(/\b(solid|dashed|dotted|double|none|hidden)\b/, '')
        .trim();
    return { width, style, color };
};

const weightOf = (value: string | undefined) => {
    if (!value) return undefined;
    if (value === 'bold') return 700;
    if (value === 'normal') return 400;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
};

const tagOf = (raw: StyledNode) => {
    if (raw.tag) return raw.tag.toLowerCase();
    const type = (raw.type ?? raw.component ?? '').toLowerCase();
    if (type.includes('text')) return 'text';
    if (type.includes('image') || type.includes('img')) return 'img';
    if (type.includes('svg') || type.includes('vector') || type.includes('icon')) return 'svg';
    return type || 'frame';
};

/** A canvas layer's kind from its name and shape: "Button / primary", a 34-high filled box of text. */
const inferRole = (node: UINode) => {
    const name = (node.name ?? '').toLowerCase();
    const height = node.box?.height ?? 0;
    const width = node.box?.width ?? 0;
    if (
        /\b(input|field|textbox|search|select|dropdown|combobox)\b/.test(name) &&
        height >= 24 &&
        height <= 56
    )
        return name.includes('select') || name.includes('dropdown') ? 'combobox' : 'textbox';
    if (/\b(button|btn|cta)\b/.test(name)) return 'button';
    if (/\b(tab)\b/.test(name) && !/\btable\b/.test(name)) return 'tab';
    if (/\bcheckbox\b/.test(name)) return 'checkbox';
    if (/\bswitch|toggle\b/.test(name)) return 'switch';
    if (/\bdialog|modal\b/.test(name)) return 'dialog';
    if (/\btable\b/.test(name)) return 'table';
    if (/\brow\b/.test(name) && height >= 28 && height <= 64) return 'row';
    const kids = node.children ?? [];
    const textChild = kids.length >= 1 && kids.length <= 3 && kids.some(child => child.content);
    const drawn = Boolean(node.fill || node.border);
    if (drawn && textChild && height >= 26 && height <= 48 && width < 400 && width > height)
        return 'button';
    // A filled box that sets its own type and holds nothing: a label drawn on a control's row.
    const wide = !width || (width < 400 && width > height);
    if (drawn && !kids.length && node.font && height >= 26 && height <= 48 && wide) return 'button';
    return undefined;
};

const fromStyles = (raw: StyledNode, lookup: Record<string, Styles>): UINode => {
    const styles = raw.styles ?? (raw.id ? lookup[raw.id] : undefined) ?? {};
    const get = reader(styles);
    const fontSize = length(get('fontSize'));
    const node: UINode = { tag: tagOf(raw) };
    if (raw.id) node.id = raw.id;
    if (raw.name) node.name = raw.name;
    const content =
        raw.text ??
        raw.textContent ??
        raw.characters ??
        raw.content ??
        (node.tag === 'text' ? raw.name : undefined);
    if (content) node.content = content.trim().slice(0, 120);

    const box: NonNullable<UINode['box']> = {};
    const width = length(get('width'));
    const height = length(get('height'));
    if (width !== undefined) box.width = width;
    if (height !== undefined) box.height = height;
    const left = length(get('left'));
    const top = length(get('top'));
    if (left !== undefined) box.x = left;
    if (top !== undefined) box.y = top;
    const padding = four(get('padding'));
    const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
    sides.forEach((side, index) => {
        const value =
            length(get(`padding${side}`)) ??
            (side === 'Top' || side === 'Bottom'
                ? four(get('paddingBlock'))?.[0]
                : four(get('paddingInline'))?.[0]) ??
            padding?.[index];
        if (value) box[`padding${side}`] = value;
    });
    const gap = get('gap')
        ?.split(/\s+/)
        .map(part => length(part));
    const rowGap = length(get('rowGap')) ?? gap?.[0];
    const columnGap = length(get('columnGap')) ?? gap?.[1] ?? gap?.[0];
    if (rowGap !== undefined && columnGap !== undefined && rowGap !== columnGap) {
        box.rowGap = rowGap;
        box.columnGap = columnGap;
    } else if (rowGap) box.gap = rowGap;
    const radius = get('borderRadius');
    if (radius) {
        if (radius.includes('%')) box.radius = 9999;
        else {
            const corners = four(radius.split('/')[0]?.trim());
            if (corners)
                box.radius = corners.every(each => each === corners[0]) ? corners[0] : corners;
        }
    }
    if (Object.keys(box).length) node.box = box;

    const background = get('backgroundColor') ?? get('background');
    const fill = background && readColour(background) ? background : undefined;
    if (fill && (readColour(fill)?.alpha ?? 0) > 0) node.fill = fill;

    const all = borderShorthand(get('border'));
    const width1 = length(get('borderWidth')) ?? all?.width;
    const color = get('borderColor') ?? all?.color;
    const style = get('borderStyle') ?? all?.style ?? 'solid';
    const sideBorders = sides
        .map(side => ({ side, ...borderShorthand(get(`border${side}`)) }))
        .filter(each => each.width && each.style !== 'none');
    if (width1 && color && style !== 'none') node.border = { width: width1, color, style };
    else if (sideBorders.length && sideBorders[0]?.color) {
        node.border = {
            width: sideBorders[0].width ?? 1,
            color: sideBorders[0].color,
            sides: sideBorders.map(each => each.side.toLowerCase() as 'top'),
        };
    }

    const shadow = get('boxShadow');
    if (shadow && shadow !== 'none') node.shadow = shadow;

    if (node.content || fontSize !== undefined) {
        const font: NonNullable<UINode['font']> = {};
        if (fontSize !== undefined) font.size = fontSize;
        const weight = weightOf(get('fontWeight'));
        if (weight) font.weight = weight;
        const family = get('fontFamily');
        if (family) font.family = family;
        const line = get('lineHeight');
        if (line)
            font.lineHeight = /^[\d.]+$/.test(line)
                ? Number(line) * (fontSize ?? 16)
                : line.endsWith('%')
                  ? (Number.parseFloat(line) / 100) * (fontSize ?? 16)
                  : length(line);
        const tracking = length(get('letterSpacing'), fontSize);
        if (tracking) font.letterSpacing = tracking;
        const colour = get('color');
        if (colour) font.color = colour;
        // A layer with type and no children is text, even when the canvas left its words out.
        if (node.content || !raw.children?.length) node.font = font;
    }

    const layout: NonNullable<UINode['layout']> = {};
    const display = get('display');
    if (display) layout.display = display;
    const direction = get('flexDirection');
    if (direction) layout.direction = direction.startsWith('column') ? 'column' : 'row';
    const position = get('position');
    if (position && position !== 'static') layout.position = position as 'absolute';
    const z = Number(get('zIndex'));
    if (Number.isFinite(z) && get('zIndex') !== undefined) layout.zIndex = z;
    const opacity = Number(get('opacity'));
    if (get('opacity') !== undefined && opacity < 1) layout.opacity = opacity;
    if (Object.keys(layout).length) node.layout = layout;

    const children = (raw.children ?? []).map(child => fromStyles(child, lookup));
    if (children.length) node.children = children;
    const role = inferRole(node);
    if (role) {
        node.role = role;
        if (['button', 'textbox', 'combobox', 'tab', 'checkbox', 'switch'].includes(role))
            node.interactive = true;
    }
    return node;
};

/* ---------- Either shape in ---------- */

const fromStylesInput = (input: unknown): UINode => {
    if (Array.isArray(input)) {
        return { tag: 'root', children: input.map(each => fromStyles(each as StyledNode, {})) };
    }
    if (!isObject(input)) throw new ToolError('tree must be an object or an array of nodes.');
    // { root | tree | node, styles: { id: css } }: a tree with Paper's computed styles beside it.
    const tree =
        input.root ??
        input.tree ??
        input.node ??
        (Array.isArray(input.nodes) ? input.nodes : undefined);
    const lookup =
        isObject(input.styles) && !looksLikeStyles(input.styles)
            ? (input.styles as Record<string, Styles>)
            : {};
    if (Array.isArray(tree))
        return { tag: 'root', children: tree.map(each => fromStyles(each as StyledNode, lookup)) };
    if (isObject(tree)) return fromStyles(tree as StyledNode, lookup);
    if ('styles' in input && looksLikeStyles(input.styles))
        return fromStyles(input as StyledNode, {});
    // A bare map of id → styles: get_computed_styles's own output, without the tree.
    const entries = Object.entries(input).filter(([, value]) => looksLikeStyles(value));
    if (entries.length) {
        return {
            tag: 'root',
            children: entries.map(([id, styles]) =>
                fromStyles({ id, styles: styles as Styles }, {}),
            ),
        };
    }
    return fromStyles(input as StyledNode, lookup);
};

export const normalise = (input: unknown, format?: TreeFormat): Normalised => {
    let value = input;
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            throw new ToolError(
                'tree is a string that is not JSON. Pass the object get_snapshot_script returns, or a styles tree.',
            );
        }
    }
    const shape = format ?? detect(value);
    const notes: string[] = [];
    if (shape === 'styles') {
        const root = fromStylesInput(value);
        notes.push(
            'Read as a styles tree: kinds inferred from layer names and shapes, so name layers by their part ("Button / primary") for a surer audit.',
        );
        return { root, notes };
    }
    if (!isObject(value))
        throw new ToolError('tree must be the object get_snapshot_script returns.');
    const {
        note,
        mode,
        viewport: _,
        ...rest
    } = value as UINode & {
        note?: string;
        mode?: string;
        viewport?: unknown;
    };
    if (note) notes.push(note);
    return {
        root: rest as UINode,
        notes,
        mode: mode === 'dark' || mode === 'light' ? mode : undefined,
    };
};

/* ---------- The tree as facts ---------- */

/*
 * Each box's values become facts, the same facts a stylesheet or a class string becomes, so one
 * rule set judges them. What a value sits on is read off the node (its tag, role, size, shape and
 * whether it acts); the tree itself is kept for the few checks only a tree can answer.
 */

const subjectOf = (node: UINode, parents: UINode[]): Subject => {
    const words = [node.name, node.classes].filter(Boolean).join(' ').trim();
    const subject: Subject = { kind: kindOf(node, parents) };
    if (node.tag) subject.tag = node.tag;
    if (node.role) subject.role = node.role;
    const name = isDisabled(node, parents) ? `${words} disabled`.trim() : words;
    if (name) subject.name = name;
    if (node.content || (node.font && !node.children?.length)) subject.text = true;
    if (isPicture(node, parents)) subject.picture = true;
    if (inContinuumPart(node, parents)) subject.library = true;
    return subject;
};

const isLine = (node: UINode, parents: UINode[]) => {
    if (node.tag === 'hr' || node.role === 'separator') return true;
    const box = node.box;
    const parentWidth = parents[parents.length - 1]?.box?.width;
    return Boolean(
        box?.height &&
            box.height <= 1.5 &&
            hasFill(node) &&
            box.width &&
            parentWidth &&
            box.width >= parentWidth * 0.5,
    );
};

/** What a node is, in the kinds the rules know. */
const kindOf = (node: UINode, parents: UINode[]): NonNullable<Subject['kind']> => {
    if (isLine(node, parents)) return 'divider';
    const kind = controlKind(node);
    const height = node.box?.height ?? 0;
    const width = node.box?.width ?? 0;
    if (kind && kind !== 'link' && kind !== 'mark') {
        const square = height > 0 && Math.abs(height - width) <= 2 && height <= 40;
        return square && !node.content && kind === 'button' ? 'icon-control' : 'control';
    }
    if (kind === 'mark') return 'control';
    // A button's own label: its colour is the control's text (on-action on a filled one).
    const parentKind = parents.length
        ? controlKind(parents[parents.length - 1] as UINode)
        : undefined;
    if (node.content && parentKind && parentKind !== 'link' && parentKind !== 'mark')
        return 'control';
    if (kind === 'link' && looksLikeButton(node)) return 'control';
    if (isBadge(node)) return 'badge';
    if (node.tag === 'tr' || node.role === 'row') return 'row';
    if (floats(node, parents)) return 'floating';
    if (!parents.length || ['body', 'main', 'root'].includes(node.tag ?? '')) return 'page';
    if (node.content || (node.font && !node.children?.length)) return 'text';
    return 'container';
};

const lengthPx = (value: number) => `${Math.round(value * 10) / 10}px`;

/** Four sides as the shortest CSS shorthand: '12px', '8px 12px', '8px 12px 4px', or all four. */
const shorthand = ([top, right, bottom, left]: number[]) => {
    const [t, r, b, l] = [top, right, bottom, left].map(each => lengthPx(each ?? 0));
    if (t === r && r === b && b === l) return `${t}`;
    if (t === b && r === l) return `${t} ${r}`;
    if (r === l) return `${t} ${r} ${b}`;
    return `${t} ${r} ${b} ${l}`;
};

/** Heights are only a value of their own on what sits in a row. */
const sized = new Set(['control', 'icon-control', 'badge', 'row']);

export type TreeFacts = {
    facts: Fact[];
    /** How many nodes were read, how many carried type, how many were the library's own parts. */
    seen: number;
    withFont: number;
    library: number;
};

export const factsOf = (root: UINode): TreeFacts => {
    const facts: Fact[] = [];
    let seen = 0;
    let withFont = 0;
    let library = 0;
    const visit = (node: UINode, parents: UINode[]) => {
        seen++;
        const subject = subjectOf(node, parents);
        if (subject.library) library++;
        const at = where(node);
        const add = (property: string, value: string | undefined) => {
            if (value === undefined || value === '') return;
            facts.push({
                at,
                property,
                value,
                subject,
                written: { form: 'rendered', text: `${property}: ${value}` },
            });
        };
        const fill = readColour(node.fill);
        if (node.fill && fill && fill.alpha > 0) add('background-color', node.fill);
        const border = node.border;
        if (border && border.width > 0 && border.style !== 'none') {
            const sides =
                border.sides?.length && border.sides.length < 4 ? border.sides : undefined;
            for (const side of sides ?? [undefined]) {
                const prefix = side ? `border-${side}` : 'border';
                add(`${prefix}-width`, lengthPx(border.width));
                add(`${prefix}-color`, border.color);
            }
        }
        if (node.shadow && node.shadow !== 'none') add('box-shadow', node.shadow);
        const box = node.box;
        if (box?.radius !== undefined) {
            const corners = Array.isArray(box.radius) ? box.radius : [box.radius];
            const largest = Math.max(...corners);
            const short = Math.min(
                box.width ?? Number.POSITIVE_INFINITY,
                box.height ?? Number.POSITIVE_INFINITY,
            );
            // Fully round is a shape, a pill or a circle, whatever px the browser computed for it.
            if (largest >= 999 || (Number.isFinite(short) && largest >= short / 2 - 0.5))
                add('border-radius', '50%');
            else if (largest > 0) add('border-radius', corners.map(lengthPx).join(' '));
        }
        if (box) {
            const paddings = [
                box.paddingTop,
                box.paddingRight,
                box.paddingBottom,
                box.paddingLeft,
            ].map(each => each ?? 0);
            if (paddings.some(each => each > 0) && node.layout?.display !== 'inline')
                add('padding', shorthand(paddings));
            if (box.rowGap !== undefined || box.columnGap !== undefined) {
                if (box.rowGap) add('row-gap', lengthPx(box.rowGap));
                if (box.columnGap) add('column-gap', lengthPx(box.columnGap));
            } else if (box.gap) add('gap', lengthPx(box.gap));
            if (box.height && sized.has(subject.kind ?? '')) add('height', lengthPx(box.height));
        }
        const font = node.font;
        if (font && subject.text) {
            withFont++;
            add('color', font.color);
            if (font.size) add('font-size', lengthPx(font.size));
            if (font.weight) add('font-weight', String(font.weight));
            add('font-family', font.family);
        }
        for (const child of node.children ?? []) visit(child, [...parents, node]);
    };
    visit(root, []);
    return { facts, seen, withFont, library };
};
