'use client';

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { type ComponentProps, createContext, useContext } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { ThemeScope } from './theme';

// Whether a TooltipProvider sits above, so a tooltip inside it joins that provider's group.
const InProviderContext = createContext(false);

/**
 * Groups the tooltips inside it: once one has shown, the next one pointed at opens at once, so
 * moving along a rail or a toolbar reads each label without waiting again.
 */
export const TooltipProvider = ({
    delay = 300,
    children,
    ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) => (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props}>
        <InProviderContext.Provider value>{children}</InProviderContext.Provider>
    </TooltipPrimitive.Provider>
);

/**
 * Brings its own provider when there is none higher up, so a lone tooltip works; inside a
 * TooltipProvider it joins that one, since a provider of its own would cut it out of the group.
 */
export const Tooltip = (props: ComponentProps<typeof TooltipPrimitive.Root>) => {
    const root = <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
    return useContext(InProviderContext) ? root : <TooltipProvider>{root}</TooltipProvider>;
};

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
        /** Classes for the positioner, such as a higher layer for a tooltip on something above dialogs. */
        positionerClassName?: string;
    };

/** Dark label chip for icon-only controls, such as the analytics rail. */
export const TooltipContent = ({
    className,
    side = 'top',
    sideOffset = 6,
    align = 'center',
    alignOffset = 0,
    container,
    positionerClassName,
    ...props
}: TooltipContentProps) => (
    <TooltipPrimitive.Portal container={container}>
        <ThemeScope>
            <TooltipPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                className={cn('z-50', positionerClassName)}
                data-slot="tooltip-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <TooltipPrimitive.Popup
                    className={cn(
                        'max-w-tooltip origin-(--transform-origin) select-none text-balance rounded-chip bg-neutral-950 px-2 py-1 font-medium text-neutral-50 text-xxs',
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
