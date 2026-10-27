'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/** The analytics dashboards' collapsed sidebar: a floating pill of icons. */
export const Rail = ({ className, ...props }: ComponentProps<'nav'>) => (
    <nav
        className={cn(
            'flex w-[52px] flex-col items-center gap-0.5 rounded-dock border border-neutral-200 bg-neutral-50 py-2',
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

type RailItemProps = useRender.ComponentProps<'button'> & {
    /** Shown in the tooltip and used as the accessible name. */
    label: string;
    /** The current section; also set by passing aria-current="page" yourself. */
    active?: boolean;
};

/** Pass `render={<a href="…" />}` to make the item a link. */
export const RailItem = ({
    label,
    active,
    render,
    ref,
    className,
    type = 'button',
    ...props
}: RailItemProps) => {
    // The item is built first and handed to the trigger, so the tooltip wires
    // itself onto the button or link rather than wrapping it in another one.
    const item = useRender({
        defaultTagName: 'button',
        render,
        ref,
        // State keys become data attributes, so this sets data-slot="rail-item".
        state: { slot: 'rail-item' },
        props: mergeProps<'button'>(
            {
                'aria-current': active ? 'page' : undefined,
                'aria-label': label,
                className: cn(
                    'grid h-[34px] w-9 shrink-0 cursor-pointer place-items-center rounded-item text-neutral-600 transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-800',
                    'aria-[current=page]:bg-action aria-[current=page]:text-on-action aria-[current=page]:shadow-action aria-[current=page]:hover:bg-action-hover aria-[current=page]:[background-image:var(--action-gradient)] aria-[current=page]:hover:[background-image:none]',
                    '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                    focusRing,
                    className,
                ),
                type: render ? undefined : type,
            },
            props,
        ),
    });

    return (
        <Tooltip>
            <TooltipTrigger render={item} />
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};
