/*
 * continuum/charts-legacy: the chart kit Continuum is replacing.
 *
 * These components are bklit-ui's (github.com/bklit/bklit-ui, MIT), installed
 * from its shadcn registry into the Eyes product, where they drew the analytics
 * and AI charts, and copied here restyled onto Continuum's tokens
 * (--color-chart-* in tokens.css), so they flip with the mode and theme like
 * every component.
 *
 * Continuum's own kit is being written in src/charts; nothing new is built on
 * this one, and it goes as soon as the screens are moved over.
 *
 * Built on visx (Airbnb, MIT), d3-array and d3-shape (ISC), motion (MIT) and
 * @number-flow/react (MIT).
 *
 * Compose a chart from parts: a chart root sets up scales and context, and its
 * children (grid, axes, series, tooltip) read from it.
 */

export { Area, AreaChart, type AreaChartProps, type AreaProps } from './area-chart';
export { AreaChartLoading, type AreaChartLoadingProps } from './area-chart-loading';
export {
    ChartConfigProvider,
    type ChartConfigProviderProps,
    type ChartConfigValue,
    DEFAULT_CHART_CONFIG,
    type SpringConfig,
    useChartConfig,
} from './chart-config-context';
export {
    type ChartContextValue,
    chartCssVars,
    defaultScatterColors,
    type LineConfig,
    type Margin,
    type TooltipData,
    useChart,
    useChartHover,
    useChartStable,
    useYScale,
} from './chart-context';
export { ChartLegendHoverProvider, useChartLegendHover } from './chart-legend-hover';
export { ChartLoadingLabel, type ChartLoadingLabelProps } from './chart-loading-label';
export type { ChartPhase, ChartStatus, LoadingStyle } from './chart-phase';
export {
    ChartStatFlow,
    type ChartStatFlowFormat,
    type ChartStatFlowProps,
    defaultChartStatFlowFormat,
} from './chart-stat-flow';
export {
    FunnelChart,
    type FunnelChartProps,
    type FunnelGradientStop,
    type FunnelStage,
} from './funnel-chart';
export { Grid, type GridProps } from './grid';
export { HighlightSegment, type HighlightSegmentProps } from './highlight-segment';
export { PatternArea, type PatternAreaProps } from './pattern-area';
export { PieCenter, type PieCenterProps } from './pie-center';
export { DEFAULT_HOVER_OFFSET, PieChart, type PieChartProps } from './pie-chart';
export {
    defaultPieColors,
    type PieArcData,
    type PieContextValue,
    type PieData,
    pieCssVars,
    usePie,
    usePieHover,
    usePieStable,
} from './pie-context';
export { PieSlice, type PieSliceHoverEffect, type PieSliceProps } from './pie-slice';
export type { ReferenceAreaConfig } from './reference-area-config';
export { SeriesMarkers, type SeriesMarkersProps } from './series-markers';
export { ShimmeringText, type ShimmeringTextProps } from './shimmering-text';
export { StaticChartPreviewProvider, useStaticChartPreview } from './static-chart-preview-context';
export {
    ChartTooltip,
    type ChartTooltipProps,
    DateTicker,
    type DateTickerProps,
    type IndicatorWidth,
    TooltipBox,
    type TooltipBoxProps,
    TooltipContent,
    /** Alias for TooltipContent, for files that also import Continuum's own Tooltip. */
    TooltipContent as ChartTooltipContent,
    type TooltipContentProps,
    TooltipDot,
    type TooltipDotProps,
    TooltipIndicator,
    type TooltipIndicatorProps,
    type TooltipRow,
} from './tooltip';
export { selectEvenlySpacedIndices, XAxis, type XAxisProps } from './x-axis';
export { YAxis, type YAxisProps } from './y-axis';
