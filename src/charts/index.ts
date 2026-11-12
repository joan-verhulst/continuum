/*
 * continuum/charts: Continuum's chart kit, a separate entry from the library.
 *
 * Written for Continuum, with no dependencies of its own: React, Continuum's own helpers
 * in src/lib, and the maths in ./lib. A chart holds no colour or size of its own either,
 * only the tokens tokens.css sets (--color-chart-*, the neutral ramp, the radii, the
 * type), so a theme or a mode switch restyles every chart with it.
 *
 * A chart takes its rows and its series as props, so the scales are known in one render:
 * <AreaChart data={rows} x="date" series={[{ key: 'visitors' }]} aria-label="…" />.
 */

export { AreaChart, type AreaChartProps } from './area-chart';
export { BarChart, type BarChartProps } from './bar-chart';
export {
    Cartesian,
    type CartesianProps,
    type ChartKind,
    type ChartMarker,
    type ChartRow,
    type ChartSeries,
    useChart,
} from './cartesian';
export { ChartLegend, type ChartLegendItem, type ChartLegendProps } from './legend';
export {
    CHART_COLORS,
    type ChartColor,
    chartColor,
    intensityColor,
    intensityLevel,
    seriesColor,
    shadeColor,
    stepColor,
} from './lib/color';
export {
    formatCompact,
    formatDate,
    formatDateLong,
    formatNumber,
    formatPercent,
} from './lib/format';
export { LineChart, type LineChartProps } from './line-chart';
/** `ChartTooltipRow` is both the row component and the shape it takes. */
export { ChartTooltip, type ChartTooltipProps, ChartTooltipRow } from './tooltip';
