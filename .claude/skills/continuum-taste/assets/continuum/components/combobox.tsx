'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import type { VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';
import { chipClass, chipRemoveClass } from './chip';
import { useFieldControl } from './field';
import { inputTextClass, inputVariants } from './input';
import { ThemeScope } from './theme';

/*
 * A text input that filters a list, built from the same parts as Input (the box) and Select (the
 * panel), so the two read as one family. Root is passed through untouched: it renders no element and
 * its value types are generic, which a wrapper would flatten.
 */
export const Combobox = ComboboxPrimitive.Root;

/** Filters items by their label, with the locale's collation; pass its `contains` to `filter`. */
export const useComboboxFilter = ComboboxPrimitive.useFilter;

/** Renders the selected value; in multiple mode, a function of the values that maps them to chips. */
export const ComboboxValue = (props: ComboboxPrimitive.Value.Props) => (
    <ComboboxPrimitive.Value {...props} />
);

/** Ghost icon button inside the box: no border or fill of its own, so it reads as part of the input. */
const inlineButtonClass = [
    '-mr-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-item text-neutral-600 transition-colors duration-150 hover:text-neutral-950',
    'disabled:pointer-events-none',
    focusRing,
];

export type ComboboxInputProps = Omit<ComboboxPrimitive.Input.Props, 'size' | 'className'> &
    Omit<VariantProps<typeof inputVariants>, 'invalid' | 'disabled'> & {
        leadingIcon?: ReactNode;
        /** The chevron that opens the list without typing. */
        showTrigger?: boolean;
        /** A clear button, shown in place of the chevron once there is a value. */
        showClear?: boolean;
        /** Classes for the bordered box. */
        className?: string;
        /** Classes for the native input. */
        inputClassName?: string;
    };

/**
 * Looks exactly like Input: the group carries the border and the focus ring, the native input is
 * borderless. The group is also what the list anchors to, so the panel lines up with the box rather
 * than with the text.
 */
export const ComboboxInput = ({
    size,
    leadingIcon,
    showTrigger = true,
    showClear = false,
    className,
    inputClassName,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: ComboboxInputProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <ComboboxPrimitive.InputGroup
            className={state =>
                cn(
                    inputVariants({
                        size,
                        invalid,
                        disabled: Boolean(control.disabled) || state.disabled,
                    }),
                    className,
                )
            }
            data-invalid={invalid || undefined}
            data-slot="combobox-input"
        >
            {leadingIcon}
            <ComboboxPrimitive.Input
                className={state =>
                    cn(
                        'h-full min-w-0 flex-1 bg-transparent outline-none',
                        inputTextClass,
                        !invalid &&
                            !state.disabled &&
                            'group-hover/input:placeholder:text-neutral-600',
                        inputClassName,
                    )
                }
                data-slot="combobox-input-control"
                {...control}
                {...props}
            />
            {showClear && (
                <ComboboxPrimitive.Clear
                    aria-label="Clear"
                    className={cn(inlineButtonClass)}
                    data-slot="combobox-clear"
                >
                    <X aria-hidden strokeWidth={2} />
                </ComboboxPrimitive.Clear>
            )}
            {showTrigger && (
                <ComboboxPrimitive.Trigger
                    aria-label="Show options"
                    // Clear only mounts with a value; one trailing control at a time keeps the box calm.
                    className={cn(
                        inlineButtonClass,
                        'group-has-data-[slot=combobox-clear]/input:hidden',
                    )}
                    data-slot="combobox-trigger"
                >
                    <ChevronDown aria-hidden strokeWidth={2} />
                </ComboboxPrimitive.Trigger>
            )}
        </ComboboxPrimitive.InputGroup>
    );
};

/*
 * Chips sit in a box of the input's own height: (38 − 2 − 25) / 2 leaves 5.5px around a 25px chip
 * at md, 3.5px at sm. The left inset matches it once a chip is there, so the chip's pill nests in
 * the box's corner rather than floating at the text inset.
 */
