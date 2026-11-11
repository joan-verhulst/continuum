'use client';

import type { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import { ListFilter, X } from 'lucide-react';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { Button, type ButtonProps, focusRing, touchTarget } from './button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    type DropdownMenuContentProps,
    DropdownMenuEmpty,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSearch,
    DropdownMenuTrigger,
} from './dropdown-menu';
import { Toolbar, ToolbarButton, type ToolbarProps } from './toolbar';

/*
 * Conditional filters: each applied filter is a token that reads as a sentence, field · operator ·
 * value, and every part of the sentence is the control that changes it. The token is the inline
 * toolbar (flush segments split by hairlines on the control row), so the applied filters are the
 * controls and need no second display. They sit in a table's own bar, beside the search and the
 * selects a table keeps permanently visible, for a table whose filtering is the work.
 */

export type FilterOperator = { value: string; label: string };

/** The operators each kind of field offers; the first is the default when a condition is added. */
export const filterOperators = {
    many: [
        { value: 'any', label: 'has any of' },
        { value: 'all', label: 'has all of' },
        { value: 'none', label: 'has none of' },
        { value: 'empty', label: 'is empty' },
        { value: 'notEmpty', label: 'is not empty' },
    ],
    one: [
        { value: 'is', label: 'is' },
        { value: 'isNot', label: 'is not' },
    ],
    boolean: [
        { value: 'on', label: 'is on' },
        { value: 'off', label: 'is off' },
    ],
    number: [
        { value: 'eq', label: 'is' },
        { value: 'ne', label: 'is not' },
        { value: 'gt', label: 'is more than' },
        { value: 'lt', label: 'is less than' },
    ],
    date: [
        { value: 'is', label: 'is' },
        { value: 'before', label: 'is before' },
        { value: 'after', label: 'is after' },
        { value: 'last', label: 'is in the last' },
    ],
    text: [
        { value: 'contains', label: 'contains' },
        { value: 'notContains', label: 'does not contain' },
        { value: 'is', label: 'is' },
        { value: 'starts', label: 'starts with' },
    ],
} as const satisfies Record<string, readonly FilterOperator[]>;

export type FilterKind = keyof typeof filterOperators;

/** The operator a condition starts with when it is added: the first of its kind. */
export const defaultFilterOperator = (kind: FilterKind): string => filterOperators[kind][0].value;

/** Operators that are a whole sentence on their own ("is empty", "is on"): they take no value. */
const valuelessOperators: ReadonlySet<string> = new Set(['empty', 'notEmpty', 'on', 'off']);

/** Whether an operator needs a value after it; the value segment is left out when it does not. */
export const filterOperatorTakesValue = (operator: string) => !valuelessOperators.has(operator);

/** Every typed word appears in the label, so "de vr" finds "Anna de Vries". */
const matchesQuery = (label: ReactNode, query: string) => {
    const text = String(label ?? '').toLowerCase();
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every(word => text.includes(word));
};

export type FilterConditionsProps = ComponentProps<'div'> & {
    /** Shows a ghost "Clear all" after the conditions. */
    onClear?: () => void;
    clearLabel?: ReactNode;
    /** The add button, last in the row, after Clear all. */
    add?: ReactNode;
};

/** The applied conditions in a row, then Clear all once there is anything, then the add button. */
export const FilterConditions = ({
    onClear,
    clearLabel = 'Clear all',
    add,
    className,
    children,
    ...props
}: FilterConditionsProps) => (
    <div
        className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}
        data-slot="filter-conditions"
        {...props}
    >
        {children}
        {onClear && (
            <Button data-slot="filter-conditions-clear" onClick={onClear} variant="ghost">
                {clearLabel}
            </Button>
        )}
        {add}
    </div>
);

export type FilterConditionProps = WithClassName<ToolbarProps>;

/**
 * One condition: the inline toolbar, without the float shadow, since it sits in a bar and does not
 * float. Conditions wrap as whole tokens; one wider than its row on its own shrinks to the row, and
 * its value truncates rather than the token clipping.
 */
export const FilterCondition = ({ className, ...props }: FilterConditionProps) => (
    <Toolbar
        className={cn('min-w-0 shadow-none', className)}
        data-slot="filter-condition"
        variant="inline"
        {...props}
    />
);

/** The field the condition is on: its icon and name, the one part that is not a control. */
export const FilterConditionField = ({
    icon,
    className,
    children,
    ...props
}: ComponentProps<'span'> & { icon?: ReactNode }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap border-neutral-200 border-r px-2.5 font-medium text-neutral-950 text-xs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600',
            className,
        )}
        data-slot="filter-condition-field"
        {...props}
    >
        {icon}
        {children}
    </span>
);

