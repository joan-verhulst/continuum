'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useChartHover } from './chart-context';
import { useChartLegendHover } from './chart-legend-hover';

interface SeriesHoverDimProps {
    enabled?: boolean;
    dimOpacity?: number;
    legendDimOpacity?: number;
    durationSec?: number;
    seriesIndex?: number;
    children: ReactNode;
}

export function SeriesHoverDim({
    enabled = true,
    dimOpacity = 0.5,
    legendDimOpacity = 0.2,
    durationSec = 0.4,
    seriesIndex,
    children,
}: SeriesHoverDimProps) {
    const { tooltipData, selection } = useChartHover();
    const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
    const isChartHovering = tooltipData !== null || selection?.active === true;
    const isLegendDimmed =
        legendHoveredIndex !== null &&
        seriesIndex !== undefined &&
        legendHoveredIndex !== seriesIndex;
    let opacity = enabled && isChartHovering ? dimOpacity : 1;
    if (enabled && isLegendDimmed) opacity = legendDimOpacity;
    return (
        <motion.g
            animate={{ opacity }}
            initial={{ opacity: 1 }}
            transition={{ duration: durationSec, ease: 'easeInOut' }}
        >
            {children}
        </motion.g>
    );
}

SeriesHoverDim.displayName = 'SeriesHoverDim';

export default SeriesHoverDim;
