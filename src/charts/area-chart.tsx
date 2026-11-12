'use client';

import { Cartesian, type CartesianProps, type ChartRow } from './cartesian';

export type AreaChartProps<Row extends ChartRow, X = unknown> = Omit<
    CartesianProps<Row, X>,
    'kind' | 'stacked'
>;

/**
 * A measure over time, drawn as a line over a wash of its own colour: the chart a page
 * leads with. One or two series take the fill; past that they are lines, because two
 * washes over each other read as a third colour.
 */
export const AreaChart = <Row extends ChartRow, X = unknown>(props: AreaChartProps<Row, X>) => (
    <Cartesian kind="area" {...props} />
);
