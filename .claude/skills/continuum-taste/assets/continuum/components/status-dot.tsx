import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export const statusDotVariants = cva('relative inline-flex shrink-0 rounded-full', {
    variants: {
        size: {
            sm: 'size-1.5',
            md: 'size-2',
        },
        // Step 500 is the badge dot's colour too, so a dot and a badge in one tone match.
        tone: {
            neutral: 'bg-neutral-500',
            success: 'bg-success-500',
            warning: 'bg-warning-500',
            error: 'bg-error-500',
            primary: 'bg-primary-500',
        },
    },
    defaultVariants: {
        size: 'md',
        tone: 'success',
    },
});

export type StatusDotTone = NonNullable<VariantProps<typeof statusDotVariants>['tone']>;

export type StatusDotProps = Omit<ComponentProps<'span'>, 'children'> &
    VariantProps<typeof statusDotVariants> & {
        /** A slow halo for something live; it stays still for people who ask for reduced motion. */
        pulse?: boolean;
        /** Names the status for screen readers; without it the dot is decoration beside its text. */
        label?: string;
    };

/** A small dot in a status tone, optionally pulsing for a live state. */
export const StatusDot = ({
    size,
    tone,
    pulse = false,
    label,
    className,
    ...props
}: StatusDotProps) => (
    <span
        aria-hidden={label ? undefined : true}
        className={cn(statusDotVariants({ size, tone }), className)}
        data-pulse={pulse || undefined}
        data-slot="status-dot"
        data-tone={tone ?? 'success'}
        {...props}
    >
        {label && <span className="sr-only">{label}</span>}
        {pulse && (
            // Tailwind's ping runs at 1s, which reads as an alarm; two seconds reads as a heartbeat.
            <span
                className="absolute inset-0 animate-ping rounded-full bg-inherit opacity-60 [animation-duration:2s] motion-reduce:hidden"
                data-slot="status-dot-pulse"
            />
        )}
    </span>
);

export type LiveCountProps = Omit<ComponentProps<'span'>, 'children'> & {
    count: number;
    /** What is being counted, after the number. */
    label?: ReactNode;
    /** Formats the number; defaults to en-GB grouping ("1,234"), the same on the server and in the browser. */
    format?: (count: number) => string;
};

// A fixed locale: the runtime's own would let a server render "1,234" and the browser hydrate "1.234".
const numberFormat = new Intl.NumberFormat('en-GB');
const defaultFormat = (count: number) => numberFormat.format(count);

/** "129 Active now": a pulsing dot, the live number and what it counts; still and grey at zero. */
export const LiveCount = ({
    count,
    label = 'Active now',
    format = defaultFormat,
    className,
    ...props
}: LiveCountProps) => {
    const live = count > 0;

    return (
        <span
            className={cn('inline-flex min-w-0 items-center gap-2 text-xs', className)}
            data-live={live || undefined}
            data-slot="live-count"
            {...props}
        >
            <StatusDot pulse={live} tone={live ? 'success' : 'neutral'} />
            <span className="min-w-0 truncate">
                <span className="font-medium text-neutral-950 tabular-nums">{format(count)}</span>{' '}
                <span className="font-normal text-neutral-600">{label}</span>
            </span>
        </span>
    );
};
