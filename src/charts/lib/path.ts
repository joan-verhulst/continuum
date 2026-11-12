/*
 * The shapes a chart draws: a curve through its points, the area under it, and a
 * segment of a ring. Written out because a chart needs this much and no more.
 */

export type Point = { x: number; y: number };

/**
 * The slope to leave each point at, for a curve that never overshoots its neighbours
 * (Fritsch and Carlson's rule): where a point is a peak the curve is flat there, and
 * between two points it stays between their values. A peak stays the peak it was.
 */
const sign = (value: number) => (value < 0 ? -1 : 1);

const slopes = (points: readonly Point[]) => {
    const n = points.length;
    const runs: number[] = [];
    const deltas: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        const a = points[i] as Point;
        const b = points[i + 1] as Point;
        const run = b.x - a.x;
        runs.push(run);
        deltas.push(run === 0 ? 0 : (b.y - a.y) / run);
    }

    /*
     * The slope to leave a point at, weighted towards the gentler of its two sides. Taking the
     * plain average instead and pulling it back into range, as the first draft did, flattens
     * the curve at every turn, and a line of many readings comes out as a run of flat tops
     * joined by ramps — the corners that made it look cut rather than drawn.
     */
    const between = (before: number, after: number, runBefore: number, runAfter: number) => {
        if (before * after <= 0) return 0;
        const weighted = (before * runAfter + after * runBefore) / (runBefore + runAfter);
        return (
            (sign(before) + sign(after)) *
            Math.min(Math.abs(before), Math.abs(after), 0.5 * Math.abs(weighted))
        );
    };

    const m: number[] = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        m[i] = between(deltas[i - 1] ?? 0, deltas[i] ?? 0, runs[i - 1] ?? 1, runs[i] ?? 1);
    }
    // The ends have one side only, so they take it, held to what the first span can carry.
    const end = (delta: number, inner: number) => 1.5 * delta - 0.5 * inner;
    m[0] = n > 2 ? end(deltas[0] ?? 0, m[1] ?? 0) : (deltas[0] ?? 0);
    m[n - 1] = n > 2 ? end(deltas[n - 2] ?? 0, m[n - 2] ?? 0) : (deltas[n - 2] ?? 0);

    for (let i = 0; i < n - 1; i++) {
        const delta = deltas[i] ?? 0;
        if (delta === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
        }
        const a = (m[i] ?? 0) / delta;
        const b = (m[i + 1] ?? 0) / delta;
        const reach = a * a + b * b;
        // Past this the curve would bulge outside the two points, so both slopes are pulled in.
        if (reach > 9) {
            const scale = 3 / Math.sqrt(reach);
            m[i] = scale * a * delta;
            m[i + 1] = scale * b * delta;
        }
    }
    return m;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** The curve's cubic segments, without the opening move. */
const segments = (points: readonly Point[]) => {
    const m = slopes(points);
    let d = '';
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i] as Point;
        const b = points[i + 1] as Point;
        const third = (b.x - a.x) / 3;
        d += ` C${round(a.x + third)},${round(a.y + (m[i] ?? 0) * third)} ${round(b.x - third)},${round(b.y - (m[i + 1] ?? 0) * third)} ${round(b.x)},${round(b.y)}`;
    }
    return d;
};

/** A monotone curve through every point; nothing for fewer than two. */
export const curvePath = (points: readonly Point[]) => {
    const first = points[0];
    if (!first || points.length < 2) return '';
    return `M${round(first.x)},${round(first.y)}${segments(points)}`;
};

/**
 * Straight segments through every point. Where the points are closer together than the curve
 * is wide there is nothing for a curve to say: the eye cannot tell the two apart, and this is
 * a third of the path data and none of the slope maths.
 */
export const linePath = (points: readonly Point[]) => {
    const first = points[0];
    if (!first || points.length < 2) return '';
    return `M${round(first.x)},${round(first.y)}${points
        .slice(1)
        .map(point => ` L${round(point.x)},${round(point.y)}`)
        .join('')}`;
};

/**
 * The value held across its own period, then stepped to the next. For a measure that is only
 * true of the period it was taken over — a price in force, a plan's seats, a daily count — a
 * curve between two readings invents values that were never measured; this draws none.
 */
export const stepPath = (points: readonly Point[]) => {
    const first = points[0];
    if (!first || points.length < 2) return '';
    let d = `M${round(first.x)},${round(first.y)}`;
    for (let i = 1; i < points.length; i++) {
        const point = points[i] as Point;
        const middle = (((points[i - 1] as Point).x + point.x) / 2) | 0;
        d += ` L${middle},${round((points[i - 1] as Point).y)} L${middle},${round(point.y)} L${round(point.x)},${round(point.y)}`;
    }
    return d;
};

