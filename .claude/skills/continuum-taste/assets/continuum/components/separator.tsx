import { Separator as SeparatorPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** 1px hairline between sections, sidebar groups and toolbar clusters. */
export const Separator = ({
    orientation = 'horizontal',
    decorative = true,
    className,
    ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) => (
    <SeparatorPrimitive.Root
        className={cn(
            'shrink-0 bg-neutral-200 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
            className,
        )}
        data-slot="separator"
        decorative={decorative}
        orientation={orientation}
        {...props}
    />
);
