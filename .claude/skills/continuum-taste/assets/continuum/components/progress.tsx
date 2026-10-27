'use client';

import { Meter as MeterPrimitive } from '@base-ui/react/meter';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactNode, useId } from 'react';
import { cn, type WithClassName } from '../lib/cn';

/*
 * Both bars draw a track in the hairline colour, the step the slider's track uses, so a bar
 * sits in a card the way a divider would. The track rounds fully at 4 and 8px in every theme.
 */
export const progressTrackVariants = cva(
    'relative w-full overflow-hidden rounded-full bg-neutral-200',
    {
        variants: {
            size: {
                sm: 'h-1',
                md: 'h-2',
            },
        },
        defaultVariants: { size: 'sm' },
    },
);

export const progressIndicatorVariants = cva(
    [
        // Base UI sets the width inline; only that width animates, and never for reduced motion.
        'h-full rounded-full transition-[width] duration-200 ease-out-strong motion-reduce:transition-none',
        // An indeterminate task has no width to show, so the whole track fills faintly and holds still.
        'data-indeterminate:w-full data-indeterminate:opacity-30',
    ],
    {
        variants: {
            tone: {
                action: 'bg-action [background-image:var(--action-gradient)]',
                success: 'bg-success-500',
                warning: 'bg-warning-500',
                error: 'bg-error-500',
                chart: 'bg-chart-1',
            },
        },
        defaultVariants: { tone: 'action' },
    },
);

type BarVariants = VariantProps<typeof progressTrackVariants> &
    VariantProps<typeof progressIndicatorVariants>;

type BarOwnProps = BarVariants & {
    /** Names the bar for screen readers too; without it, pass `aria-label`. */
    label?: ReactNode;
    /** Trailing text on the label row, e.g. "Resets in 10 days"; read as the bar's description. */
    caption?: ReactNode;
    /** Shows the formatted value on the label row when there is no caption. */
    showValue?: boolean;
};

const rootClassName = 'flex w-full min-w-0 flex-col gap-2';
const labelClassName = 'min-w-0 truncate font-medium text-neutral-900 text-xs';
// Without a label the trailing text still sits at the end of the row.
const valueClassName = 'ms-auto shrink-0 font-normal text-neutral-600 text-xs tabular-nums';
const captionClassName = 'ms-auto shrink-0 font-normal text-neutral-500 text-xs';

/** The label left and the value or caption right, sharing a baseline. */
const LabelRow = ({ slot, children }: { slot: string; children: ReactNode }) => (
    <div className="flex min-w-0 items-baseline justify-between gap-3" data-slot={slot}>
        {children}
    </div>
);

/** The caption describes rather than names, so it is linked by id instead of through the label. */
const useCaption = (caption: ReactNode, describedBy: string | undefined) => {
    const id = useId();
    const has = caption != null && caption !== false && caption !== '';
    return {
        has,
        id: `${id}-caption`,
        describedBy:
            [describedBy, has ? `${id}-caption` : undefined].filter(Boolean).join(' ') || undefined,
    };
};

export type ProgressProps = Omit<WithClassName<ProgressPrimitive.Root.Props>, 'children'> &
    BarOwnProps;

/**
 * Task progress on Base UI Progress: a 4 or 8px bar with an optional label row. `value={null}`
 * makes it indeterminate, which fills the track faintly rather than animating.
 */
export const Progress = ({
    label,
    caption,
    showValue = false,
    size,
    tone,
    className,
    'aria-describedby': ariaDescribedBy,
    ...props
}: ProgressProps) => {
    const captionLink = useCaption(caption, ariaDescribedBy);
    const hasHeader = label != null || captionLink.has || showValue;

    return (
        <ProgressPrimitive.Root
            aria-describedby={captionLink.describedBy}
            className={cn(rootClassName, className)}
            data-size={size ?? 'sm'}
            data-slot="progress"
            data-tone={tone ?? 'action'}
            {...props}
        >
            {hasHeader && (
                <LabelRow slot="progress-header">
                    {label != null ? (
                        <ProgressPrimitive.Label
                            className={labelClassName}
                            data-slot="progress-label"
                        >
                            {label}
                        </ProgressPrimitive.Label>
                    ) : null}
                    {captionLink.has ? (
                        <span
                            className={captionClassName}
                            data-slot="progress-caption"
                            id={captionLink.id}
                        >
                            {caption}
                        </span>
                    ) : (
                        showValue && (
                            // aria-valuetext already speaks the value, so the visible copy stays out of the way.
                            <ProgressPrimitive.Value
                                aria-hidden
                                className={valueClassName}
                                data-slot="progress-value"
                            />
                        )
                    )}
                </LabelRow>
            )}
            <ProgressPrimitive.Track
                className={progressTrackVariants({ size })}
                data-slot="progress-track"
            >
                <ProgressPrimitive.Indicator
                    className={progressIndicatorVariants({ tone })}
                    data-slot="progress-indicator"
                />
            </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>
    );
};

export type MeterProps = Omit<WithClassName<MeterPrimitive.Root.Props>, 'children'> & BarOwnProps;

/**
 * A value within a known range on Base UI Meter, such as credits used of a plan's total:
 * the same bar as Progress, always determinate. Base UI clamps the fill to the range.
 */
export const Meter = ({
    label,
    caption,
    showValue = false,
    size,
    tone,
    className,
    'aria-describedby': ariaDescribedBy,
    ...props
}: MeterProps) => {
    const captionLink = useCaption(caption, ariaDescribedBy);
    const hasHeader = label != null || captionLink.has || showValue;

    return (
        <MeterPrimitive.Root
            aria-describedby={captionLink.describedBy}
            className={cn(rootClassName, className)}
            data-size={size ?? 'sm'}
            data-slot="meter"
            data-tone={tone ?? 'action'}
            {...props}
        >
            {hasHeader && (
                <LabelRow slot="meter-header">
                    {label != null ? (
                        <MeterPrimitive.Label className={labelClassName} data-slot="meter-label">
                            {label}
                        </MeterPrimitive.Label>
                    ) : null}
                    {captionLink.has ? (
                        <span
                            className={captionClassName}
                            data-slot="meter-caption"
                            id={captionLink.id}
                        >
                            {caption}
                        </span>
                    ) : (
                        showValue && (
                            <MeterPrimitive.Value
                                aria-hidden
                                className={valueClassName}
                                data-slot="meter-value"
                            />
                        )
                    )}
                </LabelRow>
            )}
            <MeterPrimitive.Track
                className={progressTrackVariants({ size })}
                data-slot="meter-track"
            >
                <MeterPrimitive.Indicator
                    className={progressIndicatorVariants({ tone })}
                    data-slot="meter-indicator"
                />
            </MeterPrimitive.Track>
        </MeterPrimitive.Root>
    );
};
