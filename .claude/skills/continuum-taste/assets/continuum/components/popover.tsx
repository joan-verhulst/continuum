'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import type { ComponentProps } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { ThemeScope } from './theme';

/** A handle that lets a trigger outside the Popover open it (detached triggers). */
export const createPopoverHandle = PopoverPrimitive.createHandle;

/** Small anchored panels that hold controls: filters, a date picker, column settings. */
export const Popover = <Payload,>(props: PopoverPrimitive.Root.Props<Payload>) => (
    <PopoverPrimitive.Root data-slot="popover" {...props} />
);

/** Opens the popover; pass `render={<Button />}` to use one of the system's controls. */
export const PopoverTrigger = <Payload,>(props: PopoverPrimitive.Trigger.Props<Payload>) => (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
);

export type PopoverContentProps = WithClassName<PopoverPrimitive.Popup.Props> &
    Pick<
        PopoverPrimitive.Positioner.Props,
        | 'align'
        | 'alignOffset'
        | 'side'
        | 'sideOffset'
        | 'anchor'
        | 'positionMethod'
        | 'collisionPadding'
    > & {
        /** Where the panel is portalled; the body by default. */
        container?: PopoverPrimitive.Portal.Props['container'];
    };

/**
 * The panel. It is a card-sized surface rather than a menu, so it takes the card radius and p-3; it
 * grows from the trigger (95% to 100%) so it reads as coming out of it, and fades out faster than it
 * comes in.
 */
export const PopoverContent = ({
    className,
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    alignOffset = 0,
    anchor,
    positionMethod,
    collisionPadding,
    container,
    ...props
}: PopoverContentProps) => (
    <PopoverPrimitive.Portal container={container}>
        {/* Portalled content leaves the Theme subtree, so the theme is opened again here. */}
        <ThemeScope>
            <PopoverPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                anchor={anchor}
                className="isolate z-50"
                collisionPadding={collisionPadding}
                data-slot="popover-positioner"
                positionMethod={positionMethod}
                side={side}
                sideOffset={sideOffset}
            >
                <PopoverPrimitive.Popup
                    className={cn(
                        'flex max-h-(--available-height) w-72 flex-col gap-3 overflow-y-auto rounded-card border border-neutral-200 bg-neutral-50 p-3 text-neutral-700 text-xs shadow-float outline-none',
                        'origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out-strong data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-100 motion-reduce:transition-none',
                        className,
                    )}
                    data-slot="popover-content"
                    {...props}
                />
            </PopoverPrimitive.Positioner>
        </ThemeScope>
    </PopoverPrimitive.Portal>
);

/** Title and description stacked tight, above the popover's controls. */
export const PopoverHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('flex flex-col gap-0.5', className)} data-slot="popover-header" {...props} />
);

/** Labels the popup for assistive tech through aria-labelledby. */
export const PopoverTitle = ({
    className,
    ...props
}: WithClassName<PopoverPrimitive.Title.Props>) => (
    <PopoverPrimitive.Title
        className={cn('font-medium text-neutral-950 text-sm', className)}
        data-slot="popover-title"
        {...props}
    />
);

/** Describes the popup for assistive tech through aria-describedby. */
export const PopoverDescription = ({
    className,
    ...props
}: WithClassName<PopoverPrimitive.Description.Props>) => (
    <PopoverPrimitive.Description
        className={cn('text-neutral-600 text-xs', className)}
        data-slot="popover-description"
        {...props}
    />
);

/** Closes the popover; pass `render={<Button />}` to use one of the system's controls. */
export const PopoverClose = (props: PopoverPrimitive.Close.Props) => (
    <PopoverPrimitive.Close data-slot="popover-close" {...props} />
);
