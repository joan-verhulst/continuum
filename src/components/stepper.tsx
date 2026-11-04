'use client';

import { cva } from 'class-variance-authority';
import { Check } from 'lucide-react';
import {
    type ComponentProps,
    type CSSProperties,
    createContext,
    type ReactNode,
    useContext,
} from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

type Orientation = 'horizontal' | 'vertical';

export type StepStatus = 'done' | 'current' | 'upcoming';

/**
 * How a step is marked. `number` and `dot` are small round marks on a hairline, `icon` a bordered
 * square holding the step's own icon, `line` a bar under each label with no rule between them.
 */
export type StepperMarker = 'number' | 'dot' | 'icon' | 'line';

/** In a row: the text centred under its marker, or beside it. */
export type StepperLayout = 'centered' | 'inline';

type StepperContextValue = {
    orientation: Orientation;
    layout: StepperLayout;
    marker: StepperMarker;
    value?: number;
    onValueChange?: (step: number) => void;
};

const StepperContext = createContext<StepperContextValue>({
    orientation: 'horizontal',
    layout: 'inline',
    marker: 'number',
});

// The marker's size drives the rule's geometry, so every marker lines up the same way.
const markerSize: Record<StepperMarker, string> = {
    number: '22px',
    dot: '22px',
    icon: '32px',
    line: '4px',
};

export type StepperProps = ComponentProps<'ol'> & {
    /** A row over the form, or a column beside a long one. */
    orientation?: Orientation;
    /** In a row, the text beside each marker (the default) or centred under it. */
    layout?: StepperLayout;
    /** How each step is marked; see `StepperMarker`. */
    marker?: StepperMarker;
    /** The current step's number; the steps before it are done, the ones after it upcoming. */
    value?: number;
    /** Makes every done step a button that goes back to it. */
    onValueChange?: (step: number) => void;
};

/**
 * The steps of a long form: what is done, where you are and what is left. Give it the current step
 * as `value` and each item works out its own status; an item's `status` still wins, for forms whose
 * steps are not done in order. A row gives way as it narrows rather than truncating: under 576px
 * only the current step keeps its description, under 448px only its label.
 */
export const Stepper = ({
    orientation = 'horizontal',
    layout = 'inline',
    marker = 'number',
    value,
    onValueChange,
    className,
    style,
    ...props
}: StepperProps) => {
    const horizontal = orientation === 'horizontal';

    return (
        <StepperContext.Provider value={{ orientation, layout, marker, value, onValueChange }}>
            <ol
                className={cn(
                    'flex min-w-0',
                    horizontal
                        ? // A row measures itself, so its labels can give way when it is narrow.
                          cn(
                              '@container/stepper w-full',
                              marker === 'line'
                                  ? 'items-start gap-2'
                                  : layout === 'centered'
                                    ? 'items-start'
                                    : 'items-center gap-1',
                          )
                        : cn('flex-col', marker === 'line' && 'gap-1'),
                    className,
                )}
                data-layout={horizontal ? layout : undefined}
                data-marker={marker}
                data-orientation={orientation}
                data-slot="stepper"
                style={{ '--marker': markerSize[marker], ...style } as CSSProperties}
                {...props}
            />
        </StepperContext.Provider>
    );
};

/*
 * The way travelled is drawn in the action colour. Done numbers and dots fill with it and a tick, a
 * done icon keeps a plain hairline with its icon at full strength, the current step keeps an action
 * hairline and wears the selection wash as a halo. Rules and bars behind a done step take the action
 * colour too. Upcoming steps are a faint hairline. Round marks take the pill token and the icon
 * square the control radius, so a square theme squares them as it does a chip.
 */
