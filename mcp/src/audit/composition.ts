import type { Finding, UINode } from '../types';
import { inGraphic, isBordered, isContainer, where } from './rules/context';

/*
 * Advice on how a rendered page is composed: what only boxes laid out on a page can show, never
 * the markup. The order of a page (key figures before the chart), one column rather than cards
 * side by side, one way of titling sections, rows that end level, a
 * list that grows shown in part. Every finding is 'advise': the page's shape changes only when the
 * person agrees. Each check reads positions, so a tree without them (source markup) is skipped.
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

const descendants = (node: UINode) => flatten(node).slice(1);

const list = (nodes: UINode[]) => {
    const shown = nodes.slice(0, 3).map(where);
    return nodes.length > 3 ? `${shown.join(', ')} (+${nodes.length - 3} more)` : shown.join(', ');
};

const advise = (
    at: string,
    confidence: Finding['confidence'],
    fields: Omit<Finding, 'at' | 'severity' | 'confidence'>,
): Finding => ({ severity: 'advise', confidence, at, ...fields });

const measured = (node: UINode) =>
    node.box?.y !== undefined && node.box.x !== undefined && Boolean(node.box.width);

const isOverlay = (node: UINode) =>
    ['dialog', 'alertdialog', 'menu', 'listbox', 'tooltip'].includes(node.role ?? '') ||
    node.layout?.position === 'fixed';

/** In the page itself, not in a dialog, a menu or the app's frame (sidebar, header, dock). */
const inPage = ({ node, parents }: Visit) =>
    ![node, ...parents].some(
        each =>
            isOverlay(each) ||
            ['navigation', 'banner'].includes(each.role ?? '') ||
            /^(nav|header|aside)$/.test(each.tag ?? '') ||
            /sidebar|dock|bottom-?bar|header-?bar/i.test(
                `${each.name ?? ''} ${each.classes ?? ''}`,
            ),
    );

const card = (node: UINode) => isContainer(node) && isBordered(node);

/** The largest text inside a node, the figure of a stat card. */
const largestText = (node: UINode) =>
    Math.max(
        0,
        ...flatten(node)
            .filter(({ node: each }) => each.content)
            .map(({ node: each }) => each.font?.size ?? 0),
    );

const isChart = ({ node, parents }: Visit) =>
    node.tag === 'svg' &&
    !parents.some(parent => parent.tag === 'svg') &&
    (node.box?.height ?? 0) >= 140 &&
    (node.box?.width ?? 0) >= 280;

/** A stat card: a short card led by one large figure. */
const isStatCard = (node: UINode) =>
    card(node) &&
    (node.box?.height ?? 999) <= 170 &&
    largestText(node) >= 17 &&
    !descendants(node).some(each => isChart(each));

const isTable = (node: UINode) =>
    node.tag === 'table' || node.role === 'table' || node.role === 'grid';

const isHeading = (node: UINode) =>
    Boolean(node.content) &&
    (node.role === 'heading' || /^h[2-4]$/.test(node.tag ?? '') || (node.font?.size ?? 0) >= 15) &&
    (node.font?.size ?? 0) < 23 &&
    (node.font?.weight ?? 400) >= 500;

const top = (node: UINode) => node.box?.y ?? 0;
const bottom = (node: UINode) => (node.box?.y ?? 0) + (node.box?.height ?? 0);
const left = (node: UINode) => node.box?.x ?? 0;

/** Siblings laid side by side: groups of two or more that start on one line. */
const rowsOf = (siblings: UINode[]) => {
    const rows: UINode[][] = [];
    for (const each of siblings.filter(measured)) {
        const row = rows.find(group => Math.abs(top(group[0] as UINode) - top(each)) <= 4);
        if (row) row.push(each);
        else rows.push([each]);
    }
    return rows.filter(
        row => row.length >= 2 && new Set(row.map(each => Math.round(left(each)))).size >= 2,
    );
};

