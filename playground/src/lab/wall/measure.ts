import type { Piece } from './pieces';

/** What the wall reads off a piece once it is drawn, from the DOM, never from the code. */
export type Measured = {
    /** Height and width of the piece's outer box. */
    h: number;
    w: number;
    /** The root's padding: top, right, bottom, left. */
    padding: [number, number, number, number];
    radius: number;
    /** The first text's size and weight, "13 500". */
    font?: string;
    /** The root's gap between its children, as laid out. */
    gap?: number;
    /** The first icon's width. */
    icon?: number;
    /** From the first icon to the text after it. */
    iconGap?: number;
    /** The first text's baseline, from the piece's top. */
    baseline?: number;
};

/** A tinted area of the padding and gap overlay, in the strip's coordinates. */
export type Area = {
    kind: 'padding' | 'gap';
    x: number;
    y: number;
    w: number;
    h: number;
    value: number;
};

export const round = (value: number) => Math.round(value * 2) / 2;

const px = (value: string) => Number.parseFloat(value) || 0;

/** The pieces' sizes that are on the system's scale; anything else is worth a look. */
export const scale = [20, 22, 34, 38, 41];

const shown = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
};

/** In the flow, so it takes part in the gaps: not positioned out, not hidden. */
const inFlow = (element: Element) => {
    if (!shown(element)) return false;
    const { position, display } = getComputedStyle(element);
    return position !== 'absolute' && position !== 'fixed' && display !== 'none';
};

/** The first run of text inside an element. */
const firstText = (root: Element) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node =>
            node.textContent?.trim() && node.parentElement && shown(node.parentElement)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
    });
    return walker.nextNode() as Text | null;
};

let context: CanvasRenderingContext2D | null | undefined;

/**
 * Where a text's baseline sits: the bottom of its first line's glyph box, less the font's descent.
 * Read from the text itself, so it holds in a flex or grid parent as well as in a line of text.
 */
const baselineOf = (text: Text, type: CSSStyleDeclaration) => {
    const range = document.createRange();
    range.selectNodeContents(text);
    const line = range.getClientRects()[0];
    if (!line) return undefined;
    context ??= document.createElement('canvas').getContext('2d');
    if (!context) return undefined;
    context.font = `${type.fontStyle} ${type.fontWeight} ${type.fontSize} ${type.fontFamily}`;
    return line.bottom - context.measureText('Hg').fontBoundingBoxDescent;
};

/** The space between a container's children in the flow, left to right or top to bottom. */
const gapsOf = (container: Element) => {
    const children = [...container.children].filter(inFlow);
    const gaps: { from: DOMRect; to: DOMRect; across: boolean }[] = [];
    for (let i = 1; i < children.length; i++) {
        const from = children[i - 1]?.getBoundingClientRect();
        const to = children[i]?.getBoundingClientRect();
        if (!from || !to) continue;
        if (to.left >= from.right - 0.5 && to.top < from.bottom && to.bottom > from.top)
            gaps.push({ from, to, across: true });
        else if (to.top >= from.bottom - 0.5) gaps.push({ from, to, across: false });
    }
    return gaps;
};

const rootOf = (body: HTMLElement, piece: Piece) =>
    ((piece.root && body.querySelector(piece.root)) ||
        body.firstElementChild) as HTMLElement | null;

