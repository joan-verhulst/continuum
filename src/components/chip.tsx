import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

/** The 25px pill a filter or a picked value sits in; the combobox draws its chips with it too. */
export const chipClass =
    'inline-flex h-[25px] shrink-0 items-center gap-3 whitespace-nowrap rounded-pill bg-neutral-100 px-2 font-normal text-neutral-600 text-xs [&_svg:not([class*=size-])]:size-3 [&_svg]:shrink-0';

/** The × at the end of a chip: a 20px target drawn round a 12px icon. */
export const chipRemoveClass =
    '-m-1 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors duration-150 hover:text-neutral-950';

export type FilterChipProps = ComponentProps<'span'> & {
    /** Leading 12px icon. */
    icon?: ReactNode;
    onRemove?: () => void;
    /** Accessible name of the remove button; defaults to "Remove <label>" for text labels. */
    removeLabel?: string;
};

/** A removable filter tag in a top bar. Without `onRemove` it renders as a static tag. */
export const FilterChip = ({
    icon,
    onRemove,
    removeLabel,
    className,
    children,
    ...props
}: FilterChipProps) => (
    <span className={cn(chipClass, className)} data-slot="filter-chip" {...props}>
        <span className="inline-flex items-center gap-1.5">
            {icon}
            {children}
        </span>
        {onRemove && (
            <button
                aria-label={
                    removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')
                }
                className={cn(chipRemoveClass, focusRing)}
                data-slot="filter-chip-remove"
                onClick={onRemove}
                type="button"
            >
                <X aria-hidden strokeWidth={2} />
            </button>
        )}
    </span>
);

export type SuggestionChipProps = ComponentProps<'button'> & {
    /** Leading 16px icon. */
    icon?: ReactNode;
};

/** A prompt offered to the user, set in a row after a "Suggestions:" label. */
export const SuggestionChip = ({
    icon,
    className,
    children,
    type = 'button',
    ...props
}: SuggestionChipProps) => (
    <button
        className={cn(
            'inline-flex h-[29px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control border border-neutral-200 px-2 font-normal text-neutral-950 text-xs transition-colors duration-150 hover:border-neutral-300',
            'disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="suggestion-chip"
        type={type}
        {...props}
    >
        {icon}
        {children}
    </button>
);
