'use client';

import type { ReactNode } from 'react';
import { Theme, useTheme } from '../components/theme';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor } from './lib/color';

export type ChartTooltipRow = {
    name: ReactNode;
    value: ReactNode;
    /** Left out on a total, which keys nothing. */
    color?: ChartColor;
};

export type ChartTooltipProps = {
    /** The x the rows are read at: a date, or the category. */
    title?: ReactNode;
    rows?: readonly ChartTooltipRow[];
    /** Appended under the rows, divided from them: a stacked chart's total. */
    footer?: ReactNode;
    children?: ReactNode;
    className?: string;
};

/**
 * The readout beside the point a chart is hovered at. Also exported on its own, so a
 * custom readout is written in the same surface as every other chart's.
 *
 * The value leads and the name follows, the legend's order inverted: here the reader
 * already knows which series they are on and wants the figure.
 */
export const ChartTooltip = ({ title, rows, footer, children, className }: ChartTooltipProps) => {
    const { mode } = useTheme();

    return (
        // Drawn in the mode opposite the page's, as a toast and a tooltip are: it stands off the
        // plot by its surface alone, with no shadow, and the dots take that mode's own steps.
        <Theme
            className={cn(
                'min-w-35 rounded-item border border-neutral-200 bg-neutral-50 px-2.5 py-2',
                className,
            )}
            data-slot="chart-tooltip"
            mode={mode === 'dark' ? 'light' : 'dark'}
        >
            {title != null && (
                <p className="mb-1.5 text-neutral-600 text-xxs" data-slot="chart-tooltip-title">
                    {title}
                </p>
            )}
            {rows && rows.length > 0 && (
                <ul className="flex flex-col gap-1.5" data-slot="chart-tooltip-rows">
                    {rows.map((row, index) => (
                        <ChartTooltipRow
                            // A row is its series; two series may share a name, so the place is the key.
                            key={`${index}-${String(row.name)}`}
                            {...row}
                        />
                    ))}
                </ul>
            )}
            {footer != null && (
                <div
                    className="mt-2 border-neutral-200 border-t pt-2"
                    data-slot="chart-tooltip-footer"
                >
                    {footer}
                </div>
            )}
            {children}
        </Theme>
    );
};

/** One series at the read x: its dot and name, then its value. */
export const ChartTooltipRow = ({ name, value, color }: ChartTooltipRow) => (
    <li className="flex items-center justify-between gap-4" data-slot="chart-tooltip-row">
        <span className="flex min-w-0 items-center gap-2">
            {color ? (
                <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: chartColor(color) }}
                />
            ) : (
                // A total keeps the rows' text aligned without claiming a colour of its own.
                <span aria-hidden className="size-2 shrink-0" />
            )}
            <span className="truncate text-neutral-600 text-xs">{name}</span>
        </span>
        <span className="shrink-0 font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </li>
);
