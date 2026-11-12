'use client';

import type { ReactNode } from 'react';
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
    /**
     * Which side the rule it speaks from is on. That bottom corner is left square, so the
     * readout reads as a bubble said from the rule. Only where there is a rule to speak from:
     * beside a bar, or on its own, all four corners are round.
     */
    tail?: 'left' | 'right' | 'none';
    className?: string;
};

/**
 * The readout beside the point a chart is hovered at. Also exported on its own, so a
 * custom readout is written in the same surface as every other chart's.
 *
 * Beside a line's rule it is a bubble: three round corners and one square, the bottom one
 * on the rule's side. Each series is keyed by a short upright stroke of its colour.
 * The value leads and the name follows, the legend's order inverted: here the reader
 * already knows which series they are on and wants the figure.
 */
export const ChartTooltip = ({
    title,
    rows,
    footer,
    children,
    tail = 'none',
    className,
}: ChartTooltipProps) => (
    <div
        className={cn(
            'min-w-35 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 shadow-float',
            tail === 'left' && 'rounded-bl-none',
            tail === 'right' && 'rounded-br-none',
            className,
        )}
        data-slot="chart-tooltip"
    >
        <div className="p-3">
            {title != null && (
                <p
                    className="mb-2 font-medium text-neutral-950 text-xs"
                    data-slot="chart-tooltip-title"
                >
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
            {children}
        </div>
        {footer != null && (
            // The rule runs edge to edge: a divider that stops short of the sides is a box in a box.
            <div className="border-neutral-200 border-t px-3 py-2" data-slot="chart-tooltip-footer">
                {footer}
            </div>
        )}
    </div>
);

/** One series at the read x: its dot and name, then its value. */
export const ChartTooltipRow = ({ name, value, color }: ChartTooltipRow) => (
    <li className="flex items-center justify-between gap-4" data-slot="chart-tooltip-row">
        <span className="flex min-w-0 items-center gap-2">
            {color ? (
                <span
                    aria-hidden
                    className="h-3 w-0.75 shrink-0 rounded-full"
                    style={{ background: chartColor(color) }}
                />
            ) : (
                // A total keeps the rows' text aligned without claiming a colour of its own.
                <span aria-hidden className="h-3 w-0.75 shrink-0" />
            )}
            <span className="truncate text-neutral-600 text-xs">{name}</span>
        </span>
        <span className="shrink-0 font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </li>
);
