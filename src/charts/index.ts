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
export { BubbleChart, type BubbleChartProps } from './bubble-chart';
export { BulletChart, type BulletChartProps, type BulletRow } from './bullet-chart';
export {
    type Candle,
    type CandleSpan,
    CandlestickChart,
    type CandlestickChartProps,
} from './candlestick-chart';
export {
    Cartesian,
    type CartesianProps,
    type ChartKind,
    type ChartMarker,
    type ChartReading,
    type ChartRow,
    type ChartSeries,
    useChart,
} from './cartesian';
export {
    ChartCard,
    type ChartCardProps,
    ChartFrame,
    type ChartFrameProps,
    ChartKey,
    type ChartKeyProps,
    type ChartTable,
} from './chart-card';
export { DonutChart, type DonutChartProps, type DonutSlice } from './donut-chart';
export { FunnelChart, type FunnelChartProps, type FunnelStep } from './funnel-chart';
export { HorizontalBarChart, type HorizontalBarChartProps } from './horizontal-bar-chart';
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
export { RadarChart, type RadarChartProps } from './radar-chart';
export { RoseChart, type RoseChartProps } from './rose-chart';
/** `ChartTooltipRow` is both the row component and the shape it takes. */
export { ChartTooltip, type ChartTooltipProps, ChartTooltipRow } from './tooltip';
export { Treemap, type TreemapItem, type TreemapProps } from './treemap';
export {
    type UptimeDay,
    type UptimeService,
    type UptimeState,
    UptimeStrip,
    type UptimeStripProps,
} from './uptime-strip';