export type FilterConditionSegmentProps = ComponentProps<typeof ToolbarButton> & {
    /** The operator reads quieter than the field and the value, so the sentence has one stress. */
    muted?: boolean;
};

/** A segment of the sentence that opens its own menu: the operator, or the value. */
export const FilterConditionSegment = ({
    muted,
    className,
    ...props
}: FilterConditionSegmentProps) => (
    <ToolbarButton
        className={cn(
            'px-2.5',
            muted ? 'font-normal text-neutral-600' : 'text-neutral-950',
            className,
        )}
        data-slot="filter-condition-segment"
        {...props}
    />
);

export type FilterConditionOperatorProps = {
    options: readonly FilterOperator[];
    value: string;
    onValueChange: (value: string) => void;
    /** Where the menu portals, for a preview that must keep it inside a box. */
    container?: DropdownMenuContentProps['container'];
};

/** The operator segment: a radio menu of what the field can do. */
export const FilterConditionOperator = ({
    options,
    value,
    onValueChange,
    container,
}: FilterConditionOperatorProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger render={<FilterConditionSegment muted />}>
            {options.find(option => option.value === value)?.label ?? value}
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="start"
            container={container}
            data-slot="filter-condition-operator-menu"
        >
            <DropdownMenuRadioGroup
                onValueChange={next => onValueChange(String(next))}
                value={value}
            >
                {options.map(option => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);

export type FilterConditionValueProps = {
    options: readonly { value: string; label?: ReactNode }[];
    /** The picked values; one for a single-valued field. */
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    /** Several values may be picked (checkboxes); otherwise one (radios). */
    multiple?: boolean;
    /** Shown while nothing is picked. */
    placeholder?: ReactNode;
    /** A search on top of the menu, for a long list of values. */
    searchable?: boolean;
    /** The search's placeholder; "Search values" by default. */
    searchPlaceholder?: string;
    /** Shown when the search matches nothing; "No values match" by default. */
    emptyLabel?: ReactNode;
    /**
     * The condition's operator. Given one that takes no value ("is empty", "is on"), the segment
     * is left out, so the sentence ends at the operator.
     */
    operator?: string;
    container?: DropdownMenuContentProps['container'];
};

/** "Maya Chen +1": the first picked value and how many more, so the token keeps its width. */
export const filterValueSummary = (
    picked: readonly ReactNode[],
    placeholder: ReactNode = 'Select',
) =>
    picked.length === 0 ? (
        <span className="min-w-0 truncate">{placeholder}</span>
    ) : (
        <>
            {/* The first value is what gives way when the token runs out of room; the count stays. */}
            <span className="min-w-0 truncate">{picked[0]}</span>
            {picked.length > 1 && (
                <span className="font-normal text-neutral-600">+{picked.length - 1}</span>
            )}
        </>
    );

/** The value segment: the field's values to tick (several) or pick (one). */
export const FilterConditionValue = ({
    options,
    value,
    onValueChange,
    multiple = false,
    placeholder,
    searchable = false,
    searchPlaceholder = 'Search values',
    emptyLabel = 'No values match',
    operator,
    container,
}: FilterConditionValueProps) => {
    const [query, setQuery] = useState('');
    if (operator !== undefined && !filterOperatorTakesValue(operator)) return null;
    const picked = value.map(item => options.find(option => option.value === item)?.label ?? item);
    const shown = searchable
        ? options.filter(option => matchesQuery(option.label ?? option.value, query))
        : options;

    return (
        <DropdownMenu onOpenChange={open => !open && setQuery('')}>
            {/* The one segment that may narrow, so a long value truncates before the token clips. */}
            <DropdownMenuTrigger render={<FilterConditionSegment className="min-w-0" />}>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                    {filterValueSummary(picked, placeholder)}
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                container={container}
                data-slot="filter-condition-value-menu"
            >
                {searchable && (
                    <DropdownMenuSearch
                        onValueChange={setQuery}
                        placeholder={searchPlaceholder}
                        value={query}
                    />
                )}
                {shown.length === 0 && <DropdownMenuEmpty>{emptyLabel}</DropdownMenuEmpty>}
                {multiple ? (
                    shown.map(option => (
                        <DropdownMenuCheckboxItem
                            checked={value.includes(option.value)}
                            closeOnClick={false}
                            key={option.value}
                            onCheckedChange={on =>
                                onValueChange(
                                    on
                                        ? [...value, option.value]
                                        : value.filter(item => item !== option.value),
                                )
                            }
                        >
                            {option.label ?? option.value}
                        </DropdownMenuCheckboxItem>
                    ))
                ) : (
                    <DropdownMenuRadioGroup
                        onValueChange={next => onValueChange([String(next)])}
                        value={value[0] ?? ''}
                    >
                        {shown.map(option => (
                            <DropdownMenuRadioItem key={option.value} value={option.value}>
                                {option.label ?? option.value}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export type FilterConditionInputProps = Omit<
    ComponentProps<typeof ToolbarPrimitive.Input>,
    'className'
> & {
    className?: string;
    /**
     * The condition's operator. Given one that takes no value ("is empty"), the segment is left
     * out, so the sentence ends at the operator.
     */
    operator?: string;
};

/**
 * The value segment typed rather than picked, for a number, a date or a piece of text ("is more
 * than 500", "contains invoice"). It reads as the value does, 13/500 `neutral-950`, and grows with
 * what is typed.
 */
export const FilterConditionInput = ({
    operator,
    className,
    ...props
}: FilterConditionInputProps) => {
    if (operator !== undefined && !filterOperatorTakesValue(operator)) return null;

    return (
        <ToolbarPrimitive.Input
            className={cn(
                'field-sizing-content min-w-16 max-w-48 border-neutral-200 not-last:border-r bg-transparent px-2.5 font-medium text-neutral-950 text-xs outline-none placeholder:text-neutral-600',
                // 16px on touch, so iOS does not zoom the page in when the field takes focus.
                'pointer-coarse:text-base',
                focusRing,
                // The bar clips overflow, so the ring sits inside the segment, as a button's does.
                'focus-visible:-outline-offset-2',
                className,
            )}
            data-slot="filter-condition-input"
            {...props}
        />
    );
};

/** The × that ends the sentence and removes the condition. */
export const FilterConditionRemove = ({
    className,
    'aria-label': ariaLabel = 'Remove filter',
    ...props
}: ComponentProps<typeof ToolbarButton>) => (
    <ToolbarButton
        aria-label={ariaLabel}
        // A finger's 44px round the small ×, on a touch screen only; the bar's edge still clips it.
        className={cn('px-2 text-neutral-500', touchTarget, className)}
        data-slot="filter-condition-remove"
        {...props}
    >
        <X className="size-3.5" strokeWidth={2} />
    </ToolbarButton>
);

export type FilterField = { id: string; label: ReactNode; icon?: ReactNode };

export type FilterConditionAddProps = Omit<ButtonProps, 'onSelect'> & {
    /** The fields a condition can be added on; one already applied is left out by the caller. */
    fields: readonly FilterField[];
    onAdd: (id: string) => void;
    /** A search on top of the field list, for a long one. */
    searchable?: boolean;
    /** The search's placeholder; "Search fields" by default. */
    searchPlaceholder?: string;
    /** Shown when the search matches nothing; "No fields match" by default. */
    emptyLabel?: ReactNode;
    container?: DropdownMenuContentProps['container'];
    menuProps?: Partial<MenuPrimitive.Root.Props>;
};

/** The button that adds a condition: a 34 secondary square with the filter icon, opening the fields. */
export const FilterConditionAdd = ({
    fields,
    onAdd,
    searchable = false,
    searchPlaceholder = 'Search fields',
    emptyLabel = 'No fields match',
    container,
    menuProps,
    'aria-label': ariaLabel = 'Add filter',
    size = 'icon',
    variant = 'secondary',
    ...props
}: FilterConditionAddProps) => {
    const [query, setQuery] = useState('');
    const shown = searchable ? fields.filter(field => matchesQuery(field.label, query)) : fields;

    return (
        <DropdownMenu onOpenChange={open => !open && setQuery('')} {...menuProps}>
            <DropdownMenuTrigger
                data-slot="filter-condition-add"
                render={
                    <Button
                        aria-label={ariaLabel}
                        disabled={fields.length === 0}
                        size={size}
                        variant={variant}
                        {...props}
                    />
                }
            >
                <ListFilter strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                container={container}
                data-slot="filter-condition-add-menu"
            >
                {searchable && (
                    <DropdownMenuSearch
                        onValueChange={setQuery}
                        placeholder={searchPlaceholder}
                        value={query}
                    />
                )}
                {shown.length === 0 && <DropdownMenuEmpty>{emptyLabel}</DropdownMenuEmpty>}
                {shown.map(field => (
                    <DropdownMenuItem key={field.id} onClick={() => onAdd(field.id)}>
                        {field.icon}
                        {field.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