export const stepMarkerVariants = cva(
    [
        'relative z-10 inline-flex shrink-0 items-center justify-center border font-medium text-xxs tabular-nums',
        'transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none',
    ],
    {
        variants: {
            marker: {
                number: 'size-[22px] rounded-pill [&_svg]:size-3.5',
                dot: 'size-[22px] rounded-pill [&_svg]:size-3.5',
                icon: 'size-8 rounded-control [&_svg]:size-4',
            },
            status: {
                done: '',
                current: 'ring-[3px] ring-tint',
                upcoming: '',
            },
            // Outranks the status's colours: a step that needs fixing reads as that first.
            invalid: {
                true: 'border-error-500 bg-neutral-50 text-error-600',
                false: '',
            },
        },
        compoundVariants: [
            {
                marker: ['number', 'dot'],
                status: 'done',
                invalid: false,
                className: 'border-transparent bg-action text-on-action',
            },
            {
                marker: 'icon',
                status: 'done',
                invalid: false,
                className: 'border-neutral-300 bg-neutral-50 text-neutral-950',
            },
            {
                marker: ['number', 'icon'],
                status: 'current',
                invalid: false,
                className: 'border-action bg-neutral-50 text-action',
            },
            {
                marker: 'dot',
                status: 'current',
                invalid: false,
                className: 'border-action bg-neutral-50 text-action',
            },
            {
                marker: 'number',
                status: 'upcoming',
                invalid: false,
                className: 'border-neutral-300 bg-neutral-50 text-neutral-500',
            },
            {
                marker: 'dot',
                status: 'upcoming',
                invalid: false,
                className: 'border-neutral-300 bg-neutral-50 text-neutral-300',
            },
            {
                marker: 'icon',
                status: 'upcoming',
                invalid: false,
                className: 'border-neutral-200 bg-neutral-50 text-neutral-400',
            },
        ],
        defaultVariants: { marker: 'number', status: 'upcoming', invalid: false },
    },
);

const statusText: Record<StepStatus, string> = {
    done: 'done',
    current: 'current step',
    upcoming: 'not started',
};

export type StepperItemProps = Omit<ComponentProps<'li'>, 'title' | 'onClick'> & {
    /** The step's number, shown in a `number` marker until it is done. */
    step: number;
    label: ReactNode;
    /** A line under the label: what the step asks for, what was answered, or what needs fixing. */
    description?: ReactNode;
    /** The 16px icon an `icon` marker holds; without one it shows the step's number. */
    icon?: ReactNode;
    /** Worked out from the stepper's `value` when left out. */
    status?: StepStatus;
    /** How far through the current step is, 0 to 1, for a `line` marker's bar. Full when left out. */
    progress?: number;
    /** Something in this step needs fixing: the marker, number and description turn to the error ramp. */
    invalid?: boolean;
    /** Makes the step a button; done steps get one from the stepper's `onValueChange` already. */
    onSelect?: () => void;
    /** In a vertical stepper, what the step holds, under its label: its fields while it is current. */
    children?: ReactNode;
};

