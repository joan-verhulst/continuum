'use client';

import { Cartesian, type CartesianProps, type ChartRow } from './cartesian';

export type LineChartProps<Row extends ChartRow, X = unknown> = Omit<
    CartesianProps<Row, X>,
    'kind' | 'stacked'
>;

/**
 * The same chart without the fill: three or more series over time, or a measure whose
 * level matters more than the amount under it, such as a rate.
 */
export const LineChart = <Row extends ChartRow, X = unknown>(props: LineChartProps<Row, X>) => (
    <Cartesian kind="line" {...props} />
);
