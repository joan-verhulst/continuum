import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

// One line in both shapes: from the C's tip round the left lobe, through the
// crossing, round the right lobe and back to the crossing. The stretch it never
// draws opens the left lobe into a C.
//
// square: two squares turned 45° meeting at the crossing, flat ends and sharp
// joins, for squared type like Geist and Inter.
// round: rounded lobes with round ends and joins, for rounded type.
const SHAPES = {
    square: {
        d: 'M12.5 12.5L9.5 9.5L3 16L9.5 22.5L22.5 9.5L29 16L22.5 22.5L16 16',
        cap: 'butt',
        join: 'miter',
    },
    round: {
        d: 'M11.5 11.5A5.5 5.5 0 0 0 7.6 9.9H7.9A5.6 5.6 0 0 0 2.3 15.5V16.5A5.6 5.6 0 0 0 7.9 22.1H7.6A5.5 5.5 0 0 0 11.5 20.5L16 16L20.5 11.5A5.5 5.5 0 0 1 24.4 9.9H24.1A5.6 5.6 0 0 1 29.7 15.5V16.5A5.6 5.6 0 0 1 24.1 22.1H24.4A5.5 5.5 0 0 1 20.5 20.5L16 16',
        cap: 'round',
        join: 'round',
    },
} as const;

export type ContinuumMarkShape = keyof typeof SHAPES;

type ContinuumMarkProps = Omit<ComponentProps<'svg'>, 'children'> & {
    /** Rendered size in px. */
    size?: number;
    /** Squared or rounded line. Defaults to square. */
    shape?: ContinuumMarkShape;
    /** Accessible name; without one the mark is decorative. */
    title?: string;
};

/**
 * The Continuum mark: an endless loop whose left lobe opens into a C,
 * squared or rounded. Drawn in
 * the current text colour, with a heavier line at small sizes so it holds up
 * as a favicon or in a sidebar tile.
 */
export const ContinuumMark = ({
    size = 24,
    shape = 'square',
    title,
    className,
    ...props
}: ContinuumMarkProps) => {
    const { d, cap, join } = SHAPES[shape];
    const strokeWidth = size <= 20 ? 3.5 : size <= 28 ? 2.75 : 2.5;

    return (
        <svg
            aria-hidden={title ? undefined : true}
            aria-label={title}
            className={cn('shrink-0', className)}
            data-slot="continuum-mark"
            height={size}
            role={title ? 'img' : undefined}
            viewBox="0 0 32 32"
            width={size}
            {...props}
        >
            <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeLinecap={cap}
                strokeLinejoin={join}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
};

/** The mark with the name beside it, in the system's medium weight. */
export const ContinuumLogo = ({
    size = 24,
    shape,
    className,
    ...props
}: ComponentProps<'span'> & { size?: number; shape?: ContinuumMarkShape }) => (
    <span
        className={cn('inline-flex items-center gap-2.5 font-medium text-neutral-950', className)}
        data-slot="continuum-logo"
        {...props}
    >
        <ContinuumMark shape={shape} size={size} />
        <span style={{ fontSize: Math.round(size * 0.75), letterSpacing: '-0.01em' }}>
            Continuum
        </span>
    </span>
);
