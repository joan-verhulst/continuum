import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { StatusDot } from './status-dot';

export const badgeVariants = cva(
    'inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap font-medium text-xxs [&_svg:not([class*=size-])]:size-3 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                soft: 'rounded-chip px-1.5',
                pill: 'rounded-pill px-2',
                // A status with a marker in front: the soft badge's shape with a 6px dot.
                dot: 'gap-1.5 rounded-chip px-1.5',
                count: 'min-w-8 justify-center rounded-chip px-1.5',
            },
            // Two steps of one ramp: text at 700 on its own 500 at 20%, so a badge reads on any surface.
            tone: {
                neutral: 'bg-neutral-500/20 text-neutral-700',
                success: 'bg-success-500/20 text-success-700',
                warning: 'bg-warning-500/20 text-warning-700',
                error: 'bg-error-500/20 text-error-700',
                primary: 'bg-primary-500/20 text-primary-700',
            },
        },
        defaultVariants: {
            variant: 'soft',
            tone: 'neutral',
        },
    },
);

export type BadgeProps = ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & {
        /** Leading 12px icon; the dot variant draws its own marker instead. */
        icon?: ReactNode;
    };

/**
 * Status and count labels, filled and never outlined. `soft` is the status
 * badge, `pill` the delta, `dot` a status with a coloured marker and `count`
 * the number beside a navigation item.
 */
export const Badge = ({ variant, tone, icon, className, children, ...props }: BadgeProps) => (
    <span
        className={cn(badgeVariants({ variant, tone }), className)}
        data-slot="badge"
        data-tone={tone ?? 'neutral'}
        data-variant={variant ?? 'soft'}
        {...props}
    >
        {variant === 'dot' ? <StatusDot size="sm" tone={tone ?? 'neutral'} /> : icon}
        {children}
    </span>
);
