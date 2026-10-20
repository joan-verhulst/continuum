import type { ComponentProps } from 'react';
import { resolveChartColor } from '../lib/chart';
import { cn } from '../lib/cn';

export type DonutRing = {
    /** Share of the ring filled, 0 to 1. */
    value: number;
    /** Any CSS colour, or a data colour name such as 'chart-1'. */
    color?: string;
    label?: string;
};

export type DonutChartProps = ComponentProps<'div'> & {
    /** Outermost first. */
    rings: DonutRing[];
    size?: number;
    thickness?: number;
    gap?: number;
};

// Uncoloured rings share the teal series colour, stepping back in opacity inwards.
const defaultOpacity = [1, 0.8, 0.33];

/** The analytics overview's concentric donut: one ring per share, the value in the middle. */
export const DonutChart = ({
    rings,
    size = 128,
    thickness = 10,
    gap = 4,
    className,
    style,
    children,
    'aria-label': ariaLabel,
    ...props
}: DonutChartProps) => {
    const label =
        ariaLabel ??
        rings
            .map((ring, i) => `${ring.label ?? `Ring ${i + 1}`}: ${Math.round(ring.value * 100)}%`)
            .join(', ');

    return (
        <div
            aria-label={label}
            className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
            data-slot="donut-chart"
            role="img"
            style={{ width: size, height: size, ...style }}
            {...props}
        >
            <svg
                aria-hidden="true"
                className="absolute inset-0 -rotate-90"
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                width={size}
            >
                {rings.map((ring, i) => {
                    const radius = size / 2 - thickness / 2 - i * (thickness + gap);
                    if (radius <= thickness / 2) return null;
                    const circumference = 2 * Math.PI * radius;
                    const value = Math.min(1, Math.max(0, ring.value));

                    return (
                        <g key={`${ring.label ?? ''}-${i}`}>
                            <circle
                                className="stroke-neutral-950/10"
                                cx={size / 2}
                                cy={size / 2}
                                fill="none"
                                r={radius}
                                strokeWidth={thickness}
                            />
                            {value > 0 && (
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    fill="none"
                                    r={radius}
                                    strokeDasharray={`${value * circumference} ${circumference}`}
                                    strokeLinecap="round"
                                    strokeOpacity={
                                        ring.color ? 1 : (defaultOpacity[i] ?? defaultOpacity[2])
                                    }
                                    strokeWidth={thickness}
                                    style={{ stroke: resolveChartColor(ring.color ?? 'chart-5') }}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
            {children != null && (
                <div className="relative text-center font-medium text-neutral-950 text-xs tabular-nums">
                    {children}
                </div>
            )}
        </div>
    );
};