const chipsSizeClass = {
    sm: 'h-auto min-h-[34px] py-[3.5px] has-data-[slot=combobox-chip]:pl-[3.5px]',
    md: 'h-auto min-h-[38px] py-[5.5px] has-data-[slot=combobox-chip]:pl-[5.5px]',
} as const;

export type ComboboxChipsProps = Omit<ComboboxPrimitive.Chips.Props, 'className'> &
    Omit<VariantProps<typeof inputVariants>, 'invalid' | 'disabled'> & {
        className?: string;
        invalid?: boolean;
    };

/**
 * The box for multiple selection: chips and a ComboboxChipsInput wrap inside it and the box grows a
 * row at a time. It renders as the input group too, so the list anchors to the whole box.
 */
export const ComboboxChips = ({
    size,
    invalid: invalidProp,
    className,
    ...props
}: ComboboxChipsProps) => {
    const { invalid } = useFieldControl({ 'aria-invalid': invalidProp });

    return (
        <ComboboxPrimitive.Chips
            className={cn(
                inputVariants({ size, invalid }),
                'flex-wrap gap-1.5',
                chipsSizeClass[size ?? 'md'],
                'has-data-disabled:cursor-not-allowed',
                className,
            )}
            data-invalid={invalid || undefined}
            data-slot="combobox-chips"
            render={<ComboboxPrimitive.InputGroup />}
            {...props}
        />
    );
};

/** The borderless input after the chips; it takes the rest of the row and wraps when narrow. */
export const ComboboxChipsInput = ({
    className,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: Omit<ComboboxPrimitive.Input.Props, 'className'> & { className?: string }) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <ComboboxPrimitive.Input
            className={cn(
                'h-[25px] min-w-16 flex-1 bg-transparent outline-none',
                inputTextClass,
                !invalid && 'group-hover/input:placeholder:text-neutral-600',
                className,
            )}
            data-slot="combobox-chips-input"
            {...control}
            {...props}
        />
    );
};

export type ComboboxChipProps = Omit<ComboboxPrimitive.Chip.Props, 'className'> & {
    className?: string;
    /** Leading 12px icon. */
    icon?: ReactNode;
    /** Hide the remove button, e.g. for a value that can't be dropped. */
    showRemove?: boolean;
    /** Accessible name of the remove button; defaults to "Remove <label>" for text labels. */
    removeLabel?: string;
};

/**
 * A selected value, drawn as FilterChip: a 25px pill on neutral-100 with a 12px remove icon.
 * Backspace and the arrow keys move between chips, so a chip shows the focus ring when it has focus.
 */
export const ComboboxChip = ({
    icon,
    showRemove = true,
    removeLabel,
    className,
    children,
    ...props
}: ComboboxChipProps) => (
    <ComboboxPrimitive.Chip
        className={cn(chipClass, 'min-w-0 data-disabled:opacity-50', focusRing, className)}
        data-slot="combobox-chip"
        {...props}
    >
        <span className="inline-flex min-w-0 items-center gap-1.5">
            {icon}
            <span className="min-w-0 truncate">{children}</span>
        </span>
        {showRemove && (
            <ComboboxPrimitive.ChipRemove
                aria-label={
                    removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove')
                }
                className={chipRemoveClass}
                data-slot="combobox-chip-remove"
            >
                {/* size-3 set here: the box's size-4 rule for icons would otherwise reach it. */}
                <X aria-hidden className="size-3" strokeWidth={2} />
            </ComboboxPrimitive.ChipRemove>
        )}
    </ComboboxPrimitive.Chip>
);

export type ComboboxContentProps = WithClassName<ComboboxPrimitive.Popup.Props> &
    Pick<
        ComboboxPrimitive.Positioner.Props,
        'side' | 'sideOffset' | 'align' | 'alignOffset' | 'anchor' | 'collisionPadding'
    > & {
        /** Where the list is portalled; the body by default. */
        container?: ComboboxPrimitive.Portal.Props['container'];
    };

