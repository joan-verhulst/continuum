import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

// One line: round the left lobe from the C's tip, through the crossing, round
// the right lobe and back to the crossing. The stretch it never draws is what
// opens the left lobe into a C.
const PATH =
    'M11.5 11.5A5.5 5.5 0 0 0 7.6 9.9H7.9A5.6 5.6 0 0 0 2.3 15.5V16.5A5.6 5.6 0 0 0 7.9 22.1H7.6A5.5 5.5 0 0 0 11.5 20.5L16 16L20.5 11.5A5.5 5.5 0 0 1 24.4 9.9H24.1A5.6 5.6 0 0 1 29.7 15.5V16.5A5.6 5.6 0 0 1 24.1 22.1H24.4A5.5 5.5 0 0 1 20.5 20.5L16 16';

type ContinuumMarkProps = Omit<ComponentProps<'svg'>, 'children'> & {
    /** Rendered size in px. */
    size?: number;
    /** Accessible name; without one the mark is decorative. */
    title?: string;
};

/**
 * The Continuum mark: an endless loop whose left lobe opens into a C. Drawn in
 * the current text colour, with a heavier line at small sizes so it holds up
 * as a favicon or in a sidebar tile.
 */
export const ContinuumMark = ({ size = 24, title, className, ...props }: ContinuumMarkProps) => {
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
                d={PATH}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth}
            />
        </svg>
    );
};

/** The mark with the name beside it, in the system's medium weight. */
export const ContinuumLogo = ({
    size = 24,
    className,
    ...props
}: ComponentProps<'span'> & { size?: number }) => (
    <span
        className={cn('inline-flex items-center gap-2.5 font-medium text-neutral-950', className)}
        data-slot="continuum-logo"
        {...props}
    >
        <ContinuumMark size={size} />
        <span style={{ fontSize: Math.round(size * 0.75), letterSpacing: '-0.01em' }}>
            Continuum
        </span>
    </span>
);
