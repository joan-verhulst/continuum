/*
 * Works a component's padding and gaps out with Continuum's spacing formula and prints them as
 * Tailwind classes. Give it the box tree as JSON, as a file or on stdin:
 *
 *   node scripts/compute.ts tree.json
 *
 * A box:  { "id": "card", "surface": true, "row": false, "children": [...] }
 *         `surface: false` is a group with no border or fill of its own (a section, a row of cards):
 *         it gets no padding, only gaps, and passes its children's padding on.
 * A text: { "text": "Billing", "size": 24 }  or  { "lines": 3, "size": 13 }
 *         `pair: true` when it belongs with the text before it (a subheader, a value, a caption).
 *         Give `lines` when you measured them; otherwise they are estimated from `text`.
 *
 * Pass `--params '{"k":0.8}'` to try other constants.
 */
import { readFileSync } from 'node:fs';
import {
    boxGap,
    boxPadding,
    estimateLines,
    type SpacingParams,
    snapToSpacing,
    spacingClass,
    spacingDefaults,
    textGap,
    typeSize,
} from './spacing.ts';

type TextNode = { text?: string; lines?: number; size: number; pair?: boolean };
type BoxNode = { id: string; surface?: boolean; row?: boolean; children: Node[] };
type Node = TextNode | BoxNode;

type Result = {
    id: string;
    surface: boolean;
    padding: number;
    /** What the box around it steps past. */
    reach: number;
    /** Its type size, averaged over its lines and inner boxes. */
    size: number;
    gaps: { between: string; px: number; className: string }[];
    children: Result[];
};

const isBox = (node: Node): node is BoxNode => 'children' in node;
const runOf = (node: TextNode): TypeRun => ({
    size: node.size,
    lines: node.lines ?? estimateLines(node.text ?? ''),
});
const nameOf = (node: Node) =>
    isBox(node) ? node.id : JSON.stringify(node.text ?? `${node.lines} lines`);

const solve = (box: BoxNode, params: SpacingParams): Result => {
    const children = box.children.map(child => (isBox(child) ? solve(child, params) : child));
    const boxes = children.filter((child): child is Result => 'reach' in child);
    const texts = children.filter((child): child is TextNode => !('reach' in child));
    const reaches = boxes.map(child => child.reach);
    const ownRuns = texts.map(runOf);
    const inner = boxes.map(child => ({ padding: child.reach, size: child.size }));

    const gaps: Result['gaps'] = [];
    box.children.forEach((child, index) => {
        const before = box.children[index - 1];
        if (!before) return;
        const between = `${nameOf(before)} → ${nameOf(child)}`;
        const px =
            isBox(child) || isBox(before)
                ? snapToSpacing(boxGap(reaches, params))
                : snapToSpacing(
                      textGap(
                          { before: runOf(before), after: runOf(child), pair: Boolean(child.pair) },
                          params,
                      ),
                  );
        gaps.push({ between, px, className: spacingClass(box.row ? 'gap-x' : 'gap', px) });
    });

    const surface = box.surface !== false;
    const padding = surface
        ? snapToSpacing(boxPadding({ runs: ownRuns, children: inner }, params))
        : 0;
    const size = typeSize([...ownRuns, ...inner.map(child => ({ size: child.size, lines: 1 }))]);

    return {
        id: box.id,
        surface,
        padding,
        reach: surface ? padding : Math.max(0, ...reaches),
        size,
        gaps,
        children: boxes,
    };
};

const print = (result: Result, depth = 0) => {
    const indent = '  '.repeat(depth);
    const pad = result.surface
        ? `${spacingClass('p', result.padding)}  (${result.padding}px)`
        : 'no surface: gaps only';
    console.log(`${indent}${result.id}: ${pad}`);
    for (const gap of result.gaps) {
        console.log(
            `${indent}  ${gap.className.padEnd(9)} ${String(gap.px).padStart(2)}px  ${gap.between}`,
        );
    }
    for (const child of result.children) print(child, depth + 1);
};

const args = process.argv.slice(2);
const paramsAt = args.indexOf('--params');
const params: SpacingParams = {
    ...spacingDefaults,
    ...(paramsAt >= 0 ? JSON.parse(args[paramsAt + 1] ?? '{}') : {}),
};
const file = args.find(
    (arg, index) => !arg.startsWith('--') && (paramsAt < 0 || index !== paramsAt + 1),
);
const tree = JSON.parse(readFileSync(file ?? 0, 'utf8')) as BoxNode;

print(solve(tree, params));