export const measure = (body: HTMLElement, piece: Piece): Measured => {
    // The piece's own outer box: the body is top-aligned and never stretched, so it is the piece.
    const rect = body.getBoundingClientRect();
    const { top } = rect;
    const root = rootOf(body, piece);
    const result: Measured = {
        h: round(rect.height),
        w: round(rect.width),
        padding: [0, 0, 0, 0],
        radius: 0,
    };
    if (!root) return result;

    const style = getComputedStyle(root);
    result.padding = [
        px(style.paddingTop),
        px(style.paddingRight),
        px(style.paddingBottom),
        px(style.paddingLeft),
    ];
    result.radius = Math.min(px(style.borderTopLeftRadius), round(rect.height / 2));

    // The gap as laid out: the first pair of children side by side, else stacked.
    const [first] = gapsOf(root);
    if (first)
        result.gap = round(
            first.across ? first.to.left - first.from.right : first.to.top - first.from.bottom,
        );

    const text = firstText(root);
    if (text?.parentElement) {
        const type = getComputedStyle(text.parentElement);
        result.font = `${px(type.fontSize)} ${type.fontWeight}`;
        const baseline = baselineOf(text, type);
        if (baseline !== undefined) result.baseline = round(baseline - top);
    }

    const svg = root.querySelector('svg');
    if (svg && shown(svg)) {
        // Its laid-out box, not its painted one, which a spinning icon turns wider.
        const painted = svg.getBoundingClientRect();
        const width = px(getComputedStyle(svg).width) || painted.width;
        const centre = painted.left + painted.width / 2;
        const glyph = {
            left: centre - width / 2,
            right: centre + width / 2,
            top: painted.top,
            bottom: painted.bottom,
        };
        result.icon = round(width);
        if (text) {
            const range = document.createRange();
            range.selectNodeContents(text);
            const words = range.getBoundingClientRect();
            // Only an icon that leads its label on the same line, not one in another button.
            if (
                words.left >= glyph.right &&
                words.left - glyph.right <= 24 &&
                words.top < glyph.bottom &&
                words.bottom > glyph.top
            )
                result.iconGap = round(words.left - glyph.right);
        }
    }

    return result;
};

/**
 * The padding and gaps inside a piece, as the box model shows them: the padding of every box three
 * levels down, and the space between the children of each.
 */
export const areasOf = (body: HTMLElement, origin: DOMRect): Area[] => {
    const areas: Area[] = [];
    const at = (x: number, y: number, w: number, h: number, kind: Area['kind'], value: number) => {
        if (w <= 0.25 || h <= 0.25) return;
        areas.push({
            kind,
            x: x - origin.left,
            y: y - origin.top,
            w,
            h,
            value: round(value),
        });
    };

    const visit = (element: Element, depth: number) => {
        if (depth > 3 || element instanceof SVGElement || !shown(element)) return;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const [t, r, b, l] = [
            px(style.paddingTop) + px(style.borderTopWidth),
            px(style.paddingRight) + px(style.borderRightWidth),
            px(style.paddingBottom) + px(style.borderBottomWidth),
            px(style.paddingLeft) + px(style.borderLeftWidth),
        ];
        const [bt, br, bb, bl] = [
            px(style.borderTopWidth),
            px(style.borderRightWidth),
            px(style.borderBottomWidth),
            px(style.borderLeftWidth),
        ];
        // The padding inside the border, each side its own strip.
        at(rect.left + bl, rect.top + bt, rect.width - bl - br, t - bt, 'padding', t - bt);
        at(rect.left + bl, rect.bottom - b, rect.width - bl - br, b - bb, 'padding', b - bb);
        at(rect.left + bl, rect.top + t, l - bl, rect.height - t - b, 'padding', l - bl);
        at(rect.right - r, rect.top + t, r - br, rect.height - t - b, 'padding', r - br);

        for (const { from, to, across } of gapsOf(element)) {
            if (across) {
                const top = Math.min(from.top, to.top);
                const bottom = Math.max(from.bottom, to.bottom);
                at(
                    from.right,
                    top,
                    to.left - from.right,
                    bottom - top,
                    'gap',
                    to.left - from.right,
                );
            } else {
                const left = Math.min(from.left, to.left);
                const right = Math.max(from.right, to.right);
                at(
                    left,
                    from.bottom,
                    right - left,
                    to.top - from.bottom,
                    'gap',
                    to.top - from.bottom,
                );
            }
        }
        for (const child of element.children) visit(child, depth + 1);
    };

    for (const child of body.children) {
        if (child.hasAttribute('data-wall-layer')) continue;
        visit(child, 0);
    }
    return areas;
};
