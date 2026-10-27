import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconTile } from './icon-tile';

export type EmptyStateProps = Omit<ComponentProps<'div'>, 'title'> & {
    /** A 16px icon for what would be here, in a tile; no illustrations. */
    icon?: ReactNode;
    /** What would be here: "No invoices yet". */
    title: ReactNode;
    /** One sentence on how it fills, or why it is empty now. */
    description?: ReactNode;
    /** One action, usually a secondary Button; a filter that matched nothing offers to clear it. */
    action?: ReactNode;
};

/**
 * Where a list or a section would be, before there is anything in it: a dashed, left-aligned panel
 * with what goes here, a sentence and one action. It holds the place at the content's width, so the
 * page does not jump when the first record arrives.
 */
export const EmptyState = ({
    icon,
    title,
    description,
    action,
    className,
    children,
    ...props
}: EmptyStateProps) => (
    <div
        className={cn(
            'flex flex-col items-start gap-4 rounded-panel border border-neutral-200 border-dashed p-6',
            className,
        )}
        data-slot="empty-state"
        {...props}
    >
        {icon && <IconTile>{icon}</IconTile>}
        <div className="flex max-w-[480px] flex-col gap-1" data-slot="empty-state-text">
            <p className="font-medium text-neutral-950 text-xs">{title}</p>
            {description && <p className="text-neutral-600 text-xs">{description}</p>}
        </div>
        {children}
        {action && (
            <div className="flex flex-wrap items-center gap-2" data-slot="empty-state-action">
                {action}
            </div>
        )}
    </div>
);
