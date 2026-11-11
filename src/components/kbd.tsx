import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/**
 * Keyboard shortcut key from the sidebar menu item and the report editor's sidebar. A touch screen
 * has no keys to press, so on a coarse pointer the hint is not drawn.
 */
export const Kbd = ({ className, ...props }: ComponentProps<'kbd'>) => (
    <kbd
        className={cn(
            'inline-flex pointer-coarse:hidden h-5.25 min-w-5.25 shrink-0 items-center justify-center rounded-chip border border-neutral-300 px-1 font-medium font-sans text-neutral-700 text-xxs',
            className,
        )}
        data-slot="kbd"
        {...props}
    />
);
