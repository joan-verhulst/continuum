'use client';

import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/** The analytics dashboards' collapsed sidebar: a floating pill of icons. */
export const Rail = ({ className, ...props }: ComponentProps<'nav'>) => (
    <nav
        className={cn(
            'flex w-[52px] flex-col items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 py-2',
            className,
        )}
        data-slot="rail"
        {...props}
    />
);

export const RailSeparator = ({ className, ...props }: ComponentProps<'hr'>) => (
    <hr
        className={cn('my-1.5 h-px w-full shrink-0 border-0 bg-neutral-200', className)}
        data-slot="rail-separator"
        {...props}
    />
);

type RailItemProps = ComponentProps<'button'> & {
    /** Shown in the tooltip and used as the accessible name. */
    label: string;
    /** The current section; also set by passing aria-current="page" yourself. */
    active?: boolean;
    asChild?: boolean;
};

export const RailItem = ({
    label,
    active,
    asChild,
    className,
    type = 'button',
    ...props
}: RailItemProps) => {
    const Component = asChild ? Slot.Root : 'button';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Component
                    aria-current={active ? 'page' : undefined}
                    aria-label={label}
                    className={cn(
                        'grid h-[34px] w-9 shrink-0 cursor-pointer place-items-center rounded-item text-neutral-600 transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-800',
                        'aria-[current=page]:bg-action aria-[current=page]:text-on-action aria-[current=page]:shadow-action aria-[current=page]:hover:bg-action-hover aria-[current=page]:[background-image:var(--pds-action-gradient)] aria-[current=page]:hover:[background-image:none]',
                        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                        focusRing,
                        className,
                    )}
                    data-slot="rail-item"
                    type={asChild ? undefined : type}
                    {...props}
                />
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};
