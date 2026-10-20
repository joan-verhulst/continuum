'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { ThemeScope } from './theme';

export const TooltipProvider = ({
    delayDuration = 300,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) => (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
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

/** Dark label chip for icon-only controls, such as the analytics rail. */
export const TooltipContent = ({
    className,
    sideOffset = 6,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) => (
    <TooltipPrimitive.Portal>
        <ThemeScope>
            <TooltipPrimitive.Content
                className={cn(
                    'z-50 max-w-64 select-none text-balance rounded-chip bg-neutral-950 px-2 py-1 font-medium text-neutral-50 text-xxs',
                    'starting:opacity-0 transition-opacity duration-200 ease-out-strong motion-reduce:transition-none',
                    className,
                )}
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                {...props}
            />
        </ThemeScope>
    </TooltipPrimitive.Portal>
);
