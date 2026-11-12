'use client';

import { Cartesian, type CartesianProps, type ChartRow } from './cartesian';

export type BarChartProps<Row extends ChartRow, X = unknown> = Omit<CartesianProps<Row, X>, 'kind'>;

/**
 * A comparison across categories or whole periods: revenue by plan, sessions by month.
 * Several series stand side by side, or stack with `stacked` where they add up to
 * something the reader is meant to total. A ranked list of names is a `BarList`, not
 * this: there the labels are the point.
 */
export const BarChart = <Row extends ChartRow, X = unknown>(props: BarChartProps<Row, X>) => (
    <Cartesian kind="bar" {...props} />
);
