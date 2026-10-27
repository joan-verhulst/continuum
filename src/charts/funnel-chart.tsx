'use client';

import type { Transition } from 'motion/react';
import { motion, useTransform } from 'motion/react';
import {
    type CSSProperties,
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { useEnterComplete } from './use-enter-complete';
import { useMountProgress } from './use-mount-progress';

export interface FunnelGradientStop {
    offset: string | number;
    color: string;
}

export interface FunnelStage {
    label: string;
    value: number;
    displayValue?: string;
    color?: string;
    gradient?: FunnelGradientStop[];
}

export interface FunnelChartProps {
    data: FunnelStage[];
    orientation?: 'horizontal' | 'vertical';
    /** One colour for every stage. Default: each stage a step along the chart ramp */
    color?: string;
    layers?: number;
    className?: string;
    style?: CSSProperties;
    showPercentage?: boolean;
    showValues?: boolean;
    showLabels?: boolean;
    hoveredIndex?: number | null;
    onHoverChange?: (index: number | null) => void;
    formatPercentage?: (pct: number) => string;
    formatValue?: (value: number) => string;
    staggerDelay?: number;
    enterDelay?: number;
    enterTransition?: Transition;
    gap?: number;
    renderPattern?: (id: string, color: string) => ReactNode;
    edges?: 'curved' | 'straight';
    labelLayout?: 'spread' | 'grouped';
    labelOrientation?: 'vertical' | 'horizontal';
    labelAlign?: 'center' | 'start' | 'end';
    grid?:
        | boolean
        | {
              bands?: boolean;
              bandColor?: string;
              lines?: boolean;
              lineColor?: string;
              lineOpacity?: number;
              lineWidth?: number;
          };
}

import { intFmt } from './chart-formatters';

const fmtPct = (p: number) => `${Math.round(p)}%`;
const fmtVal = intFmt;

const uniqueKeys = (labels: string[]): string[] => {
    const used = new Set<string>();

    return labels.map(label => {
        let key = label;
        for (let n = 2; used.has(key); n++) key = `${label}-${n}`;
        used.add(key);

        return key;
    });
};

/** How far the widest stage reaches from the centre line, as a share of the cross size. */
const BODY_EXTENT = 0.44;
/*
 * Spread labels sit in a row above and below a horizontal funnel (a column either side of a vertical
 * one). The body stops short of those rows, so the first stages' outer layers never run under the
 * value and step labels.
 */
const LABEL_ROW_PX = 28;
const LABEL_COLUMN_SHARE = 0.16;

function hSegmentPath(
    normStart: number,
    normEnd: number,
    segW: number,
    H: number,
    layerScale: number,
    straight = false,
    extent = BODY_EXTENT,
) {
    const my = H / 2;
    const h0 = normStart * H * extent * layerScale;
    const h1 = normEnd * H * extent * layerScale;

    if (straight) {
        return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
    }

    const cx = segW * 0.55;
    const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
    const bot = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
    return `${top} ${bot} Z`;
}

function vSegmentPath(
    normStart: number,
    normEnd: number,
    segH: number,
    W: number,
    layerScale: number,
    straight = false,
    extent = BODY_EXTENT,
) {
    const mx = W / 2;
    const w0 = normStart * W * extent * layerScale;
    const w1 = normEnd * W * extent * layerScale;

    if (straight) {
        return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
    }

    const cy = segH * 0.55;
    const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
    const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
    return `${left} ${right} Z`;
}

function HRing({
    d,
    color,
    fill,
    opacity,
    hovered,
    ringIndex,
    totalRings,
}: {
    d: string;
    color: string;
    fill?: string;
    opacity: number;
    hovered: boolean;
    ringIndex: number;
    totalRings: number;
}) {
    const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;

    return (
        <motion.path
            animate={{ scaleY: hovered ? extraScale : 1 }}
            d={d}
            fill={fill ?? color}
            opacity={opacity}
            style={{ transformOrigin: 'center center' }}
            transition={{
                type: 'spring',
                stiffness: 300 - ringIndex * 60,
                damping: 24 - ringIndex * 3,
            }}
        />
    );
}

function HSegment({
    index,
    normStart,
    normEnd,
    segW,
    fullH,
    color,
    layers,
    staggerDelay,
    enterDelay,
    enterTransition,
    hovered,
    dimmed,
    renderPattern,
    straight,
    gradientStops,
    extent,
}: {
    index: number;
    normStart: number;
    normEnd: number;
    segW: number;
    fullH: number;
    color: string;
    layers: number;
    staggerDelay: number;
    enterDelay: number;
    enterTransition?: Transition;
    hovered: boolean;
    dimmed: boolean;
    renderPattern?: (id: string, color: string) => ReactNode;
    straight: boolean;
    gradientStops?: FunnelGradientStop[];
    extent: number;
}) {
    // Unique per chart: url(#id) resolves to the first match in the document, so two funnels on a
    // page would otherwise share the first one's gradients and patterns.
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const patternId = `funnel-h-pattern-${index}-${uid}`;
    const gradientId = `funnel-h-grad-${index}-${uid}`;
    const mountProgress = useMountProgress(
        enterTransition,
        enterDelay + index * staggerDelay,
        index,
    );
    const enterComplete = useEnterComplete(mountProgress);
    const entranceScaleX = useTransform(mountProgress, [0, 1], [0, 1]);
    const entranceScaleY = useTransform(mountProgress, [0, 1], [0, 1]);

    const rings = Array.from({ length: layers }, (_, l) => {
        const scale = 1 - (l / layers) * 0.35;
        // NOTE: a single layer is a solid body; see-through, it would mix with whatever is drawn beneath it.
        const opacity = layers === 1 ? 1 : 0.18 + (l / (layers - 1)) * 0.65;
        return {
            d: hSegmentPath(normStart, normEnd, segW, fullH, scale, straight, extent),
            opacity,
        };
    });

    return (
        <motion.div
            animate={{ opacity: dimmed ? 0.4 : 1 }}
            className="pointer-events-none relative shrink-0 overflow-visible"
            style={{
                width: segW,
                height: fullH,
                zIndex: hovered ? 10 : 1,
            }}
            transition={{ opacity: { duration: 0.15 } }}
        >
            {enterComplete ? (
                <div className="absolute inset-0 overflow-visible">
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                        role="presentation"
                        viewBox={`0 0 ${segW} ${fullH}`}
                    >
                        <defs>
                            {gradientStops && (
                                <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                                    {gradientStops.map(stop => (
                                        <stop
                                            key={`${stop.offset}-${stop.color}`}
                                            offset={
                                                typeof stop.offset === 'number'
                                                    ? `${stop.offset * 100}%`
                                                    : stop.offset
                                            }
                                            stopColor={stop.color}
                                        />
                                    ))}
                                </linearGradient>
                            )}
                            {renderPattern?.(patternId, color)}
                        </defs>
                        {rings.map((r, i) => {
                            const isInnermost = i === rings.length - 1;
                            let ringFill: string | undefined;
                            if (isInnermost && renderPattern) {
                                ringFill = `url(#${patternId})`;
                            } else if (isInnermost && gradientStops) {
                                ringFill = `url(#${gradientId})`;
                            }
                            const ringKey = `h-ring-${r.opacity.toFixed(2)}`;
                            return (
                                <HRing
                                    color={color}
                                    d={r.d}
                                    fill={ringFill}
                                    hovered={hovered}
                                    key={ringKey}
                                    opacity={r.opacity}
                                    ringIndex={i}
                                    totalRings={layers}
                                />
                            );
                        })}
                    </svg>
                </div>
            ) : (
                <motion.div
                    className="absolute inset-0 overflow-visible"
                    style={{
                        scaleX: entranceScaleX,
                        scaleY: entranceScaleY,
                        transformOrigin: 'left center',
                    }}
                >
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                        role="presentation"
                        viewBox={`0 0 ${segW} ${fullH}`}
                    >
                        <defs>
                            {gradientStops && (
                                <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                                    {gradientStops.map(stop => (
                                        <stop
                                            key={`${stop.offset}-${stop.color}`}
                                            offset={
                                                typeof stop.offset === 'number'
                                                    ? `${stop.offset * 100}%`
                                                    : stop.offset
                                            }
                                            stopColor={stop.color}
                                        />
                                    ))}
                                </linearGradient>
                            )}
                            {renderPattern?.(patternId, color)}
                        </defs>
                        {rings.map((r, i) => {
                            const isInnermost = i === rings.length - 1;
                            let ringFill: string | undefined;
                            if (isInnermost && renderPattern) {
                                ringFill = `url(#${patternId})`;
                            } else if (isInnermost && gradientStops) {
                                ringFill = `url(#${gradientId})`;
                            }
                            const ringKey = `h-ring-${r.opacity.toFixed(2)}`;
                            return (
                                <HRing
                                    color={color}
                                    d={r.d}
                                    fill={ringFill}
                                    hovered={hovered}
                                    key={ringKey}
                                    opacity={r.opacity}
                                    ringIndex={i}
                                    totalRings={layers}
                                />
                            );
                        })}
                    </svg>
                </motion.div>
            )}
        </motion.div>
    );
}

function VRing({
    d,
    color,
    fill,
    opacity,
    hovered,
    ringIndex,
    totalRings,
}: {
    d: string;
    color: string;
    fill?: string;
    opacity: number;
    hovered: boolean;
    ringIndex: number;
    totalRings: number;
}) {
    const extraScale = 1 + (ringIndex / Math.max(totalRings - 1, 1)) * 0.12;

    return (
        <motion.path
            animate={{ scaleX: hovered ? extraScale : 1 }}
            d={d}
            fill={fill ?? color}
            opacity={opacity}
            style={{ transformOrigin: 'center center' }}
            transition={{
                type: 'spring',
                stiffness: 300 - ringIndex * 60,
                damping: 24 - ringIndex * 3,
            }}
        />
    );
}

function VSegment({
    index,
    normStart,
    normEnd,
    segH,
    fullW,
    color,
    layers,
    staggerDelay,
    enterDelay,
    enterTransition,
    hovered,
    dimmed,
    renderPattern,
    straight,
    gradientStops,
    extent,
}: {
    index: number;
    normStart: number;
    normEnd: number;
    segH: number;
    fullW: number;
    color: string;
    layers: number;
    staggerDelay: number;
    enterDelay: number;
    enterTransition?: Transition;
    hovered: boolean;
    dimmed: boolean;
    renderPattern?: (id: string, color: string) => ReactNode;
    straight: boolean;
    gradientStops?: FunnelGradientStop[];
    extent: number;
}) {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const patternId = `funnel-v-pattern-${index}-${uid}`;
    const gradientId = `funnel-v-grad-${index}-${uid}`;
    const mountProgress = useMountProgress(
        enterTransition,
        enterDelay + index * staggerDelay,
        index,
    );
    const enterComplete = useEnterComplete(mountProgress);
    const entranceScaleY = useTransform(mountProgress, [0, 1], [0, 1]);
    const entranceScaleX = useTransform(mountProgress, [0, 1], [0, 1]);

    const rings = Array.from({ length: layers }, (_, l) => {
        const scale = 1 - (l / layers) * 0.35;
        // NOTE: a single layer is a solid body; see-through, it would mix with whatever is drawn beneath it.
        const opacity = layers === 1 ? 1 : 0.18 + (l / (layers - 1)) * 0.65;
        return {
            d: vSegmentPath(normStart, normEnd, segH, fullW, scale, straight, extent),
            opacity,
        };
    });

    return (
        <motion.div
            animate={{ opacity: dimmed ? 0.4 : 1 }}
            className="pointer-events-none relative shrink-0 overflow-visible"
            style={{
                width: fullW,
                height: segH,
                zIndex: hovered ? 10 : 1,
            }}
            transition={{ opacity: { duration: 0.15 } }}
        >
            {enterComplete ? (
                <div className="absolute inset-0 overflow-visible">
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                        role="presentation"
                        viewBox={`0 0 ${fullW} ${segH}`}
                    >
                        <defs>
                            {gradientStops && (
                                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                    {gradientStops.map(stop => (
                                        <stop
                                            key={`${stop.offset}-${stop.color}`}
                                            offset={
                                                typeof stop.offset === 'number'
                                                    ? `${stop.offset * 100}%`
                                                    : stop.offset
                                            }
                                            stopColor={stop.color}
                                        />
                                    ))}
                                </linearGradient>
                            )}
                            {renderPattern?.(patternId, color)}
                        </defs>
                        {rings.map((r, i) => {
                            const isInnermost = i === rings.length - 1;
                            let ringFill: string | undefined;
                            if (isInnermost && renderPattern) {
                                ringFill = `url(#${patternId})`;
                            } else if (isInnermost && gradientStops) {
                                ringFill = `url(#${gradientId})`;
                            }
                            const ringKey = `v-ring-${r.opacity.toFixed(2)}`;
                            return (
                                <VRing
                                    color={color}
                                    d={r.d}
                                    fill={ringFill}
                                    hovered={hovered}
                                    key={ringKey}
                                    opacity={r.opacity}
                                    ringIndex={i}
                                    totalRings={layers}
                                />
                            );
                        })}
                    </svg>
                </div>
            ) : (
                <motion.div
                    className="absolute inset-0 overflow-visible"
                    style={{
                        scaleY: entranceScaleY,
                        scaleX: entranceScaleX,
                        transformOrigin: 'center top',
                    }}
                >
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        preserveAspectRatio="none"
                        role="presentation"
                        viewBox={`0 0 ${fullW} ${segH}`}
                    >
                        <defs>
                            {gradientStops && (
                                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                    {gradientStops.map(stop => (
                                        <stop
                                            key={`${stop.offset}-${stop.color}`}
                                            offset={
                                                typeof stop.offset === 'number'
                                                    ? `${stop.offset * 100}%`
                                                    : stop.offset
                                            }
                                            stopColor={stop.color}
                                        />
                                    ))}
                                </linearGradient>
                            )}
                            {renderPattern?.(patternId, color)}
                        </defs>
                        {rings.map((r, i) => {
                            const isInnermost = i === rings.length - 1;
                            let ringFill: string | undefined;
                            if (isInnermost && renderPattern) {
                                ringFill = `url(#${patternId})`;
                            } else if (isInnermost && gradientStops) {
                                ringFill = `url(#${gradientId})`;
                            }
                            const ringKey = `v-ring-${r.opacity.toFixed(2)}`;
                            return (
                                <VRing
                                    color={color}
                                    d={r.d}
                                    fill={ringFill}
                                    hovered={hovered}
                                    key={ringKey}
                                    opacity={r.opacity}
                                    ringIndex={i}
                                    totalRings={layers}
                                />
                            );
                        })}
                    </svg>
                </motion.div>
            )}
        </motion.div>
    );
}

function SegmentLabel({
    stage,
    pct,
    isHorizontal,
    showValues,
    showPercentage,
    showLabels,
    formatPercentage,
    formatValue,
    index,
    staggerDelay,
    enterDelay,
    layout = 'spread',
    orientation,
    align = 'center',
}: {
    stage: FunnelStage;
    pct: number;
    isHorizontal: boolean;
    showValues: boolean;
    showPercentage: boolean;
    showLabels: boolean;
    formatPercentage: (p: number) => string;
    formatValue: (v: number) => string;
    index: number;
    staggerDelay: number;
    enterDelay: number;
    layout?: 'spread' | 'grouped';
    orientation?: 'vertical' | 'horizontal';
    align?: 'center' | 'start' | 'end';
}) {
    const display = stage.displayValue ?? formatValue(stage.value);

    const valueEl = showValues && (
        <span className="whitespace-nowrap font-medium text-neutral-950 text-xs tabular-nums">
            {display}
        </span>
    );
    const pctEl = showPercentage && (
        <span className="rounded-pill bg-neutral-50/85 px-2 py-1 font-medium text-neutral-950 text-xxs tabular-nums backdrop-blur-sm">
            {formatPercentage(pct)}
        </span>
    );
    const labelEl = showLabels && (
        <span className="whitespace-nowrap font-normal text-neutral-600 text-xs">
            {stage.label}
        </span>
    );

    if (layout === 'spread') {
        return (
            <motion.div
                animate={{ opacity: 1 }}
                className={cn(
                    'absolute inset-0 flex',
                    isHorizontal ? 'flex-col items-center' : 'flex-row items-center',
                )}
                initial={{ opacity: 0 }}
                transition={{
                    delay: enterDelay + index * staggerDelay + 0.25,
                    duration: 0.35,
                    ease: 'easeOut',
                }}
            >
                {isHorizontal ? (
                    <>
                        <div
                            className="flex items-end justify-center pb-1"
                            style={{ height: LABEL_ROW_PX }}
                        >
                            {valueEl}
                        </div>
                        <div className="flex flex-1 items-center justify-center">{pctEl}</div>
                        <div
                            className="flex items-start justify-center pt-1"
                            style={{ height: LABEL_ROW_PX }}
                        >
                            {labelEl}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex w-[16%] items-center justify-end pr-2">{valueEl}</div>
                        <div className="flex flex-1 items-center justify-center">{pctEl}</div>
                        <div className="flex w-[16%] items-center justify-start pl-2">
                            {labelEl}
                        </div>
                    </>
                )}
            </motion.div>
        );
    }

    const resolvedOrientation = orientation ?? (isHorizontal ? 'vertical' : 'horizontal');
    const isVerticalStack = resolvedOrientation === 'vertical';

    const justifyMap = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
    } as const;
    const itemsMap = {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
    } as const;

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className={cn(
                'absolute inset-0 flex',
                isHorizontal
                    ? cn('flex-col items-center', justifyMap[align])
                    : cn('flex-row items-center', justifyMap[align]),
            )}
            initial={{ opacity: 0 }}
            style={{
                padding: isHorizontal ? '8% 0' : '0 8%',
            }}
            transition={{
                delay: enterDelay + index * staggerDelay + 0.25,
                duration: 0.35,
                ease: 'easeOut',
            }}
        >
            <div
                className={cn(
                    'flex gap-1.5',
                    isVerticalStack
                        ? cn('flex-col', itemsMap[isHorizontal ? 'center' : align])
                        : cn('flex-row', itemsMap.center),
                )}
            >
                {valueEl}
                {pctEl}
                {labelEl}
            </div>
        </motion.div>
    );
}

