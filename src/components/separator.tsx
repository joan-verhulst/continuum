import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

type SeparatorProps = Omit<ComponentProps<typeof SeparatorPrimitive>, 'className'> & {
    className?: string;
    /** Purely visual by default, so screen readers skip it; false announces a real separator. */
    decorative?: boolean;
};

/** 1px hairline between sections, sidebar groups and toolbar clusters. */
export const Separator = ({
    orientation = 'horizontal',
    decorative = true,
    className,
    ...props
}: SeparatorProps) => (
    <SeparatorPrimitive
        // Base UI always announces a separator; a decorative hairline drops out of the tree.
        aria-orientation={decorative ? undefined : orientation}
        className={cn(
            'shrink-0 bg-neutral-200 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px',
            className,
        )}
        data-slot="separator"
        orientation={orientation}
        role={decorative ? 'none' : 'separator'}
        {...props}
    />
);
