'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { CalendarDays } from 'lucide-react';
import {
    type ComponentProps,
    type ReactNode,
    useCallback,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import {
    type DateRange as DayPickerRange,
    type Matcher,
    rangeContainsModifiers,
} from 'react-day-picker';
import { cn } from '../lib/cn';
import { Button, focusRing } from './button';
import { Calendar } from './calendar';
import { useField, useFieldControl } from './field';
import { inputVariants } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/* -------------------------------------------------------------------------------------------------
 * Dates
 * -----------------------------------------------------------------------------------------------*/

/** A complete range: both ends are always set, a single day has `from` and `to` on the same date. */
export type DateRangeValue = { from: Date; to: Date };

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

/** Days in a range, both ends counted; through UTC so a daylight-saving change doesn't lose an hour. */
const countDays = ({ from, to }: DateRangeValue) =>
    Math.round(
        (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
            Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
            86_400_000,
    ) + 1;

/** The local calendar date as YYYY-MM-DD, for a form field; toISOString would shift it to UTC. */
const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "12 Oct 2025". */
export const formatDate = (date: Date) => dayMonthYear.format(date);

/** "12 Oct – 26 Oct 2025"; the year is written once when both ends share it. */
export const formatDateRange = ({ from, to }: DateRangeValue) => {
    if (isSameDay(from, to)) return dayMonthYear.format(from);
    const start =
        from.getFullYear() === to.getFullYear() ? dayMonth.format(from) : dayMonthYear.format(from);
    return `${start} – ${dayMonthYear.format(to)}`;
};

/** A named range in the range picker's list, worked out when it is picked so "today" is never stale. */
export type DateRangePreset = { label: string; range: () => DateRangeValue };

/** Today, yesterday, the last 7 and 30 days, this and last month, and the year so far. */
export const defaultDateRangePresets: DateRangePreset[] = [
    {
        label: 'Today',
        range: () => {
            const today = startOfDay(new Date());
            return { from: today, to: today };
        },
    },
    {
        label: 'Yesterday',
        range: () => {
            const yesterday = addDays(new Date(), -1);
            return { from: yesterday, to: yesterday };
        },
    },
    {
        label: 'Last 7 days',
        range: () => ({ from: addDays(new Date(), -6), to: startOfDay(new Date()) }),
    },
    {
        label: 'Last 30 days',
        range: () => ({ from: addDays(new Date(), -29), to: startOfDay(new Date()) }),
    },
    {
        label: 'This month',
        range: () => {
            const today = startOfDay(new Date());
            return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
        },
    },
    {
        label: 'Last month',
        range: () => {
            const today = new Date();
            return {
                from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                to: new Date(today.getFullYear(), today.getMonth(), 0),
            };
        },
    },
    {
        label: 'Year to date',
        range: () => {
            const today = startOfDay(new Date());
            return { from: new Date(today.getFullYear(), 0, 1), to: today };
        },
    },
];

/* -------------------------------------------------------------------------------------------------
 * Shared state helpers
 * -----------------------------------------------------------------------------------------------*/

/** Controlled when `value` is passed (even undefined is "no date"), uncontrolled otherwise. */
const useControllable = <T,>(
    controlled: boolean,
    value: T,
    defaultValue: T,
    onChange?: (next: T) => void,
) => {
    const [internal, setInternal] = useState(defaultValue);
    const current = controlled ? value : internal;
    const set = useCallback(
        (next: T) => {
            if (!controlled) setInternal(next);
            onChange?.(next);
        },
        [controlled, onChange],
    );
    return [current, set] as const;
};

const wideQuery = '(min-width: 640px)';
const subscribeWide = (onChange: () => void) => {
    const query = window.matchMedia(wideQuery);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
};

/** Two months only fit side by side from the sm breakpoint; a phone gets one. */
const useWide = () =>
    useSyncExternalStore(
        subscribeWide,
        () => window.matchMedia(wideQuery).matches,
        () => false,
    );

/*
 * Base UI focuses the first tabbable part of the popup on open, which would be the previous-month
 * button. The day DayPicker made tabbable (the chosen one, else today) is where the keyboard
 * should land, so the grid's arrow keys work straight away.
 */
const focusDay = (popup: HTMLElement | null) =>
    popup?.querySelector<HTMLElement>('[data-slot=calendar-day-button][tabindex="0"]') ?? true;

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/

/*
 * The trigger is a button drawn as Continuum's Input: the same box, heights and text, so a date
 * sits in a form beside text fields without looking like a different kind of control. It shows the
 * focus ring on itself rather than through an inner input, and stays outlined while its popover is open.
 */
export const datePickerTriggerVariants = cva([
    'cursor-pointer select-none text-left',
    'data-popup-open:border-neutral-300',
    focusRing,
]);

type TriggerOwnProps = Pick<VariantProps<typeof inputVariants>, 'size'> & {
    /** Where the calendar icon sits; `false` drops it. */
    icon?: 'leading' | 'trailing' | false;
    placeholder?: string;
};

type DatePickerTriggerProps = TriggerOwnProps & {
    text: string | undefined;
    className?: string;
    id?: string;
    disabled?: boolean;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
};

const DatePickerTrigger = ({
    size,
    icon = 'leading',
    placeholder,
    text,
    className,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
}: DatePickerTriggerProps) => {
    const field = useField();
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    const isDisabled = Boolean(control.disabled);
    const valueId = useId();
    const iconNode = <CalendarDays aria-hidden strokeWidth={2} />;

    /*
     * A <label for> names a button by the label alone, so the chosen date would go unread. Naming it
     * by the Field's label followed by its own text reads "Start date, 12 Oct 2025".
     */
    const labelled =
        labelledBy ?? (field && !ariaLabel ? `${field.labelId} ${valueId}` : undefined);

    return (
        <PopoverTrigger
            aria-label={ariaLabel}
            aria-labelledby={labelled}
            className={cn(
                inputVariants({ size, invalid, disabled: isDisabled }),
                datePickerTriggerVariants(),
                className,
            )}
            data-invalid={invalid || undefined}
            data-placeholder={text ? undefined : ''}
            data-slot="date-picker-trigger"
            {...control}
        >
            {icon === 'leading' && iconNode}
            <span
                className={cn(
                    'min-w-0 flex-1 truncate font-medium text-xs transition-[color] duration-150',
                    text
                        ? isDisabled
                            ? 'text-neutral-400'
                            : 'text-neutral-900'
                        : isDisabled
                          ? 'text-neutral-300'
                          : invalid
                            ? 'text-error-300'
                            : 'text-neutral-500 group-hover/input:text-neutral-600',
                )}
                data-slot="date-picker-value"
                id={valueId}
            >
                {text ?? placeholder}
            </span>
            {icon === 'trailing' && iconNode}
        </PopoverTrigger>
    );
};

/* -------------------------------------------------------------------------------------------------
 * DatePicker
 * -----------------------------------------------------------------------------------------------*/

type PickerBaseProps = TriggerOwnProps & {
    /** Classes for the trigger box. */
    className?: string;
    id?: string;
    disabled?: boolean;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    /** Days that can't be picked, in react-day-picker's matcher form (`{ before: new Date() }`). */
    disabledDates?: Matcher | Matcher[];
    /** The first and last months the calendar can page to. */
    startMonth?: Date;
    endMonth?: Date;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    align?: ComponentProps<typeof PopoverContent>['align'];
};

export type DatePickerProps = PickerBaseProps & {
    value?: Date | undefined;
    defaultValue?: Date;
    onValueChange?: (value: Date | undefined) => void;
    /** Keeps a date chosen: clicking the chosen day again no longer clears it. */
    required?: boolean;
    /** Submits the date as YYYY-MM-DD under this name in a native form. */
    name?: string;
    format?: (date: Date) => string;
};

/** An Input-like trigger that opens a calendar in a popover and commits the day picked. */
export const DatePicker = (props: DatePickerProps) => {
    const {
        value: valueProp,
        defaultValue,
        onValueChange,
        required = false,
        name,
        format = formatDate,
        placeholder = 'Select date',
        disabledDates,
        startMonth,
        endMonth,
        open: openProp,
        defaultOpen = false,
        onOpenChange,
        align = 'start',
        ...trigger
    } = props;
    // A passed `value={undefined}` is "no date" under the caller's control, not "uncontrolled".
    const [value, setValue] = useControllable(
        'value' in props,
        valueProp,
        defaultValue,
        onValueChange,
    );
    const [open, setOpen] = useControllable(
        openProp !== undefined,
        openProp ?? false,
        defaultOpen,
        onOpenChange,
    );
    const popupRef = useRef<HTMLDivElement>(null);

    return (
        <Popover onOpenChange={next => setOpen(next)} open={open}>
            <DatePickerTrigger
                placeholder={placeholder}
                text={value ? format(value) : undefined}
                {...trigger}
            />
            {name && <input name={name} type="hidden" value={value ? toIsoDate(value) : ''} />}
            <PopoverContent
                align={align}
                aria-label="Choose a date"
                className="w-auto"
                initialFocus={() => focusDay(popupRef.current)}
                ref={popupRef}
            >
                <Calendar
                    defaultMonth={value}
                    disabled={disabledDates}
                    endMonth={endMonth}
                    mode="single"
                    onSelect={(next: Date | undefined) => {
                        setValue(next);
                        setOpen(false);
                    }}
                    // DayPicker then hands back the chosen day when it is clicked again, so it commits and closes.
                    required={required}
                    selected={value}
                    startMonth={startMonth}
                />
            </PopoverContent>
        </Popover>
    );
};

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker
 * -----------------------------------------------------------------------------------------------*/

const presetRowClass = [
    'flex h-8 w-full shrink-0 cursor-pointer select-none items-center whitespace-nowrap rounded-item px-2 font-medium text-neutral-700 text-xs transition-[background-color,color] duration-150',
    'hover:bg-neutral-950/5 hover:text-neutral-800',
    'aria-pressed:bg-selected aria-pressed:text-neutral-950',
    'disabled:pointer-events-none disabled:opacity-50',
    focusRing,
    'focus-visible:-outline-offset-2',
];

export type DateRangePickerProps = PickerBaseProps & {
    value?: DateRangeValue | undefined;
    defaultValue?: DateRangeValue;
    onValueChange?: (value: DateRangeValue | undefined) => void;
    /** The quick ranges listed beside the calendar; `false` hides the list. */
    presets?: DateRangePreset[] | false;
    /** The longest range allowed, in days. */
    maxDays?: number;
    format?: (range: DateRangeValue) => string;
};

/**
 * An Input-like trigger for a period: two months side by side on wide screens, named presets on the
 * left, and the range committed once both ends are picked.
 */
export const DateRangePicker = (props: DateRangePickerProps) => {
    const {
        value: valueProp,
        defaultValue,
        onValueChange,
        presets = defaultDateRangePresets,
        maxDays,
        format = formatDateRange,
        placeholder = 'Select dates',
        disabledDates,
        startMonth,
        endMonth,
        open: openProp,
        defaultOpen = false,
        onOpenChange,
        align = 'start',
        ...trigger
    } = props;
    const [value, setValue] = useControllable(
        'value' in props,
        valueProp,
        defaultValue,
        onValueChange,
    );
    const [open, setOpenState] = useControllable(
        openProp !== undefined,
        openProp ?? false,
        defaultOpen,
        onOpenChange,
    );
    // The half-picked range lives here until its second end is chosen; closing drops it.
    const [draft, setDraft] = useState<DayPickerRange | undefined>();
    const wide = useWide();
    const popupRef = useRef<HTMLDivElement>(null);

    const setOpen = (next: boolean) => {
        setDraft(undefined);
        setOpenState(next);
    };
    const commit = (next: DateRangeValue | undefined) => {
        setValue(next);
        setOpen(false);
    };

    // A preset is held to the same limits the calendar enforces on a hand-picked range.
    const allowed = (range: DateRangeValue) =>
        !(maxDays && countDays(range) > maxDays) &&
        !(
            startMonth && range.from < new Date(startMonth.getFullYear(), startMonth.getMonth(), 1)
        ) &&
        !(endMonth && range.to >= new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 1)) &&
        !(disabledDates && rangeContainsModifiers(range, disabledDates));

    const shown: DayPickerRange | undefined = draft ?? value;
    const status = draft?.from
        ? 'Pick the last day'
        : value
          ? `${countDays(value)} ${countDays(value) === 1 ? 'day' : 'days'}`
          : 'Pick the first day';

    let presetsNode: ReactNode = null;
    if (presets && presets.length > 0) {
        presetsNode = (
            <fieldset
                aria-label="Quick ranges"
                className="grid min-w-0 shrink-0 grid-cols-2 gap-0.5 border-neutral-200 border-b p-1 sm:flex sm:w-36 sm:flex-col sm:border-r sm:border-b-0"
                data-slot="date-range-presets"
            >
                {presets.map(preset => {
                    const range = preset.range();
                    const active =
                        !draft &&
                        value !== undefined &&
                        isSameDay(value.from, range.from) &&
                        isSameDay(value.to, range.to);
                    return (
                        <button
                            aria-pressed={active}
                            className={cn(presetRowClass)}
                            data-slot="date-range-preset"
                            disabled={!allowed(range)}
                            key={preset.label}
                            onClick={() => {
                                const next = preset.range();
                                if (allowed(next)) commit(next);
                            }}
                            type="button"
                        >
                            <span className="min-w-0 truncate">{preset.label}</span>
                        </button>
                    );
                })}
            </fieldset>
        );
    }

    return (
        <Popover onOpenChange={next => setOpen(next)} open={open}>
            <DatePickerTrigger
                placeholder={placeholder}
                text={value ? format(value) : undefined}
                {...trigger}
            />
            <PopoverContent
                align={align}
                aria-label="Choose a date range"
                className="w-auto max-w-[calc(100vw-32px)] gap-0 p-0"
                collisionPadding={16}
                initialFocus={() => focusDay(popupRef.current)}
                ref={popupRef}
            >
                <div className="flex flex-col sm:flex-row">
                    {presetsNode}
                    <div className="flex justify-center p-3">
                        <Calendar
                            defaultMonth={
                                value && wide && value.from.getMonth() !== value.to.getMonth()
                                    ? // Show the range's last month on the right where both fit.
                                      new Date(value.to.getFullYear(), value.to.getMonth() - 1, 1)
                                    : value?.from
                            }
                            disabled={disabledDates}
                            endMonth={endMonth}
                            excludeDisabled
                            // DayPicker reads max={0} as no limit, so a one-day cap is kept in onSelect instead.
                            max={maxDays && maxDays > 1 ? maxDays - 1 : undefined}
                            mode="range"
                            numberOfMonths={wide ? 2 : 1}
                            onSelect={(next: DayPickerRange | undefined, day: Date) => {
                                if (maxDays === 1) {
                                    commit({ from: day, to: day });
                                } else if (next?.from && next.to) {
                                    commit({ from: next.from, to: next.to });
                                } else {
                                    setDraft(next);
                                }
                            }}
                            // Each pick starts a new range instead of stretching the one already set.
                            resetOnSelect
                            selected={shown}
                            showOutsideDays={!wide}
                            startMonth={startMonth}
                        />
                    </div>
                </div>
                {/* A floating container may rule off its footer, edge to edge. */}
                <div
                    className="flex min-h-[42px] shrink-0 items-center justify-between gap-3 border-neutral-200 border-t py-1 pr-1 pl-3"
                    data-slot="date-range-footer"
                >
                    {/* An output is a polite live region, so each step of the pick is announced. */}
                    <output aria-live="polite" className="text-neutral-500 text-xxs">
                        {status}
                    </output>
                    {(value || draft) && (
                        <Button onClick={() => commit(undefined)} variant="ghost">
                            Clear
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
