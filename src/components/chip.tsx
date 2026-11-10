'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

/*
 * A chip: a short value in a pill. Soft, on neutral-100, it holds a filter, a picked value or a tag.
 * Outlined, a hairline round it, it is something offered, such as a prompt for the assistant. Its
 * icon follows its height: 12px in the 25px chip, 16px in the 29px one.
 *
 * Two things can answer a click, apart: the chip itself (`onClick`: open the filter it shows, ask
 * the prompt) and one action at its end (`action`: remove it, edit it). They are sibling buttons,
 * never one inside the other.
 */
export const chipVariants = cva(
    'relative inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-pill font-normal text-xs [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                soft: 'bg-neutral-100 text-neutral-600',
                outline: 'border border-neutral-200 text-neutral-950',
            },
            size: {
                sm: 'h-chip px-2 [&_svg:not([class*=size-])]:size-3',
                md: 'h-segment px-2.5 [&_svg:not([class*=size-])]:size-4',
            },
        },
        defaultVariants: { variant: 'soft', size: 'sm' },
    },
);

// A chip that takes a click answers the pointer over its whole face, its action aside.
const pressable = {
    soft: 'has-[[data-slot=chip-button]:hover]:bg-neutral-200 has-[[data-slot=chip-button]:hover]:text-neutral-950',
    outline: 'has-[[data-slot=chip-button]:hover]:border-neutral-300',
} as const;

/** The 25px soft chip, as the combobox draws its picked values. */
export const chipClass = chipVariants();

/** The button at the end of a chip: a 20px target drawn round a 12px icon. */
export const chipRemoveClass =
    'relative z-10 -m-1 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition-colors duration-150 hover:text-neutral-950 [&_svg]:size-3!';

/*
 * The chip's text label, for an action's default name ("Remove Country is Netherlands"), and
 * whether it is disabled, so its action is out of reach by keyboard as well as by pointer.
 */
const ChipContext = createContext<{ label?: string; disabled?: boolean }>({});

export type ChipProps = Omit<ComponentProps<'span'>, 'onClick'> &
    VariantProps<typeof chipVariants> & {
        /** Leading icon, 12px in a `sm` chip and 16px in an `md` one. */
        icon?: ReactNode;
        /** Makes the chip a button: open the filter it shows, ask the prompt it holds. */
        onClick?: () => void;
        /** One `ChipAction` at the end: remove (the default), edit, or any one icon. */
        action?: ReactNode;
        disabled?: boolean;
    };

/**
 * A short value in a pill: a filter in a top bar ("Status is Paid"), a picked value, a tag, or a
 * prompt offered to the user. It can take a click, end in an action, both, or neither.
 */
export const Chip = ({
    variant = 'soft',
    size = 'sm',
    icon,
    onClick,
    action,
    disabled,
    className,
    children,
    ...props
}: ChipProps) => {
    const label = (
        <span className="inline-flex items-center gap-1.5">
            {icon}
            {children}
        </span>
    );

    return (
        <ChipContext.Provider
            value={{ label: typeof children === 'string' ? children : undefined, disabled }}
        >
            <span
                className={cn(
                    chipVariants({ variant, size }),
                    'transition-[background-color,border-color,color] duration-150',
                    onClick && pressable[variant ?? 'soft'],
                    disabled && 'pointer-events-none opacity-50',
                    className,
                )}
                data-slot="chip"
                data-variant={variant}
                {...props}
            >
                {onClick ? (
                    <button
                        className={cn(
                            // Its hit area spreads over the whole chip; the action sits above it.
                            'inline-flex cursor-pointer items-center rounded-pill after:absolute after:inset-0 after:rounded-pill',
                            focusRing,
                        )}
                        data-slot="chip-button"
                        disabled={disabled}
                        onClick={onClick}
                        type="button"
                    >
                        {label}
                    </button>
                ) : (
                    label
                )}
                {action}
            </span>
        </ChipContext.Provider>
    );
};

export type ChipActionProps = Omit<ComponentProps<'button'>, 'type'> & {
    /** Its accessible name; "Remove <the chip's label>" when left out. */
    label?: string;
};

/** The action at a chip's end. An × that removes the chip unless given another icon. */
export const ChipAction = ({ label, disabled, className, children, ...props }: ChipActionProps) => {
    const chip = useContext(ChipContext);

    return (
        <button
            aria-label={label ?? (chip.label ? `Remove ${chip.label}` : 'Remove')}
            className={cn(chipRemoveClass, focusRing, className)}
            data-slot="chip-action"
            disabled={disabled ?? chip.disabled}
            type="button"
            {...props}
        >
            {children ?? <X aria-hidden strokeWidth={2} />}
        </button>
    );
};
