'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { type ComponentProps, useEffect, useRef } from 'react';
import {
    type ChevronProps,
    type DayButtonProps,
    DayPicker,
    type DayProps,
    type RootProps,
} from 'react-day-picker';
import { enGB } from 'react-day-picker/locale';
import { cn } from '../lib/cn';
import { buttonVariants, focusRing } from './button';

export type CalendarProps = ComponentProps<typeof DayPicker>;

/*
 * The cell is a td and the day a 32px button inside it. A range is drawn on the cells, so the strip
 * runs unbroken between days while each button keeps its own corners; the ends of a range fill only
 * the inner half of their cell, so the strip starts under the middle of the action-coloured day.
 */
const CalendarDay = ({ day: _day, modifiers, className, ...props }: DayProps) => {
    const { range_start: start, range_end: end, range_middle: middle, hidden } = modifiers;

    return (
        <td
            className={cn(
                'p-0 text-center',
                !hidden && [
                    // Of-type, not first/last child: with week numbers on, a th opens each row.
                    middle && 'bg-tint first-of-type:rounded-l-item last-of-type:rounded-r-item',
                    start &&
                        !end &&
                        'bg-linear-to-r from-50% from-transparent to-50% to-tint last-of-type:bg-none',
                    end &&
                        !start &&
                        'bg-linear-to-l from-50% from-transparent to-50% to-tint first-of-type:bg-none',
                ],
                // DayPicker's own classes for the cell: classNames.day and any modifiersClassNames.
                className,
            )}
            data-slot="calendar-day"
            {...props}
        />
    );
};

const dayButtonClass = [
    'relative inline-flex size-8 cursor-pointer select-none items-center justify-center rounded-item font-normal text-neutral-900 text-xs tabular-nums transition-[background-color,color] duration-150',
    'hover:bg-neutral-950/5 hover:text-neutral-950',
    // Neighbouring days sit flush, so the focused one is lifted above them to keep its ring whole.
    'focus-visible:z-10',
    focusRing,
    // Today is marked quietly: a medium weight and a dot that takes the text colour, whatever the fill.
    // The colour only on a plain day: on the action fill or the tint it would beat their own text colour.
    'data-today:font-medium data-today:not-data-chosen:not-data-range-middle:text-neutral-950',
    'data-today:after:-translate-x-1/2 data-today:after:absolute data-today:after:bottom-1 data-today:after:left-1/2 data-today:after:size-[3px] data-today:after:rounded-full data-today:after:bg-current',
    'data-outside:text-neutral-400',
    'data-range-middle:text-tint-fg data-range-middle:hover:bg-neutral-950/5',
    // The chosen day, and both ends of a range, take the one action colour.
    'data-chosen:bg-action data-chosen:text-on-action data-chosen:shadow-action data-chosen:[background-image:var(--action-gradient)]',
    'data-chosen:hover:bg-action-hover data-chosen:hover:text-on-action data-chosen:hover:[background-image:none]',
    // DayPicker keeps the focused disabled day focusable through aria-disabled instead of disabled.
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
];

const CalendarDayButton = ({ day, modifiers, className, ...props }: DayButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);

    // DayPicker moves focus by flagging a day; the button has to take it, as the stock one does.
    useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const chosen = modifiers.selected && !modifiers.range_middle ? true : undefined;

    return (
        <button
            className={cn(dayButtonClass, className)}
            data-chosen={chosen}
            data-outside={day.outside || undefined}
            data-range-middle={modifiers.range_middle || undefined}
            data-slot="calendar-day-button"
            data-today={modifiers.today || undefined}
            ref={ref}
            {...props}
        />
    );
};

const CalendarChevron = ({ className, orientation, disabled: _disabled }: ChevronProps) => {
    const Icon =
        orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : ChevronDown;
    return <Icon aria-hidden className={cn('size-4', className)} strokeWidth={2} />;
};

const CalendarRoot = ({ rootRef, className, ...props }: RootProps) => (
    <div className={className} data-slot="calendar" ref={rootRef} {...props} />
);

/** A month grid for picking a day or a range, on react-day-picker; weeks start on Monday (en-GB). */
export const Calendar = ({
    className,
    classNames,
    components,
    locale = enGB,
    showOutsideDays = true,
    ...props
}: CalendarProps) => (
    <DayPicker
        className={cn('relative w-fit text-xs', className)}
        classNames={{
            months: 'flex gap-6',
            month: 'flex flex-col gap-3',
            // One bar over all months: previous on the far left, next on the far right, level with the captions.
            nav: 'pointer-events-none absolute inset-x-0 top-0 z-10 flex h-7 items-center justify-between',
            button_previous: cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'pointer-events-auto',
            ),
            button_next: cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'pointer-events-auto',
            ),
            month_caption: 'flex h-7 items-center justify-center px-8',
            caption_label:
                'flex select-none items-center gap-1 font-medium text-neutral-950 text-sm [&_svg]:text-neutral-600',
            dropdowns: 'flex items-center gap-1.5',
            dropdown_root:
                'relative rounded-chip has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-offset-2',
            // The native select sits invisibly over the label, so the platform's own picker opens.
            dropdown: 'absolute inset-0 cursor-pointer opacity-0',
            // Separate borders let the rows breathe while a range strip still runs across each week.
            month_grid: 'border-separate border-spacing-x-0 border-spacing-y-0.5',
            weekday: 'h-7 w-8 select-none p-0 font-normal text-neutral-500 text-xxs',
            week_number_header: 'w-8 select-none font-normal text-neutral-500 text-xxs',
            week_number: 'w-8 select-none text-center text-neutral-500 text-xxs tabular-nums',
            footer: 'pt-3 text-neutral-600 text-xs',
            hidden: 'invisible',
            ...classNames,
        }}
        components={{
            Root: CalendarRoot,
            Chevron: CalendarChevron,
            Day: CalendarDay,
            DayButton: CalendarDayButton,
            ...components,
        }}
        locale={locale}
        showOutsideDays={showOutsideDays}
        {...props}
    />
);
