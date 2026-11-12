/** A run of periods, by index into the data: from `start`, up to but not including `end`. */
export type CandleWindow = { start: number; end: number };

/** The window moved and sized to lie inside `count` periods and hold at least `least`. */
export const clampWindow = (window: CandleWindow, count: number, least: number): CandleWindow => {
    const length = Math.max(
        Math.min(least, count),
        Math.min(count, Math.round(window.end - window.start)),
    );
    const end = Math.max(length, Math.min(count, Math.round(window.end)));
    return { start: end - length, end };
};

/**
 * The window made `factor` times narrower (wider below 1), holding the period at `anchor`
 * (0 its first, 1 its last) where it stands. Always at least one period's change, so a slow
 * pinch still moves it.
 */
export const zoomWindow = (
    view: CandleWindow,
    factor: number,
    anchor: number,
    count: number,
    least: number,
    most: number,
): CandleWindow => {
    const length = view.end - view.start;
    let next = Math.round(length / factor);
    if (next === length) next += factor > 1 ? -1 : 1;
    next = Math.max(Math.min(least, count), Math.min(most, next));
    const at = view.start + anchor * length;
    const start = Math.round(at - anchor * next);
    return clampWindow({ start, end: start + next }, count, least);
};

/** The window slid `by` periods, later when positive, stopping at either end. */
export const panWindow = (
    view: CandleWindow,
    by: number,
    count: number,
    least: number,
): CandleWindow => clampWindow({ start: view.start + by, end: view.end + by }, count, least);
