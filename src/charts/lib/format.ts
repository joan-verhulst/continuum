/*
 * How a chart writes a number or a date when it is not told how. Every formatter is
 * fixed to en-GB: the runtime's own locale would let a server write "1,234" and the
 * browser hydrate "1.234".
 */

const compact = new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const full = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Axis labels: short enough to sit in a gutter. 1,250 is 1.3K, 0.5 stays 0.5. */
export const formatCompact = (value: number) =>
    Math.abs(value) >= 1000 ? compact.format(value) : full.format(value);

/** A tooltip has room for the figure itself, so it reads 5,100 rather than 5.1K. */
export const formatNumber = (value: number) => full.format(value);

export const formatPercent = (share: number, digits = 0) =>
    `${full.format(Number((share * 100).toFixed(digits)))}%`;

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
});

/** An x label under a plot: "19 Oct". */
export const formatDate = (date: Date) => shortDate.format(date);

/** A tooltip's title, where the weekday is worth the room: "Mon 19 Oct". */
export const formatDateLong = (date: Date) => longDate.format(date).replace(',', '');

/** Whatever a row holds in its x field, as something to print. */
export const formatX = (value: unknown, long = false): string => {
    if (value instanceof Date) return long ? formatDateLong(value) : formatDate(value);
    if (typeof value === 'number') return formatNumber(value);
    return String(value ?? '');
};
