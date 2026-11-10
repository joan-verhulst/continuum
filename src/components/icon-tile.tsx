import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const iconTileVariants = cva(
    'inline-flex size-8 shrink-0 items-center justify-center rounded-chip border border-neutral-200 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                filled: 'bg-neutral-100',
                outline: '',
            },
            // A glyph needs 3:1 on the tile: a ramp's 600, or 700 for the pale green and amber and for the
            // theme's accent, which may be pale; dots and fills take 500.
            tone: {
                neutral: 'text-neutral-600',
                success: 'text-success-700',
                warning: 'text-warning-700',
                error: 'text-error-600',
                primary: 'text-primary-700',
            },
        },
        defaultVariants: {
            variant: 'filled',
            tone: 'neutral',
        },
    },
);

export type IconTileProps = ComponentProps<'span'> & VariantProps<typeof iconTileVariants>;

/**
 * Square icon well: filled beside the report generator's option rows, outlined
 * in the invoice sheet's status history.
 */
export const IconTile = ({ variant, tone, className, ...props }: IconTileProps) => (
    <span
        className={cn(iconTileVariants({ variant, tone }), className)}
        data-slot="icon-tile"
        data-tone={tone ?? 'neutral'}
        {...props}
    />
);