/** One step: its marker, label and description, and the rule to the next step. */
export const StepperItem = ({
    step,
    label,
    description,
    icon,
    status: statusProp,
    progress,
    invalid = false,
    onSelect: onSelectProp,
    className,
    children,
    ...props
}: StepperItemProps) => {
    const { orientation, layout, marker, value, onValueChange } = useContext(StepperContext);
    const horizontal = orientation === 'horizontal';
    const line = marker === 'line';
    const centered = horizontal && !line && layout === 'centered';
    const status: StepStatus =
        statusProp ??
        (value === undefined
            ? 'upcoming'
            : step < value
              ? 'done'
              : step === value
                ? 'current'
                : 'upcoming');
    const onSelect =
        onSelectProp ??
        (onValueChange && status === 'done' ? () => onValueChange(step) : undefined);

    // Narrow, a row keeps the current step's label; the others stay for screen readers only.
    const collapse = horizontal && status !== 'current' && '@max-md/stepper:sr-only';

    const text = (
        <span
            className={cn(
                'flex min-w-0 flex-col',
                centered && 'w-full items-center px-2 text-center',
                // Beside a column's marker, the first line centres on it.
                !horizontal && !line && 'gap-0.5 pt-[calc((var(--marker)-16.25px)/2)]',
                // Clear of the bar, which runs the whole step at the column's edge.
                !horizontal && line && 'gap-0.5 py-1 pl-4',
                collapse,
            )}
            data-slot="stepper-text"
        >
            <span
                className={cn(
                    'max-w-full truncate text-xs',
                    status === 'upcoming' ? 'text-neutral-600' : 'font-medium text-neutral-950',
                )}
                data-slot="stepper-label"
            >
                {label}
                <span className="sr-only">
                    , {statusText[status]}
                    {invalid && ', needs attention'}
                </span>
            </span>
            {description && (
                <span
                    className={cn(
                        'max-w-full',
                        invalid ? 'text-error-600' : 'text-neutral-500',
                        horizontal ? 'truncate text-xxs' : 'text-xs',
                        // Before any label truncates, the other steps let go of their descriptions.
                        horizontal && status !== 'current' && !invalid && '@max-xl/stepper:hidden',
                    )}
                    data-slot="stepper-description"
                >
                    {description}
                </span>
            )}
        </span>
    );

    const fill = status === 'done' ? 1 : status === 'current' ? (progress ?? 1) : 0;

    const mark = line ? (
        // A bar per step, over its label so the bars stay in line whatever the text: done full, the
        // current one as far as it has got, upcoming empty.
        <span
            aria-hidden
            className={cn(
                'relative shrink-0 overflow-hidden rounded-pill',
                invalid ? 'bg-error-500/25' : 'bg-neutral-200',
                horizontal ? 'h-1 w-full' : 'absolute inset-y-0 left-0 w-1',
            )}
            data-slot="stepper-bar"
        >
            <span
                className={cn(
                    'absolute inset-0 rounded-pill transition-transform duration-300 motion-reduce:transition-none',
                    invalid ? 'bg-error-500' : 'bg-action',
                    horizontal ? 'origin-left' : 'origin-top',
                )}
                style={{ transform: horizontal ? `scaleX(${fill})` : `scaleY(${fill})` }}
            />
        </span>
    ) : (
        <span
            className={stepMarkerVariants({ marker, status, invalid })}
            data-slot="stepper-marker"
        >
            {status === 'done' && !invalid && marker !== 'icon' ? (
                <Check aria-hidden strokeWidth={2} />
            ) : marker === 'dot' ? (
                <span
                    aria-hidden
                    className={cn(
                        'rounded-full bg-current',
                        status === 'current' ? 'size-2' : 'size-1.5',
                    )}
                />
            ) : marker === 'icon' && icon ? (
                icon
            ) : (
                step
            )}
        </span>
    );

    const head = cn(
        'flex min-w-0 text-left',
        line
            ? horizontal
                ? 'w-full flex-col gap-2.5'
                : ''
            : centered
              ? 'w-full flex-col items-center gap-3'
              : horizontal
                ? // The padding is real, so a done step's wash stays inside the row's edges.
                  'items-center gap-2 rounded-item px-2.5 py-1.5'
                : 'items-start gap-3',
    );

    // A column's bar sits on the step itself, so it runs past the label down the step's fields.
    const barOnStep = line && !horizontal;
    const content = (
        <>
            {!barOnStep && mark}
            {text}
        </>
    );

    return (
        <li
            aria-current={status === 'current' ? 'step' : undefined}
            className={cn(
                'group/step relative flex min-w-0',
                line
                    ? horizontal
                        ? 'flex-1'
                        : 'flex-col'
                    : centered
                      ? 'flex-1 flex-col items-center'
                      : horizontal
                        ? 'flex-auto items-center gap-1 last:flex-none'
                        : // The column's rule runs from under this marker to the next one.
                          'flex-col pb-6 last:pb-0',
                className,
            )}
            data-invalid={invalid || undefined}
            data-slot="stepper-item"
            data-status={status}
            {...props}
        >
            {onSelect ? (
                <button
                    className={cn(
                        head,
                        'cursor-pointer rounded-item duration-150',
                        centered || (line && horizontal)
                            ? // Under a centred column a wash turns into a block, so the step only fades.
                              'transition-opacity hover:opacity-70'
                            : cn(
                                  'transition-[background-color] hover:bg-neutral-950/5',
                                  // In a column, the nav row's wash is pulled out so the marker stays on its rule.
                                  !horizontal && '-mx-2.5 -my-1.5 px-2.5 py-1.5',
                              ),
                        focusRing,
                    )}
                    data-slot="stepper-button"
                    onClick={onSelect}
                    type="button"
                >
                    {content}
                </button>
            ) : (
                <div className={head}>{content}</div>
            )}
            {barOnStep && mark}
            {!horizontal && children && (
                // Indented to the label: the marker and the 12px gap beside it.
                <div
                    className={cn('min-w-0 pl-[calc(var(--marker)+12px)]', line ? 'pt-2' : 'pt-4')}
                    data-slot="stepper-content"
                >
                    {children}
                </div>
            )}
            {!line && (
                <span
                    aria-hidden
                    className={cn(
                        'group-last/step:hidden',
                        // A finished stretch is drawn in the action colour, the stretches still to go faint.
                        status === 'done' ? 'bg-action' : 'bg-neutral-200',
                        centered
                            ? // From beside this marker to beside the next, 8px clear of each.
                              'absolute top-[calc(var(--marker)/2)] left-[calc(50%+var(--marker)/2+8px)] h-px w-[calc(100%-var(--marker)-16px)]'
                            : horizontal
                              ? 'h-px min-w-6 flex-1'
                              : // From under the current step's halo to the next marker.
                                'absolute top-[calc(var(--marker)+7px)] bottom-[7px] left-[calc(var(--marker)/2-0.5px)] w-px',
                    )}
                    data-slot="stepper-connector"
                />
            )}
        </li>
    );
};
