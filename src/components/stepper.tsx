'use client';

import { cva } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

type Orientation = 'horizontal' | 'vertical';

export type StepStatus = 'done' | 'current' | 'upcoming';

type StepperContextValue = {
    orientation: Orientation;
    value?: number;
    onValueChange?: (step: number) => void;
};

const StepperContext = createContext<StepperContextValue>({ orientation: 'horizontal' });

export type StepperProps = ComponentProps<'ol'> & {
    /** A row over the form, or a column beside a long one. */
    orientation?: Orientation;
    /** The current step's number; the steps before it are done, the ones after it upcoming. */
    value?: number;
    /** Makes every done step a button that goes back to it. */
    onValueChange?: (step: number) => void;
};

/**
 * The steps of a long form: what is done, where you are and what is left. Give it the current step
 * as `value` and each item works out its own status; an item's `status` still wins, for forms whose
 * steps are not done in order. A horizontal stepper gives way as it narrows rather than truncating:
 * under 576px only the current step keeps its description, under 448px only its label.
 */
export const Stepper = ({
    orientation = 'horizontal',
    value,
    onValueChange,
    className,
    ...props
}: StepperProps) => (
    <StepperContext.Provider value={{ orientation, value, onValueChange }}>
        <ol
            className={cn(
                'flex min-w-0',
                orientation === 'horizontal'
                    ? // A row measures itself, so its labels can give way when it is narrow.
                      '@container/stepper w-full items-center gap-3'
                    : 'flex-col',
                className,
            )}
            data-orientation={orientation}
            data-slot="stepper"
            {...props}
        />
    </StepperContext.Provider>
);

/*
 * Where you are is the loudest mark. Done steps fill with the action colour and a tick, as a checked
 * checkbox does; the current one keeps a hairline in the action colour and wears the selection wash
 * as a halo; upcoming steps are a faint hairline. The pill token rounds it, so a square theme
 * squares it as it does a chip.
 */
export const stepMarkerVariants = cva(
    [
        'relative z-10 inline-flex size-[22px] shrink-0 items-center justify-center rounded-pill border font-medium text-xxs tabular-nums',
        'transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none [&_svg]:size-3.5',
    ],
    {
        variants: {
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
                status: 'done',
                invalid: false,
                className:
                    'border-transparent bg-action text-on-action [background-image:var(--action-gradient)]',
            },
            {
                status: 'current',
                invalid: false,
                className: 'border-action bg-neutral-50 text-neutral-950',
            },
            {
                status: 'upcoming',
                invalid: false,
                className: 'border-neutral-300 bg-neutral-50 text-neutral-500',
            },
        ],
        defaultVariants: { status: 'upcoming', invalid: false },
    },
);

const statusText: Record<StepStatus, string> = {
    done: 'done',
    current: 'current step',
    upcoming: 'not started',
};

export type StepperItemProps = Omit<ComponentProps<'li'>, 'title' | 'onClick'> & {
    /** The step's number, shown in its marker until it is done. */
    step: number;
    label: ReactNode;
    /** A line under the label: what the step asks for, what was answered, or what needs fixing. */
    description?: ReactNode;
    /** Worked out from the stepper's `value` when left out. */
    status?: StepStatus;
    /** Something in this step needs fixing: the marker, number and description turn to the error ramp. */
    invalid?: boolean;
    /** Makes the step a button; done steps get one from the stepper's `onValueChange` already. */
    onSelect?: () => void;
    /** In a vertical stepper, what the step holds, under its label: its fields while it is current. */
    children?: ReactNode;
};

/** One step: its marker, label and description, and the line to the next step. */
export const StepperItem = ({
    step,
    label,
    description,
    status: statusProp,
    invalid = false,
    onSelect: onSelectProp,
    className,
    children,
    ...props
}: StepperItemProps) => {
    const { orientation, value, onValueChange } = useContext(StepperContext);
    const horizontal = orientation === 'horizontal';
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
            className={cn('flex min-w-0 flex-col', !horizontal && 'gap-0.5 pt-0.5', collapse)}
            data-slot="stepper-text"
        >
            <span
                className={cn(
                    'truncate text-xs',
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

    const content = (
        <>
            <span className={stepMarkerVariants({ status, invalid })} data-slot="stepper-marker">
                {status === 'done' && !invalid ? <Check aria-hidden strokeWidth={2} /> : step}
            </span>
            {text}
        </>
    );

    const head = cn(
        'flex min-w-0 text-left',
        horizontal ? 'items-center gap-2' : 'items-start gap-3',
    );

    return (
        <li
            aria-current={status === 'current' ? 'step' : undefined}
            className={cn(
                'group/step relative flex min-w-0',
                horizontal
                    ? 'flex-auto items-center gap-3 last:flex-none'
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
                        // A step to go back to: the nav row's wash, pulled out so the marker stays in line.
                        '-m-1.5 cursor-pointer rounded-item p-1.5 transition-[background-color] duration-150 hover:bg-neutral-950/5',
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
            {!horizontal && children && (
                // Indented to the label: the marker's 22px and the 12px gap beside it.
                <div className="min-w-0 pt-4 pl-[34px]" data-slot="stepper-content">
                    {children}
                </div>
            )}
            <span
                aria-hidden
                className={cn(
                    'group-last/step:hidden',
                    // A finished stretch fills with the action colour, as a slider's track does.
                    status === 'done' ? 'bg-action' : 'bg-neutral-200',
                    horizontal
                        ? 'h-px min-w-6 flex-1'
                        : // From under the current step's halo to the next marker.
                          'absolute top-[29px] bottom-[7px] left-[10.5px] w-px',
                )}
                data-slot="stepper-connector"
            />
        </li>
    );
};
