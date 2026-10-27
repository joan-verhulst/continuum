'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import type { ComponentProps } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { ThemeScope } from './theme';

export const TooltipProvider = ({
    delay = 300,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) => (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />
);

/** Brings its own provider so a lone tooltip works without one higher up. */
export const Tooltip = (props: ComponentProps<typeof TooltipPrimitive.Root>) => (
    <TooltipProvider>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
);

export const TooltipTrigger = (props: ComponentProps<typeof TooltipPrimitive.Trigger>) => (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
);

type TooltipContentProps = WithClassName<ComponentProps<typeof TooltipPrimitive.Popup>> &
    Pick<
        ComponentProps<typeof TooltipPrimitive.Positioner>,
        'align' | 'alignOffset' | 'side' | 'sideOffset'
    > & {
        /** Where the chip is portalled; the body by default. */
        container?: ComponentProps<typeof TooltipPrimitive.Portal>['container'];
    };

/** Dark label chip for icon-only controls, such as the analytics rail. */
export const TooltipContent = ({
    className,
    side = 'top',
    sideOffset = 6,
    align = 'center',
    alignOffset = 0,
    container,
    ...props
}: TooltipContentProps) => (
    <TooltipPrimitive.Portal container={container}>
        <ThemeScope>
            <TooltipPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                className="z-50"
                data-slot="tooltip-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <TooltipPrimitive.Popup
                    className={cn(
                        'max-w-64 origin-(--transform-origin) select-none text-balance rounded-chip bg-neutral-950 px-2 py-1 font-medium text-neutral-50 text-xxs',
                        // Base UI keeps the popup mounted while it fades out; data-instant marks a hop between
                        // grouped tooltips, which should swap without fading.
                        'transition-opacity duration-200 ease-out-strong data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:transition-none motion-reduce:transition-none',
                        className,
                    )}
                    data-slot="tooltip-content"
                    {...props}
                />
            </TooltipPrimitive.Positioner>
        </ThemeScope>
    </TooltipPrimitive.Portal>
);
