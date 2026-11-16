import { cn } from 'continuum';
import type { ReactNode } from 'react';

/*
 * The rows of a divided list (DividedList draws the frame and the hairlines): a name over one or two
 * quiet lines, 20 by 16 inside, as the playground's MCP and Skills pages set them. A list of pages
 * to open is a grid of cards instead (page-frame's LinkCard).
 */

const rowBox = 'flex min-w-0 flex-col gap-1 px-5 py-4';

/** A row's name: mono for what is typed (a tool, a command), the body face otherwise. */
export const RowName = ({ children, mono = false }: { children: ReactNode; mono?: boolean }) => (
    <span className={cn('font-medium text-neutral-950 text-sm', mono && 'font-mono')}>
        {children}
    </span>
);

/** A row's quiet line under its name. */
export const RowText = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={cn('text-neutral-600 text-xs leading-relaxed', className)}>{children}</span>
);

/** A row that stays where it is. */
export const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
    <li className={cn(rowBox, className)}>{children}</li>
);
