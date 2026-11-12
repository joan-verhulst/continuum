'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor } from './lib/color';

export type ChartLegendItem = {
    name: ReactNode;
    color?: ChartColor;
    /** Shown at the end of the row in the list layout; ignored inline. */
    value?: ReactNode;
};

const legendVariants = cva('flex min-w-0 text-neutral-600', {
    variants: {
        layout: {
            // Beside a chart card's title, where it names two or three series in passing.
            inline: 'flex-wrap items-center gap-x-3 gap-y-1 text-xxs',
            // Under or beside a donut or a breakdown bar, where it carries the figures too.
            list: 'flex-col gap-3 text-xs',
        },
    },
    defaultVariants: { layout: 'inline' },
});

export type ChartLegendProps = VariantProps<typeof legendVariants> & {
    items: readonly ChartLegendItem[];
    className?: string;
};

/**
 * What each colour marks. A chart of two or more series always has one: colour alone
 * never says which series is which, and the figures beside a donut belong here rather
 * than crowding the slices.
 */
export const ChartLegend = ({ items, layout, className }: ChartLegendProps) => (
    <ul className={cn(legendVariants({ layout }), className)} data-slot="chart-legend">
        {items.map((item, index) => (
            <li
                className={cn('flex min-w-0 items-center', layout === 'list' ? 'gap-2' : 'gap-1.5')}
                data-slot="chart-legend-item"
                key={`${index}-${String(item.name)}`}
            >
                <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: chartColor(item.color ?? `series-${index + 1}`) }}
                />
                <span className={cn('truncate', layout === 'list' && 'flex-1')}>{item.name}</span>
                {layout === 'list' && item.value != null && (
                    <span className="shrink-0 font-medium text-neutral-950 tabular-nums">
                        {item.value}
                    </span>
                )}
            </li>
        ))}
    </ul>
);
