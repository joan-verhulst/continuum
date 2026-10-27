import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

/*
 * A notice is a hairline card like any other; only its icon carries the tone, at 600 as a delta's
 * glyph does. A coloured box would turn every notice into the loudest thing on the page.
 */
export const alertVariants = cva(
    'flex min-w-0 items-start gap-3 rounded-item border border-neutral-200 bg-neutral-50 p-3 text-xs',
    {
        variants: {
            tone: {
                neutral: '[&>[data-slot=alert-icon]]:text-neutral-600',
                primary: '[&>[data-slot=alert-icon]]:text-primary-600',
                success: '[&>[data-slot=alert-icon]]:text-success-600',
                warning: '[&>[data-slot=alert-icon]]:text-warning-600',
                error: '[&>[data-slot=alert-icon]]:text-error-600',
            },
        },
        defaultVariants: { tone: 'neutral' },
    },
);

const toneIcons = {
    neutral: Info,
    primary: Info,
    success: CircleCheck,
    warning: TriangleAlert,
    error: CircleAlert,
} as const;

export type AlertProps = Omit<ComponentProps<'div'>, 'title'> &
    VariantProps<typeof alertVariants> & {
        /** What happened or what to know, in a line. */
        title: ReactNode;
        /** Replaces the tone's icon; `false` leaves it out. */
        icon?: ReactNode | false;
        /** Buttons at the end of the row: the fix ("Update card") rather than a link to read about it. */
        action?: ReactNode;
        /** Shows a ghost × that calls this. */
        onDismiss?: () => void;
    };

/**
 * An inline notice on a page or in a form: info, success, warning or error. The title says it,
 * the children explain it in a sentence, and the action fixes it. An error is announced at once;
 * the other tones wait their turn.
 */
export const Alert = ({
    tone,
    title,
    icon,
    action,
    onDismiss,
    className,
    children,
    ...props
}: AlertProps) => {
    const Icon = toneIcons[tone ?? 'neutral'];

    return (
        <div
            className={cn(alertVariants({ tone }), className)}
            data-slot="alert"
            data-tone={tone ?? 'neutral'}
            role={tone === 'error' ? 'alert' : 'status'}
            {...props}
        >
            {icon !== false && (
                <span
                    aria-hidden
                    className="flex h-4 shrink-0 items-center [&_svg:not([class*=size-])]:size-4"
                    data-slot="alert-icon"
                >
                    {icon ?? <Icon strokeWidth={2} />}
                </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5" data-slot="alert-text">
                <p className="font-medium text-neutral-950">{title}</p>
                {children && <div className="text-neutral-600">{children}</div>}
            </div>
            {action && (
                // The 34px buttons sit centred on the row, reaching into its padding rather than growing it.
                <div
                    className="-my-1.5 flex shrink-0 items-center gap-2 self-center"
                    data-slot="alert-action"
                >
                    {action}
                </div>
            )}
            {onDismiss && (
                <Button
                    aria-label="Dismiss"
                    className="-m-1.5"
                    data-slot="alert-dismiss"
                    onClick={onDismiss}
                    size="icon-sm"
                    variant="ghost"
                >
                    <X strokeWidth={2} />
                </Button>
            )}
        </div>
    );
};
