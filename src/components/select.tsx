'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Children, isValidElement, type ReactNode, useMemo } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';
import { PopoverItem } from './popover-item';
import { ThemeScope, usePortalContainer } from './theme';

type SelectItemEntry = { value: unknown; label: ReactNode };

/**
 * Base UI's value only knows item labels it is given, and the list isn't mounted while closed, so the
 * trigger would show the raw value. Reading the items' text from the JSX tree keeps `<SelectValue />`
 * showing what the list shows, as it did before, without every call site repeating its labels.
 */
const collectItems = (node: ReactNode, items: SelectItemEntry[] = []) => {
    Children.forEach(node, child => {
        if (!isValidElement<{ children?: ReactNode; value?: unknown }>(child)) return;
        if (child.type === SelectItem) {
            items.push({ value: child.props.value, label: child.props.children });
        } else {
            collectItems(child.props.children, items);
        }
    });
    return items;
};

export type SelectProps<Value = string> = Omit<
    SelectPrimitive.Root.Props<Value>,
    'onValueChange' | 'multiple'
> & {
    /**
     * The value-to-label map the closed trigger shows. Leave it out when the SelectItems are written
     * inline under <Select>: their labels are read from the JSX. Pass it when the items come from a
     * component of your own (<SelectContent><RangeOptions /></SelectContent>) or a wrapper around
     * SelectItem, since those are not walked, and the trigger would otherwise show the raw value.
     */
    items?: SelectPrimitive.Root.Props<Value>['items'];
    /** Never called with null: a single select without a null item can't be cleared. */
    onValueChange?: (value: Value, eventDetails: SelectPrimitive.Root.ChangeEventDetails) => void;
};

export const Select = <Value = string>({
    children,
    items,
    onValueChange,
    ...props
}: SelectProps<Value>) => {
    const collected = useMemo(() => items ?? collectItems(children), [items, children]);

    return (
        <SelectPrimitive.Root<Value>
            items={collected}
            onValueChange={
                onValueChange &&
                ((value, eventDetails) => {
                    if (value !== null) onValueChange(value, eventDetails);
                })
            }
            {...props}
        >
            {children}
        </SelectPrimitive.Root>
    );
};

export const SelectGroup = (props: SelectPrimitive.Group.Props) => (
    <SelectPrimitive.Group data-slot="select-group" {...props} />
);

export const SelectValue = (props: SelectPrimitive.Value.Props) => (
    <SelectPrimitive.Value data-slot="select-value" {...props} />
);

export const selectTriggerVariants = cva(
    [
        'inline-flex shrink-0 cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-control border font-medium text-neutral-950 text-xs shadow-control transition-[border-color,color] duration-150',
        // The placeholder answers the pointer as an Input's does: neutral-600, then neutral-700.
        'data-placeholder:text-neutral-600 not-data-disabled:data-placeholder:hover:text-neutral-700',
        // Base UI may keep a disabled trigger focusable, so the attribute is the reliable hook.
        'disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
        focusRing,
    ],
    {
        variants: {
            size: {
                // The same two rows as Input, so a select and a text field sit level.
                sm: 'h-control px-3',
                md: 'h-control-lg px-3',
            },
            invalid: {
                // Its icons turn with the border, as an Input's do.
                true: 'border-error-500 [&_svg]:text-error-500',
                // Open, it stays outlined like an Input with focus or an open DatePicker.
                false: 'border-neutral-200 not-data-disabled:hover:border-neutral-300 data-popup-open:border-neutral-300',
            },
        },
        defaultVariants: {
            size: 'md',
            invalid: false,
        },
    },
);

export type SelectTriggerProps = WithClassName<SelectPrimitive.Trigger.Props> &
    Omit<VariantProps<typeof selectTriggerVariants>, 'invalid'> & {
        leadingIcon?: ReactNode;
        /**
         * `right` gives the "Select ›" picker look of a settings row, where the trigger reads as a
         * way into a choice rather than a field; the list still opens below it.
         */
        indicator?: 'down' | 'right';
    };