export const analyseComposition = (root: UINode): Finding[] => {
    const visits = flatten(root).filter(inPage);
    if (!visits.some(({ node }) => measured(node))) return [];
    const findings: Finding[] = [];
    const pageWidth =
        root.box?.width ?? Math.max(...visits.map(({ node }) => node.box?.width ?? 0));
    const pageHeight = root.box?.height ?? 0;

    // The side panel: a full-height column at the right, behind a hairline on its left.
    const panels = flatten(root).filter(
        ({ node }) =>
            measured(node) &&
            (node.border?.sides?.includes('left') ?? false) &&
            !node.border?.sides?.includes('right') &&
            left(node) >= pageWidth * 0.55 &&
            (node.box?.width ?? 0) >= 240 &&
            (node.box?.width ?? 0) <= 480 &&
            (pageHeight === 0 || (node.box?.height ?? 0) >= pageHeight * 0.6),
    );
    // Whether a panel's content stays in view while the main column changes is the plan's to say, not the
    // boxes': a panel is not judged here, only kept out of the one-column rule below.
    const inPanel = (each: UINode, parents: UINode[]) =>
        panels.some(({ node }) => node === each || parents.includes(node));

    // One column: unlike blocks laid side by side, a grid of cards or a main and a side column.
    const sideBySide: UINode[][] = [];
    for (const { node, parents } of visits) {
        if (inPanel(node, parents) || !node.children?.length) continue;
        for (const row of rowsOf(node.children)) {
            // The main column beside a side panel is the panel's own layout, judged above.
            if (row.some(each => panels.some(({ node: panel }) => panel === each))) continue;
            const blocks = row.filter(
                each => (card(each) || isContainer(each)) && (each.box?.height ?? 0) >= 120,
            );
            if (blocks.length < 2 || blocks.every(isStatCard)) continue;
            // Cards of one kind in a row (a gallery, plans to choose from) are one list, not a layout.
            const heights = blocks.map(each => each.box?.height ?? 0);
            const widths = blocks.map(each => each.box?.width ?? 0);
            // Short cards of one size in a row (a set of summaries, plans to choose from) read as one list.
            const alike =
                Math.max(...heights) - Math.min(...heights) <= 8 &&
                Math.max(...widths) - Math.min(...widths) <= 8 &&
                Math.max(...heights) < 200;
            if (alike) continue;
            const holdsBlocks = blocks.filter(
                each =>
                    card(each) ||
                    descendants(each).some(
                        ({ node: inner }) =>
                            card(inner) || isTable(inner) || isChart({ node: inner, parents: [] }),
                    ),
            );
            if (holdsBlocks.length >= 2) sideBySide.push(blocks);
        }
    }
    // Report the outermost row once; the rows inside it say the same.
    const outer = sideBySide.filter(
        row =>
            !sideBySide.some(
                other =>
                    other !== row &&
                    other.some(block =>
                        row.some(each => descendants(block).some(({ node }) => node === each)),
                    ),
            ),
    );
    for (const row of outer) {
        findings.push(
            advise(list(row), 'medium', {
                rule: 'one-column',
                found: `${row.length} blocks side by side (${row.map(each => `${Math.round(each.box?.width ?? 0)}×${Math.round(each.box?.height ?? 0)}`).join(', ')})`,
                expected:
                    'one column in reading order, each block under the one before; what stays in view while the main column is worked in a side panel at the right, behind a full-height hairline',
                why: 'A page reads top to bottom in one column; unlike blocks side by side never line up and do not hold when their content grows. A grid of unlike cards is never the answer (pages.md › Standing decisions, › The side panel).',
            }),
        );
    }

    // Key figures first: on a page with stat cards and a chart, the stat cards come before it.
    const stats = visits.filter(({ node }) => isStatCard(node)).map(({ node }) => node);
    const charts = visits.filter(isChart).map(({ node }) => node);
    if (stats.length >= 2 && charts.length > 0) {
        const firstStat = Math.min(...stats.map(top));
        const above = charts.filter(chart => bottom(chart) <= firstStat + 4);
        if (above.length > 0) {
            findings.push(
                advise(list(above), 'medium', {
                    rule: 'figures-first',
                    found: `a chart above the stat cards (the chart at y ${Math.round(top(above[0] as UINode))}, the first stat card at y ${Math.round(firstStat)})`,
                    expected: 'the stat cards right under the page head, then the chart that leads',
                    why: 'A reader takes the key figures first, then the figure that explains them: the stat cards come before the leading chart (pages.md › The page kinds › Overview).',
                }),
            );
        }
    }

    // Cards side by side end level: the same lines in each.
    for (const { node } of visits) {
        for (const row of rowsOf(node.children ?? [])) {
            const cards = row.filter(isStatCard);
            if (cards.length < 2) continue;
            const heights = cards.map(each => Math.round(each.box?.height ?? 0));
            if (Math.max(...heights) - Math.min(...heights) <= 4) continue;
            findings.push(
                advise(list(cards), 'high', {
                    rule: 'end-level',
                    found: `stat cards in one row at different heights: ${heights.join(', ')}px`,
                    expected:
                        'the same lines in every card of the row (label, figure, the line under it), so they end level; a missing line as "—"',
                    why: 'Cards in a row are read as one set; one taller than the rest reads as a mistake (patterns.md › Key figures; components.md › StatCard).',
                }),
            );
        }
    }

    // One way of titling sections: all above their content, or all inside their cards.
    const headings = visits.filter(
        ({ node, parents }) =>
            isHeading(node) && !inPanel(node, parents) && !inGraphic(node, parents),
    );
    const insideCard = headings.filter(({ parents }) =>
        parents.some(parent => card(parent) && !isStatCard(parent)),
    );
    const above = headings.filter(
        ({ parents, node }) =>
            !parents.some(card) &&
            // A title over a block: something bordered or a table follows it closely.
            (node.font?.size ?? 0) >= 15,
    );
    if (insideCard.length > 0 && above.length > 0) {
        findings.push(
            advise(list([...above, ...insideCard].map(each => each.node)), 'medium', {
                rule: 'section-titles',
                found: `${above.length} section title${above.length > 1 ? 's' : ''} above ${above.length > 1 ? 'their' : 'its'} content and ${insideCard.length} inside ${insideCard.length > 1 ? 'their cards' : 'its card'}`,
                expected:
                    'one way on the page: every section titled above its content (16/500), or every one inside its card',
                why: 'Sections titled two ways read as two pages stitched together (pages.md › A section).',
            }),
        );
    }

    // A table says what its columns are.
    for (const { node } of visits) {
        if (!isTable(node)) continue;
        const inner = descendants(node).map(each => each.node);
        const rows = inner.filter(each => each.role === 'row' || each.tag === 'tr');
        const head = inner.some(
            each => each.role === 'columnheader' || each.tag === 'th' || each.tag === 'thead',
        );
        const cells = Math.max(0, ...rows.map(row => (row.children ?? []).length));
        if (head || rows.length < 2 || cells < 3) continue;
        findings.push(
            advise(where(node), 'medium', {
                rule: 'table-head',
                found: `a table of ${rows.length} rows and ${cells} columns with no header row`,
                expected:
                    'a header row naming each column (12/500, neutral-600); numbers right-aligned under their head',
                why: 'A table is read by its columns; without their names every cell must be guessed (components.md › Table).',
            }),
        );
    }

    // A list that grows, on a page about something else, shows about ten and a way to all.
    const sections =
        stats.length +
        charts.length +
        headings.length +
        visits.filter(({ node }) => card(node) && !isStatCard(node)).length;
    for (const { node, parents } of visits) {
        const rows = isTable(node)
            ? descendants(node).filter(
                  ({ node: each }) =>
                      (each.role === 'row' || each.tag === 'tr') &&
                      !(each.children ?? []).some(
                          cell => cell.role === 'columnheader' || cell.tag === 'th',
                      ),
              )
            : node.role === 'list' || /^(ul|ol)$/.test(node.tag ?? '')
              ? (node.children ?? []).map(each => ({ node: each, parents: [] }))
              : [];
        if (rows.length <= 12 || inPanel(node, parents)) continue;
        if (parents.some(parent => isTable(parent) || parent.role === 'list')) continue;
        // The list is the page (an index): its own rows are the content, nothing to cut.
        const share = (node.box?.height ?? 0) / Math.max(1, pageHeight);
        if (sections < 4 || share > 0.6) continue;
        findings.push(
            advise(where(node), 'medium', {
                rule: 'long-list',
                found: `${rows.length} rows of a list on a page about something else`,
                expected:
                    'about 10 rows, the full count in the section head, and a ghost "View all" opening the list on its own page or a sheet',
                why: 'A list that can grow buries what follows it; the page shows enough to act on and links to the rest (patterns.md › A list that can grow, on a page about something else).',
            }),
        );
    }

    // Width follows density: only an index of several columns is wide.
    const title = visits.find(
        ({ node, parents }) =>
            node.content &&
            (node.font?.size ?? 0) >= 23.5 &&
            (node.font?.size ?? 0) < 31 &&
            !inGraphic(node, parents),
    );
    const column = title
        ? [...title.parents].reverse().find(parent => (parent.box?.height ?? 0) >= 300)
        : undefined;
    if (column?.box?.width) {
        const inner =
            column.box.width - (column.box.paddingLeft ?? 0) - (column.box.paddingRight ?? 0);
        const columnsOf = (table: UINode) =>
            Math.max(
                0,
                ...descendants(table)
                    .map(({ node }) => node)
                    .filter(each => each.role === 'row' || each.tag === 'tr')
                    .map(row => (row.children ?? []).length),
            );
        const wideTable = visits.some(
            ({ node }) => isTable(node) && columnsOf(node) >= 5 && !inPanel(node, []),
        );
        const fields = visits.filter(
            ({ node }) =>
                node.role === 'textbox' || node.role === 'combobox' || node.tag === 'input',
        ).length;
        if (inner >= 1000 && !wideTable) {
            const narrow = fields >= 3 && charts.length === 0 && stats.length === 0;
            findings.push(
                advise(where(column), 'low', {
                    rule: 'page-width',
                    found: `a column ${Math.round(inner)}px wide with no table of five or more columns`,
                    expected: narrow
                        ? 'narrow, 640: a form or settings page'
                        : 'default, 896: an overview, a detail or a document; wide (1080) only for an index of several columns',
                    why: 'Width follows density, not the screen: pick the narrowest column that holds the content (pages.md › The column).',
                    fix: { code: narrow ? 'width="narrow"' : 'width="default"' },
                }),
            );
        }
    }

    return findings;
};
