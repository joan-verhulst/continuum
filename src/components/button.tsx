'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export const focusRing =
    'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2';

export const buttonVariants = cva(
    [
        'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium text-xs transition-[background-color,border-color,color,opacity] duration-150',
        'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
        focusRing,
    ],
    {
        variants: {
            variant: {
                primary: [
                    'bg-action text-on-action shadow-action [background-image:var(--action-gradient)]',
                    'hover:bg-action-hover hover:[background-image:none]',
                ],
                secondary:
                    'border border-neutral-200 text-neutral-950 hover:border-neutral-300 hover:text-neutral-700',
                ghost: 'text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-800',
                // For AI actions beside the primary one: the theme's wash, no shadow. Hover mixes the
                // wash towards its own text colour, so it deepens in every theme and in dark mode.
                tint: 'bg-tint text-tint-fg hover:bg-[color-mix(in_oklab,var(--color-tint),var(--color-tint-fg)_8%)]',
            },
            size: {
                // The control row: level with a small input, select or segmented control beside it.
                md: 'h-[34px] rounded-control px-3',
                // The field row: level with a medium input, and the height of the dock's action.
                lg: 'h-[38px] rounded-control px-4',
                icon: 'size-[34px] rounded-control',
                'icon-sm': 'size-7 rounded-chip',
            },
            shape: {
                default: '',
                pill: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            shape: 'default',
        },
    },
);

export type ButtonProps = useRender.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        /**
         * Busy with what it started: a spinner leads the label (or takes an icon button's place) and
         * clicks are held off. It stays at full strength, unlike disabled, since it is working.
         */
        loading?: boolean;
    };

/**
 * One label size (13px medium) at both heights; size only changes padding, so
 * a button sits level with the input beside it: md with a small one, lg with a
 * medium one. Icons sit at 16px either side. Pass `render={<a href="…" />}`
 * to draw a link as a button.
 */
export const Button = ({
    variant,
    size,
    shape,
    loading = false,
    render,
    ref,
    className,
    type = 'button',
    children,
    ...props
}: ButtonProps) => {
    const iconOnly = size === 'icon' || size === 'icon-sm';

    return useRender({
        defaultTagName: 'button',
        render,
        ref,
        // State keys become data attributes, so this sets data-slot="button" and data-loading.
        state: { slot: 'button', loading },
        props: mergeProps<'button'>(
            {
                className: cn(
                    buttonVariants({ variant, size, shape }),
                    loading && 'pointer-events-none',
                    className,
                ),
                // A link or other element passed through render keeps its own semantics.
                type: render ? undefined : type,
                'aria-busy': loading || undefined,
                children: loading ? (
                    iconOnly ? (
                        <Spinner />
                    ) : (
                        <>
                            <Spinner />
                            {children}
                        </>
                    )
                ) : (
                    children
                ),
            },
            props,
        ),
    });
};
