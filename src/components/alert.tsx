import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

/*
 * A notice is a hairline card like any other. Its tone sits in the icon's well, the badge's two
 * colours from one ramp (a 500 wash at 20%, the glyph at 600), so the state reads at a glance
 * while the box stays quiet: a coloured box would make every notice the loudest thing on the page.
 */
export const alertVariants = cva(
    '@container/alert flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2.5 rounded-item border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs',
    {
        variants: {
            tone: {
                neutral:
                    '[&>[data-slot=alert-icon]]:bg-neutral-950/5 [&>[data-slot=alert-icon]]:text-neutral-600',
                primary:
                    '[&>[data-slot=alert-icon]]:bg-primary-500/20 [&>[data-slot=alert-icon]]:text-primary-600',
                success:
                    '[&>[data-slot=alert-icon]]:bg-success-500/20 [&>[data-slot=alert-icon]]:text-success-600',
                warning:
                    '[&>[data-slot=alert-icon]]:bg-warning-500/20 [&>[data-slot=alert-icon]]:text-warning-600',
                error: '[&>[data-slot=alert-icon]]:bg-error-500/20 [&>[data-slot=alert-icon]]:text-error-600',
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
    // A title alone is one line, so the alert slims to it: a 24px well and less space above and below.
    const slim = !children;

    return (
        <div
            className={cn(alertVariants({ tone }), slim && 'py-2', className)}
            data-slot="alert"
            data-tone={tone ?? 'neutral'}
            role={tone === 'error' ? 'alert' : 'status'}
            {...props}
        >
            {icon !== false && (
                // A 32px well, the size of an icon tile, so the tone shows before the words are read.
                // 24px beside a title alone.
                <span
                    aria-hidden
                    className={cn(
                        'flex shrink-0 items-center justify-center rounded-chip [&_svg:not([class*=size-])]:size-4',
                        slim ? 'size-6' : 'size-8',
                    )}
                    data-slot="alert-icon"
                >
                    {icon ?? <Icon strokeWidth={2} />}
                </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5" data-slot="alert-text">
                <p className="font-medium text-neutral-950">{title}</p>
                {children && <div className="text-neutral-600">{children}</div>}
            </div>
            {onDismiss && (
                // Before the action in the source, so a wrapped action leaves the × at the top right. Pulled
                // out by its own inset, so its glyph sits as far from the edge as the icon well.
                <Button
                    aria-label="Dismiss"
                    className="order-2 -my-1 -me-1.5 self-start"
                    data-slot="alert-dismiss"
                    onClick={onDismiss}
                    size="icon-sm"
                    variant="ghost"
                >
                    <X strokeWidth={2} />
                </Button>
            )}
            {action && (
                // Beside the words while the alert has 384px inside; narrower, it takes a line of its own
                // under them, in line with the title, rather than squeezing them.
                <div
                    className={cn(
                        '@max-sm/alert:order-3 order-1 flex shrink-0 @max-sm/alert:basis-full items-center gap-2',
                        icon !== false && (slim ? '@max-sm/alert:ps-9' : '@max-sm/alert:ps-11'),
                    )}
                    data-slot="alert-action"
                >
                    {action}
                </div>
            )}
        </div>
    );
};
