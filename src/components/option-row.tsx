import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconTile } from './icon-tile';

export type OptionRowProps = Omit<ComponentProps<'label'>, 'title'> & {
    icon?: ReactNode;
    label: ReactNode;
    description?: ReactNode;
    /** The control the row toggles: a <Checkbox /> or <RadioGroupItem />. */
    control?: ReactNode;
};

/**
 * The report generator's selectable row: 48px with an icon tile, 44px for the
 * plain radio rows. Being a <label>, a click anywhere on it toggles the control
 * in the trailing slot.
 */
export const OptionRow = ({
    icon,
    label,
    description,
    control,
    className,
    ...props
}: OptionRowProps) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control arrives through the `control` slot
    <label
        className={cn(
            'flex cursor-pointer items-center justify-between gap-3 rounded-item border border-neutral-200 py-2 pr-3 pl-2 transition-[border-color] duration-150',
            'hover:border-neutral-300 has-disabled:cursor-not-allowed has-disabled:opacity-50',
            !icon && 'p-3',
            className,
        )}
        data-slot="option-row"
        {...props}
    >
        <span className="flex min-w-0 items-center gap-3">
            {icon && <IconTile className="text-action">{icon}</IconTile>}
            <span className="flex min-w-0 flex-col">
                <span className="font-normal text-neutral-950 text-sm">{label}</span>
                {description && (
                    <span className="font-normal text-neutral-600 text-xs">{description}</span>
                )}
            </span>
        </span>
        {control}
    </label>
);

export const OptionList = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('flex flex-col gap-2', className)} data-slot="option-list" {...props} />
);
