/**
 * A raster after Müller-Brockmann, made dynamic after Gerstner.
 *
 * The text line is the unit: gutters, margins and gaps are whole lines, and
 * every baseline sits on a 4px grid. The column count is not fixed but taken
 * from the space available, from a set where each count divides the next, so
 * a layout recombines instead of breaking when the space changes.
 */

export type RasterParams = {
    /** Line height of the 13px body text, and the unit for everything else. */
    line: number;
    /** Narrowest a column may get before the raster drops to fewer columns. */
    minColumn: number;
};

export type Raster = RasterParams & {
    width: number;
    columns: ColumnCount;
    column: number;
    gutter: number;
    margin: number;
    /** The baseline grid every baseline sits on. */
    quantum: number;
};

/** Each count divides the next, so spans keep their proportions across counts. */
export const columnCounts = [24, 12, 8, 4] as const;

export type ColumnCount = (typeof columnCounts)[number];

export const QUANTUM = 4;

// Cap height of 13px Geist and Inter.
const BODY_CAP = 13 * 0.7;

/** The cap height rounded up to the grid: the height of one trimmed line of body text. */
export const BODY_CAP_ON_GRID = Math.ceil(BODY_CAP / QUANTUM) * QUANTUM;

/**
 * Where one line of body text puts its baseline in a row of this height: the
 * cap centred in the row, then the baseline dropped onto the nearest grid line.
 */
export const baselineIn = (height: number) =>
    Math.round((height + BODY_CAP) / 2 / QUANTUM) * QUANTUM;

export const computeRaster = (width: number, params: RasterParams): Raster => {
    const gutter = params.line;
    const margin = params.line;
    const inner = width - margin * 2;
    const columns =
        columnCounts.find(count => count * params.minColumn + (count - 1) * gutter <= inner) ?? 4;
    const column = (inner - (columns - 1) * gutter) / columns;

    return { ...params, width, columns, column, gutter, margin, quantum: QUANTUM };
};

/** A run of columns: where it starts (1-based) and how many it spans. */
export type Span = [start: number, span: number];

export type Areas = {
    /** The navigation column; absent when there is no room for it. */
    nav?: Span;
    /** The column labels hang in; absent when they stack above their content. */
    head?: Span;
    main: Span;
};

/**
 * The page in three columns of columns: navigation, hanging labels, content.
 * Each gives way in turn as the raster loses columns.
 */
export const areasFor = (columns: ColumnCount): Areas => {
    if (columns >= 12) {
        const sixth = columns / 6;
        return {
            nav: [1, sixth],
            head: [1 + sixth, sixth],
            main: [1 + sixth * 2, columns - sixth * 2],
        };
    }

    if (columns === 8) {
        return { nav: [1, 2], main: [3, 6] };
    }

    return { main: [1, columns] };
};

export const gridColumn = ([start, span]: Span) => `${start} / span ${span}`;

/** How the sequence table divides the content columns, per content width. */
export const tableSpans = (main: number): Record<TableColumn, number> => {
    switch (main) {
        case 16:
            return { delay: 2, name: 6, template: 4, click: 2, open: 2 };
        case 8:
            return { delay: 1, name: 3, template: 2, click: 1, open: 1 };
        case 6:
            return { delay: 1, name: 2, template: 1, click: 1, open: 1 };
        default:
            return { delay: 1, name: 2, template: 0, click: 0, open: 1 };
    }
};

export type TableColumn = 'delay' | 'name' | 'template' | 'click' | 'open';
