import { Check } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Progress } from './progress';

export type ChecklistProps = Omit<ComponentProps<'section'>, 'title'> & {
    title: ReactNode;
    /** Steps done, for the count and the bar. */
    completed: number;
    total: number;
    /** Trailing in the header, such as a ghost "Dismiss" once everything is done. */
    action?: ReactNode;
};

/**
 * Onboarding steps in a card: how far along you are, then the steps, the next one open with its
 * action. Steps tick off as their work gets done elsewhere, so the list is a guide, not a form.
 */
export const Checklist = ({
    title,
    completed,
    total,
    action,
    className,
    children,
    ...props
}: ChecklistProps) => (
    <section
        className={cn(
            'flex min-w-0 flex-col gap-4 rounded-card border border-neutral-200 bg-neutral-50 p-4',
            className,
        )}
        data-slot="checklist"
        {...props}
    >
        <div className="flex flex-col gap-3" data-slot="checklist-header">
            <div className="flex min-h-control items-center gap-3">
                <h3 className="min-w-0 flex-1 truncate font-medium text-neutral-950 text-sm">
                    {title}
                </h3>
                <span
                    className="shrink-0 text-neutral-600 text-xs tabular-nums"
                    data-slot="checklist-count"
                >
                    {completed} of {total}
                </span>
                {action}
            </div>
            <Progress
                aria-label={`${completed} of ${total} steps done`}
                max={total}
                tone={completed === total ? 'success' : undefined}
                value={completed}
            />
        </div>
        {/* Pulled out by the rows' own padding, so a row's text lines up with the title above. */}
        <ol className="-mx-2 flex flex-col gap-0.5" data-slot="checklist-items">
            {children}
        </ol>
    </section>
);

export type ChecklistItemProps = Omit<ComponentProps<'li'>, 'title'> & {
    title: ReactNode;
    /** What it gets you, in a line; shown while the step is the open one. */
    description?: ReactNode;
    done?: boolean;
    /** The next step: opened, with its description and action, on the selection wash. */
    current?: boolean;
    /** What does the step, usually a Button; shown while the step is the open one. */
    action?: ReactNode;
};

const revealClass =
    'transition-[opacity,translate] delay-60 duration-250 ease-out-strong starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0';

/** One step: a round tick, its title, and while it is the next one, a line and the action that does it. */
export const ChecklistItem = ({
    title,
    description,
    done = false,
    current = false,
    action,
    className,
    ...props
}: ChecklistItemProps) => (
    <li
        aria-current={current ? 'step' : undefined}
        className={cn(
            'flex items-start gap-3 rounded-item px-2 py-2',
            current && 'bg-neutral-950/4 py-3',
            className,
        )}
        data-done={done || undefined}
        data-slot="checklist-item"
        {...props}
    >
        {/* The stepper's marker: filled with a tick when done, a hairline ring while open. */}
        <span
            className={cn(
                'mt-[-3px] inline-flex size-5.5 shrink-0 items-center justify-center rounded-pill border transition-[background-color,border-color] duration-200 ease-out-strong [&_svg]:size-3.5',
                done
                    ? 'border-transparent bg-action text-on-action [background-image:var(--action-gradient)]'
                    : current
                      ? 'border-action bg-neutral-50'
                      : 'border-neutral-500 bg-neutral-50',
            )}
            data-slot="checklist-marker"
        >
            {/* The tick grows in as the step is done; a first run is the place for it. */}
            {done && (
                <Check
                    aria-hidden
                    className="starting:scale-[0.5] starting:opacity-0 transition-[opacity,scale] duration-200 ease-out-strong motion-reduce:starting:scale-100"
                    strokeWidth={2}
                />
            )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p
                className={cn(
                    'text-xs',
                    done ? 'text-neutral-600' : 'font-medium text-neutral-950',
                )}
            >
                {title}
                <span className="sr-only">{done ? ', done' : current ? ', next' : ''}</span>
            </p>
            {/* The next step's line and action arrive just after the tick, drawing the eye down. */}
            {current && description && (
                <p className={cn('text-neutral-600 text-xs', revealClass)}>{description}</p>
            )}
            {current && action && (
                <div
                    className={cn('mt-2.5 flex flex-wrap gap-2', revealClass)}
                    data-slot="checklist-action"
                >
                    {action}
                </div>
            )}
        </div>
    </li>
);
