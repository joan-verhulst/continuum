import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const spinnerVariants = cva(
    // Reduced motion keeps it turning, slowly: a frozen arc would read as stuck rather than busy.
    'shrink-0 animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]',
    {
        variants: {
            size: {
                sm: 'size-3',
                md: 'size-4',
            },
        },
        defaultVariants: { size: 'md' },
    },
);

export type SpinnerProps = Omit<ComponentProps<'svg'>, 'children'> &
    VariantProps<typeof spinnerVariants> & {
        /** Names it for screen readers; leave it off inside a button, which says it is busy itself. */
        label?: string;
    };

/**
 * A quarter arc turning on a faint ring, in the text colour. It belongs inside the button that is
 * busy (`<Button loading>`); a page that loads shows skeletons instead.
 */
export const Spinner = ({ size, label, className, ...props }: SpinnerProps) => (
    <svg
        aria-hidden={label ? undefined : true}
        aria-label={label}
        className={cn(spinnerVariants({ size }), className)}
        data-slot="spinner"
        fill="none"
        role={label ? 'status' : undefined}
        viewBox="0 0 16 16"
        {...props}
    >
        <circle cx="8" cy="8" opacity="0.25" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
);
