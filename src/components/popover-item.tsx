'use client';

import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { Children, type ComponentProps, Fragment, isValidElement, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Avatar, type AvatarProps } from './avatar';
import { Badge } from './badge';

/*
 * The row every popup list is made of: a select's options, a combobox's, a menu's actions, a filter
 * menu's values, the command menu's commands. 36px, padded the same on both sides so the label and
 * a trailing check sit evenly, and cornered one step inside the panel round it: the panel's
 * `rounded-item` less its 4px padding and 1px border, so the curves stay concentric.
 */
export const popoverItemVariants = cva(
    [
        'relative flex h-option shrink-0 cursor-pointer select-none items-center gap-3 rounded-[calc(var(--radius-item)-5px)] px-3 py-2 font-medium text-xs outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    ],
    {
        variants: {
            variant: {
                default: [
                    'text-neutral-700 [&_svg]:text-neutral-600',
                    'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-800',
                    // The picked option in a select or combobox, the checked one in a radio group.
                    'data-selected:bg-selected data-selected:text-neutral-950',
                ],
                danger: 'text-error-600 data-highlighted:bg-neutral-950/5 [&_svg]:text-current',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

/*
 * The leading element sets the row's rhythm: the space round it, above, below, before it and up to
 * the name, grows with its size, so an avatar sits in its own square of space as a 16px icon does.
 * About 10px + (size − 16px) / 8 above and below, a step more at the sides, snapped to the scale and
 * kept in Tailwind classes; the row's height is then the leading element plus that space.
 */
const leads = {
    // A 16px icon, checkbox or radio: the 36px row as it is.
    sm: '',
    // A 24px avatar or a chip.
    md: 'h-auto gap-3 px-3 py-2.5',
    // A 32 or 36px avatar.
    lg: 'h-auto gap-3 px-3 py-3',
} as const;

export type PopoverItemLead = keyof typeof leads;

/** The tier of what leads the row, read from the elements it knows: an avatar by its size, a badge as a chip. */
const leadOf = (leading: ReactNode): PopoverItemLead => {
    let size = 16;
    const visit = (node: ReactNode) =>
        Children.forEach(node, child => {
            if (!isValidElement(child)) return;
            if (child.type === Fragment) visit((child.props as { children?: ReactNode }).children);
            else if (child.type === Avatar)
                size = Math.max(size, Number((child.props as AvatarProps).size ?? 32));
            else if (child.type === Badge) size = Math.max(size, 24);
        });
    visit(leading);
    return size >= 32 ? 'lg' : size >= 22 ? 'md' : 'sm';
};

export type PopoverItemProps = Omit<ComponentProps<'div'>, 'children'> &
    VariantProps<typeof popoverItemVariants> & {
        /** The list's own item, which keeps its behaviour: `render={<SelectPrimitive.Item value="a" />}`. */
        render?: useRender.RenderProp;
        /**
         * Before the name: a 16px icon, an `Avatar`, a `PopoverItemIndicator` (checkbox or radio),
         * a chip. The row spaces itself to what leads it (see `lead`).
         */
        leading?: ReactNode;
        /**
         * The row's spacing tier, from the size of what leads it. Worked out from an `Avatar` or a
         * `Badge` in `leading`; set it for anything else of 24px (`md`) or 32px and up (`lg`).
         */
        lead?: PopoverItemLead;
        /** Inline after the name: badges, chips, a label, a short muted note ("you"). */
        meta?: ReactNode;
        /** A second, quieter line under the name; the row grows to fit it. */
        description?: ReactNode;
        /**
         * After everything, at the far end: a check, a `PopoverItemShortcut`, a count, a badge, an
         * icon, a chevron to a submenu. More than one sits 8px apart.
         */
        trailing?: ReactNode;
        /** The name. */
        children?: ReactNode;
    };

/**
 * A popup list's row. Each list renders its own Base UI item through it, so the highlight,
 * selection and keyboard come from Base UI and the look from here. Its anatomy:
 *
 *     [leading]  name [meta]                [trailing]
 *                description
 */
export const PopoverItem = ({
    render,
    variant,
    leading,
    lead = leadOf(leading),
    meta,
    description,
    trailing,
    className,
    children,
    ...props
}: PopoverItemProps) =>
    useRender({
        defaultTagName: 'div',
        render,
        props: {
            className: cn(
                'group/popover-item',
                popoverItemVariants({ variant }),
                // Two lines: the row grows past 36px and keeps the same space above and below.
                description !== undefined && 'h-auto min-h-option py-2.5',
                leads[lead],
                // Beside an avatar or a chip one line of text sits closer; two lines keep the wider gap.
                description === undefined && lead !== 'sm' && 'gap-2.5',
                className,
            ),
            'data-lead': lead,
            'data-slot': 'popover-item',
            ...props,
            children: (
                <>
                    {leading}
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex min-w-0 items-center gap-1.5">
                            {/* Its own block, so a long name still ends in an ellipsis. */}
                            <span className="min-w-0 truncate">{children}</span>
                            {meta && (
                                <span
                                    className="flex shrink-0 items-center gap-1 font-normal text-neutral-600"
                                    data-slot="popover-item-meta"
                                >
                                    {meta}
                                </span>
                            )}
                        </span>
                        {description !== undefined && (
                            <span
                                className="truncate font-normal text-neutral-600 text-xxs"
                                data-slot="popover-item-description"
                            >
                                {description}
                            </span>
                        )}
                    </span>
                    {trailing && (
                        <span
                            className="ml-auto flex shrink-0 items-center gap-2 pl-2 font-normal text-neutral-600 text-xxs"
                            data-slot="popover-item-trailing"
                        >
                            {trailing}
                        </span>
                    )}
                </>
            ),
        },
    });

export type PopoverItemIndicatorProps = Omit<ComponentProps<'span'>, 'children'> & {
    kind?: 'checkbox' | 'radio';
};

/**
 * A checkbox or radio drawn small at the head of a row. It reads the row's own state, checked in a
 * menu, selected in a select, so it needs no props of its own to follow along.
 */
export const PopoverItemIndicator = ({
    kind = 'checkbox',
    className,
    ...props
}: PopoverItemIndicatorProps) => (
    <span
        className={cn(
            'inline-flex size-4 shrink-0 items-center justify-center border border-neutral-300 text-on-action transition-[background-color,border-color] duration-150',
            kind === 'radio' ? 'rounded-full' : 'rounded-[calc(var(--radius-chip)-2px)]',
            'group-data-checked/popover-item:border-transparent group-data-checked/popover-item:bg-action group-data-checked/popover-item:[background-image:var(--action-gradient)]',
            'group-data-selected/popover-item:border-transparent group-data-selected/popover-item:bg-action group-data-selected/popover-item:[background-image:var(--action-gradient)]',
            // The row greys its icons; the mark keeps the action's foreground.
            '[&_svg]:text-on-action!',
            className,
        )}
        data-kind={kind}
        data-slot="popover-item-indicator"
        {...props}
    >
        <span className="flex opacity-0 transition-opacity duration-150 group-data-checked/popover-item:opacity-100 group-data-selected/popover-item:opacity-100">
            {kind === 'radio' ? (
                <span className="size-1.5 rounded-full bg-current" />
            ) : (
                <Check className="size-3" strokeWidth={2} />
            )}
        </span>
    </span>
);

/** A shortcut at the end of a row, muted: "⌘D", "G I". Not drawn on a touch screen, which has no keys. */
export const PopoverItemShortcut = ({ className, ...props }: ComponentProps<'span'>) => (
    <span
        className={cn('pointer-coarse:hidden font-medium text-neutral-600 text-xxs', className)}
        data-slot="popover-item-shortcut"
        {...props}
    />
);