/** The panel, drawn exactly as SelectContent: a raised list on the surface, as wide as the box. */
export const ComboboxContent = ({
    className,
    side = 'bottom',
    sideOffset = 4,
    align = 'start',
    alignOffset = 0,
    anchor,
    collisionPadding,
    container,
    ...props
}: ComboboxContentProps) => (
    <ComboboxPrimitive.Portal container={container}>
        {/* Portalled content leaves the Theme subtree, so the theme is opened again here. */}
        <ThemeScope>
            <ComboboxPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                anchor={anchor}
                className="z-50 outline-none"
                collisionPadding={collisionPadding}
                data-slot="combobox-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <ComboboxPrimitive.Popup
                    className={cn(
                        'relative flex max-h-(--available-height) min-w-(--anchor-width) max-w-(--available-width) flex-col overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 shadow-float outline-none',
                        'origin-(--transform-origin) transition-[opacity,scale] duration-200 ease-out-strong data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
                        className,
                    )}
                    data-slot="combobox-content"
                    {...props}
                />
            </ComboboxPrimitive.Positioner>
        </ThemeScope>
    </ComboboxPrimitive.Portal>
);

/** Scrolls the items; with no matches it collapses so only the empty message shows. */
export const ComboboxList = ({
    className,
    ...props
}: WithClassName<ComboboxPrimitive.List.Props>) => (
    <ComboboxPrimitive.List
        className={cn(
            'flex min-h-0 scroll-py-1 flex-col gap-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0',
            className,
        )}
        data-slot="combobox-list"
        {...props}
    />
);

/** A 32px row like SelectItem: a wash on highlight, neutral-100 and a check once selected. */
export const ComboboxItem = ({
    className,
    children,
    ...props
}: WithClassName<ComboboxPrimitive.Item.Props>) => (
    <ComboboxPrimitive.Item
        className={cn(
            'relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-item px-2 font-medium text-neutral-700 text-xs outline-none [&_svg]:text-neutral-600',
            'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-800',
            'data-selected:bg-selected data-selected:text-neutral-950',
            'data-disabled:pointer-events-none data-disabled:opacity-50',
            '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            className,
        )}
        data-slot="combobox-item"
        {...props}
    >
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">{children}</span>
        <ComboboxPrimitive.ItemIndicator className="ml-auto flex">
            <Check strokeWidth={2} />
        </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
);

/*
 * Base UI keeps the element mounted (it is a live region that announces "No results") and only
 * drops its children when there are matches, so the row is sized with not-empty: rather than hidden.
 */
export const ComboboxEmpty = ({
    className,
    children = 'No results',
    ...props
}: WithClassName<ComboboxPrimitive.Empty.Props>) => (
    <ComboboxPrimitive.Empty
        className={cn(
            'not-empty:m-1 not-empty:flex not-empty:h-8 not-empty:items-center not-empty:px-2 font-normal text-neutral-500 text-xs',
            className,
        )}
        data-slot="combobox-empty"
        {...props}
    >
        {children}
    </ComboboxPrimitive.Empty>
);

/** Groups keep the list's 4px rhythm between their rows. */
export const ComboboxGroup = ({
    className,
    ...props
}: WithClassName<ComboboxPrimitive.Group.Props>) => (
    <ComboboxPrimitive.Group
        className={cn('flex flex-col gap-1', className)}
        data-slot="combobox-group"
        {...props}
    />
);

export const ComboboxGroupLabel = ({
    className,
    ...props
}: WithClassName<ComboboxPrimitive.GroupLabel.Props>) => (
    <ComboboxPrimitive.GroupLabel
        className={cn('px-2 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs', className)}
        data-slot="combobox-group-label"
        {...props}
    />
);

/** Renders a group's filtered items when the list is built from grouped `items`. */
export const ComboboxCollection = (props: ComboboxPrimitive.Collection.Props) => (
    <ComboboxPrimitive.Collection {...props} />
);

export const ComboboxSeparator = ({
    className,
    ...props
}: WithClassName<ComboboxPrimitive.Separator.Props>) => (
    <ComboboxPrimitive.Separator
        className={cn('-mx-1 h-px bg-neutral-200', className)}
        data-slot="combobox-separator"
        {...props}
    />
);