/** The library's "select input small/medium"; also the rows-per-page picker in tables. */
export const SelectTrigger = ({
    size,
    leadingIcon,
    indicator = 'down',
    className,
    children,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: SelectTriggerProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <SelectPrimitive.Trigger
            className={cn(selectTriggerVariants({ size, invalid }), className)}
            data-slot="select-trigger"
            {...control}
            {...props}
        >
            {leadingIcon && <span className="flex text-neutral-600">{leadingIcon}</span>}
            {children}
            <SelectPrimitive.Icon
                render={
                    indicator === 'right' ? (
                        <ChevronRight className="ml-auto text-neutral-600" strokeWidth={2} />
                    ) : (
                        <ChevronDown className="ml-auto text-neutral-600" strokeWidth={2} />
                    )
                }
            />
        </SelectPrimitive.Trigger>
    );
};

export type SelectContentProps = WithClassName<SelectPrimitive.Popup.Props> &
    Pick<
        SelectPrimitive.Positioner.Props,
        'side' | 'sideOffset' | 'align' | 'alignOffset' | 'alignItemWithTrigger'
    > & {
        /** Where the list is portalled; the body by default. */
        container?: SelectPrimitive.Portal.Props['container'];
    };

/** The library's "dropdown": a raised list on the surface colour, at least as wide as its trigger. */
export const SelectContent = ({
    className,
    children,
    side = 'bottom',
    sideOffset = 4,
    align = 'start',
    alignOffset = 0,
    // A panel under the trigger, not laid over it on the chosen item: the list reads as a dropdown.
    alignItemWithTrigger = false,
    container,
    ...props
}: SelectContentProps) => (
    <SelectPrimitive.Portal container={usePortalContainer(container)}>
        <ThemeScope>
            <SelectPrimitive.Positioner
                align={align}
                alignItemWithTrigger={alignItemWithTrigger}
                alignOffset={alignOffset}
                className="z-50 outline-none"
                data-slot="select-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <SelectPrimitive.Popup
                    className={cn(
                        // Never wider than the room beside the trigger, as a Combobox's list.
                        'relative flex max-h-(--available-height) min-w-(--anchor-width) max-w-(--available-width) flex-col overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 shadow-float outline-none',
                        'origin-(--transform-origin) transition-[opacity,scale] duration-200 ease-out-strong data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
                        className,
                    )}
                    data-slot="select-content"
                    {...props}
                >
                    {/* The list owns scrolling in Base UI, so the popup only caps the height. */}
                    <SelectPrimitive.List
                        className="flex min-h-0 flex-col gap-1 overflow-y-auto p-1"
                        data-slot="select-list"
                    >
                        {children}
                    </SelectPrimitive.List>
                </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
        </ThemeScope>
    </SelectPrimitive.Portal>
);

export const SelectLabel = ({
    className,
    ...props
}: WithClassName<SelectPrimitive.GroupLabel.Props>) => (
    <SelectPrimitive.GroupLabel
        className={cn('px-3 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs', className)}
        data-slot="select-label"
        {...props}
    />
);

/** An option: a `PopoverItem` row, with a check on the picked one. */
export const SelectItem = ({
    className,
    children,
    ...props
}: WithClassName<SelectPrimitive.Item.Props>) => (
    <PopoverItem
        className={className}
        data-slot="select-item"
        render={<SelectPrimitive.Item {...props} />}
        trailing={
            <SelectPrimitive.ItemIndicator className="flex">
                <Check strokeWidth={2} />
            </SelectPrimitive.ItemIndicator>
        }
    >
        {/* A span: rich labels (icon, name, muted year) flow inline in the list and the trigger. */}
        <SelectPrimitive.ItemText render={<span />}>{children}</SelectPrimitive.ItemText>
    </PopoverItem>
);

export const SelectSeparator = ({
    className,
    ...props
}: WithClassName<SelectPrimitive.Separator.Props>) => (
    <SelectPrimitive.Separator
        className={cn('-mx-1 h-px bg-neutral-200', className)}
        data-slot="select-separator"
        {...props}
    />
);