/** The stepped line, closed down to the baseline. */
export const stepAreaPath = (points: readonly Point[], baseline: number) => {
    const first = points[0];
    const last = points.at(-1);
    if (!first || !last || points.length < 2) return '';
    return `${stepPath(points)} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;
};

/** The same straight line, closed down to the baseline. */
export const lineAreaPath = (points: readonly Point[], baseline: number) => {
    const first = points[0];
    const last = points.at(-1);
    if (!first || !last || points.length < 2) return '';
    return `${linePath(points)} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;
};

/** The same curve, closed down to the baseline: the fill under a line. */
export const areaPath = (points: readonly Point[], baseline: number) => {
    const first = points[0];
    const last = points.at(-1);
    if (!first || !last || points.length < 2) return '';
    return `M${round(first.x)},${round(baseline)} L${round(first.x)},${round(first.y)}${segments(points)} L${round(last.x)},${round(baseline)} Z`;
};

/**
 * One shape between a high edge and a low edge: out along the highs and back along the lows.
 * It draws the spread a set of averages was taken from, so the line is read as the middle of
 * something rather than as the whole of it.
 */
export const bandPath = (high: readonly Point[], low: readonly Point[]) => {
    if (high.length < 2 || low.length !== high.length) return '';
    const back = [...low].reverse();
    return `${linePath(high)}${back.map(point => ` L${round(point.x)},${round(point.y)}`).join('')} Z`;
};

const polar = (cx: number, cy: number, radius: number, angle: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
});

/**
 * A slice of a ring, from `start` to `end` in radians clockwise from twelve o'clock, with
 * its four corners rounded. A donut's slices and a gauge's arc are both this shape.
 */
export const ringSegmentPath = (
    cx: number,
    cy: number,
    outer: number,
    inner: number,
    start: number,
    end: number,
    corner = 0,
) => {
    const sweep = end - start;
    if (sweep <= 0 || outer <= 0) return '';
    // A full ring has no ends to draw, so it is two half arcs out and two back.
    if (sweep >= Math.PI * 2 - 1e-6) {
        const top = polar(cx, cy, outer, 0);
        const bottom = polar(cx, cy, outer, Math.PI);
        const innerTop = polar(cx, cy, inner, 0);
        const innerBottom = polar(cx, cy, inner, Math.PI);
        return [
            `M${round(top.x)},${round(top.y)}`,
            `A${outer},${outer} 0 0 1 ${round(bottom.x)},${round(bottom.y)}`,
            `A${outer},${outer} 0 0 1 ${round(top.x)},${round(top.y)}`,
            `M${round(innerTop.x)},${round(innerTop.y)}`,
            `A${inner},${inner} 0 0 0 ${round(innerBottom.x)},${round(innerBottom.y)}`,
            `A${inner},${inner} 0 0 0 ${round(innerTop.x)},${round(innerTop.y)}`,
            'Z',
        ].join(' ');
    }

    // A corner can never take more than the slice has to give, on either radius.
    const band = Math.max(0, outer - inner);
    const r = Math.max(0, Math.min(corner, band / 2, (outer * sweep) / 2));
    const outerTurn = outer > r ? r / outer : 0;
    const innerTurn = inner > r ? r / inner : 0;
    const long = sweep > Math.PI ? 1 : 0;

    const a = polar(cx, cy, outer, start + outerTurn);
    const b = polar(cx, cy, outer, end - outerTurn);
    const c = polar(cx, cy, inner || 0.01, end - innerTurn);
    const d = polar(cx, cy, inner || 0.01, start + innerTurn);
    const startEdgeOuter = polar(cx, cy, outer - r, start);
    const endEdgeOuter = polar(cx, cy, outer - r, end);
    const startEdgeInner = polar(cx, cy, inner + r, start);
    const endEdgeInner = polar(cx, cy, inner + r, end);

    return [
        `M${round(startEdgeOuter.x)},${round(startEdgeOuter.y)}`,
        r > 0 ? `A${r},${r} 0 0 1 ${round(a.x)},${round(a.y)}` : '',
        `A${outer},${outer} 0 ${long} 1 ${round(b.x)},${round(b.y)}`,
        r > 0 ? `A${r},${r} 0 0 1 ${round(endEdgeOuter.x)},${round(endEdgeOuter.y)}` : '',
        `L${round(endEdgeInner.x)},${round(endEdgeInner.y)}`,
        r > 0 ? `A${r},${r} 0 0 1 ${round(c.x)},${round(c.y)}` : '',
        inner > 0 ? `A${inner},${inner} 0 ${long} 0 ${round(d.x)},${round(d.y)}` : '',
        r > 0 ? `A${r},${r} 0 0 1 ${round(startEdgeInner.x)},${round(startEdgeInner.y)}` : '',
        'Z',
    ]
        .filter(Boolean)
        .join(' ');
};