// Steps walk the theme's ramp: forest to lime to mustard to orange in Eyes, the brand colour lighter elsewhere
const STEP_ANCHORS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
];

function stepColor(index: number, total: number): string {
    const last = STEP_ANCHORS.length - 1;
    if (total <= 1) return STEP_ANCHORS[0] ?? '';
    if (total === 2) return (index === 0 ? STEP_ANCHORS[0] : STEP_ANCHORS[last]) ?? '';
    if (total === 3) return STEP_ANCHORS[[0, 1, last][index] ?? last] ?? '';

    const position = (Math.min(index, total - 1) / (total - 1)) * last;
    const from = Math.min(Math.floor(position), last - 1);
    const share = Math.round((position - from) * 100);
    if (share === 0) return STEP_ANCHORS[from] ?? '';
    if (share === 100) return STEP_ANCHORS[from + 1] ?? '';

    return `color-mix(in oklch, ${STEP_ANCHORS[from]}, ${STEP_ANCHORS[from + 1]} ${share}%)`;
}

export function FunnelChart({
    data,
    orientation = 'horizontal',
    color,
    layers = 3,
    className,
    style,
    showPercentage = true,
    showValues = true,
    showLabels = true,
    hoveredIndex: hoveredIndexProp,
    onHoverChange,
    formatPercentage = fmtPct,
    formatValue = fmtVal,
    staggerDelay = 0.12,
    enterDelay = 0,
    enterTransition,
    gap = 4,
    renderPattern,
    edges = 'curved',
    labelLayout = 'spread',
    labelOrientation,
    labelAlign = 'center',
    grid: gridProp = false,
}: FunnelChartProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [sz, setSz] = useState({ w: 0, h: 0 });
    const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);

    const isControlled = hoveredIndexProp !== undefined;
    const hoveredIndex = isControlled ? hoveredIndexProp : internalHoveredIndex;
    const stageKeys = uniqueKeys(data.map(stage => stage.label));
    const setHoveredIndex = useCallback(
        (index: number | null) => {
            if (isControlled) {
                onHoverChange?.(index);
                return;
            }
            setInternalHoveredIndex(index);
        },
        [isControlled, onHoverChange],
    );

    const measure = useCallback(() => {
        if (!ref.current) {
            return;
        }
        const { width: w, height: h } = ref.current.getBoundingClientRect();
        if (w > 0 && h > 0) {
            setSz({ w, h });
        }
    }, []);

    useEffect(() => {
        measure();
        const ro = new ResizeObserver(measure);
        if (ref.current) {
            ro.observe(ref.current);
        }
        return () => ro.disconnect();
    }, [measure]);

    if (!data.length) {
        return null;
    }

    const first = data[0];
    if (!first) {
        return null;
    }
    const max = first.value;
    const n = data.length;
    const norms = data.map(d => d.value / max);
    const horiz = orientation === 'horizontal';
    const { w: W, h: H } = sz;

    const reserveLabels = labelLayout === 'spread' && (showValues || showLabels);
    const extent = !reserveLabels
        ? BODY_EXTENT
        : horiz
          ? Math.max(0.2, Math.min(BODY_EXTENT, 0.5 - LABEL_ROW_PX / H))
          : Math.min(BODY_EXTENT, 0.5 - LABEL_COLUMN_SHARE);

    const totalGap = gap * (n - 1);
    const segW = (W - (horiz ? totalGap : 0)) / n;
    const segH = (H - (horiz ? 0 : totalGap)) / n;

    const gridEnabled = gridProp !== false;
    const gridCfg = typeof gridProp === 'object' ? gridProp : {};
    const showBands = gridEnabled && (gridCfg.bands ?? true);
    const bandColor = gridCfg.bandColor ?? 'var(--color-chart-band)';
    const showGridLines = gridEnabled && (gridCfg.lines ?? true);
    const gridLineColor = gridCfg.lineColor ?? 'var(--color-chart-grid)';
    const gridLineOpacity = gridCfg.lineOpacity ?? 1;
    const gridLineWidth = gridCfg.lineWidth ?? 1;

    return (
        <div
            className={cn('relative w-full select-none overflow-visible', className)}
            data-slot="funnel-chart"
            ref={ref}
            style={{
                aspectRatio: horiz ? '2.2 / 1' : '1 / 1.8',
                ...style,
            }}
        >
            {W > 0 && H > 0 && (
                <>
                    {gridEnabled && (
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            preserveAspectRatio="none"
                            role="presentation"
                            viewBox={`0 0 ${W} ${H}`}
                        >
                            {showBands &&
                                stageKeys.map((stageKey, i) => {
                                    if (i % 2 !== 0) {
                                        return null;
                                    }
                                    if (horiz) {
                                        const x = (segW + gap) * i;
                                        return (
                                            <rect
                                                fill={bandColor}
                                                height={H}
                                                key={`band-${stageKey}`}
                                                width={segW}
                                                x={x}
                                                y={0}
                                            />
                                        );
                                    }
                                    const y = (segH + gap) * i;
                                    return (
                                        <rect
                                            fill={bandColor}
                                            height={segH}
                                            key={`band-${stageKey}`}
                                            width={W}
                                            x={0}
                                            y={y}
                                        />
                                    );
                                })}
                        </svg>
                    )}

                    <div
                        className={cn(
                            'absolute inset-0 flex overflow-visible',
                            horiz ? 'flex-row' : 'flex-col',
                        )}
                        style={{ gap }}
                    >
                        {data.map((stage, i) => {
                            const normStart = norms[i] ?? 0;
                            const normEnd = norms[Math.min(i + 1, n - 1)] ?? 0;
                            const firstStop = stage.gradient?.[0];
                            const segColor = firstStop
                                ? firstStop.color
                                : (stage.color ?? color ?? stepColor(i, n));

                            return horiz ? (
                                <HSegment
                                    color={segColor}
                                    dimmed={hoveredIndex !== null && hoveredIndex !== i}
                                    enterDelay={enterDelay}
                                    enterTransition={enterTransition}
                                    extent={extent}
                                    fullH={H}
                                    gradientStops={stage.gradient}
                                    hovered={hoveredIndex === i}
                                    index={i}
                                    key={stageKeys[i]}
                                    layers={layers}
                                    normEnd={normEnd}
                                    normStart={normStart}
                                    renderPattern={renderPattern}
                                    segW={segW}
                                    staggerDelay={staggerDelay}
                                    straight={edges === 'straight'}
                                />
                            ) : (
                                <VSegment
                                    color={segColor}
                                    dimmed={hoveredIndex !== null && hoveredIndex !== i}
                                    enterDelay={enterDelay}
                                    enterTransition={enterTransition}
                                    extent={extent}
                                    fullW={W}
                                    gradientStops={stage.gradient}
                                    hovered={hoveredIndex === i}
                                    index={i}
                                    key={stageKeys[i]}
                                    layers={layers}
                                    normEnd={normEnd}
                                    normStart={normStart}
                                    renderPattern={renderPattern}
                                    segH={segH}
                                    staggerDelay={staggerDelay}
                                    straight={edges === 'straight'}
                                />
                            );
                        })}
                    </div>

                    {gridEnabled && showGridLines && (
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            preserveAspectRatio="none"
                            role="presentation"
                            viewBox={`0 0 ${W} ${H}`}
                        >
                            {Array.from({ length: n - 1 }, (_, i) => {
                                const idx = i + 1;
                                const gridKey = `grid-${idx}`;
                                if (horiz) {
                                    const x = segW * idx + gap * i + gap / 2;
                                    return (
                                        <line
                                            key={gridKey}
                                            stroke={gridLineColor}
                                            strokeOpacity={gridLineOpacity}
                                            strokeWidth={gridLineWidth}
                                            x1={x}
                                            x2={x}
                                            y1={0}
                                            y2={H}
                                        />
                                    );
                                }
                                const y = segH * idx + gap * i + gap / 2;
                                return (
                                    <line
                                        key={gridKey}
                                        stroke={gridLineColor}
                                        strokeOpacity={gridLineOpacity}
                                        strokeWidth={gridLineWidth}
                                        x1={0}
                                        x2={W}
                                        y1={y}
                                        y2={y}
                                    />
                                );
                            })}
                        </svg>
                    )}

                    {data.map((stage, i) => {
                        const pct = (stage.value / max) * 100;
                        const posStyle: CSSProperties = horiz
                            ? {
                                  left: (segW + gap) * i,
                                  width: segW,
                                  top: 0,
                                  height: H,
                              }
                            : {
                                  top: (segH + gap) * i,
                                  height: segH,
                                  left: 0,
                                  width: W,
                              };

                        const isDimmed = hoveredIndex !== null && hoveredIndex !== i;

                        return (
                            <motion.div
                                animate={{ opacity: isDimmed ? 0.4 : 1 }}
                                className="absolute cursor-pointer"
                                key={`lbl-${stageKeys[i]}`}
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ ...posStyle, zIndex: 20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            >
                                <SegmentLabel
                                    align={labelAlign}
                                    enterDelay={enterDelay}
                                    formatPercentage={formatPercentage}
                                    formatValue={formatValue}
                                    index={i}
                                    isHorizontal={horiz}
                                    layout={labelLayout}
                                    orientation={labelOrientation}
                                    pct={pct}
                                    showLabels={showLabels}
                                    showPercentage={showPercentage}
                                    showValues={showValues}
                                    stage={stage}
                                    staggerDelay={staggerDelay}
                                />
                            </motion.div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
