'use client';

import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { ThemeScope } from './theme';

export type ToastProviderProps = {
    children?: ReactNode;
    /** How long a toast stays, in ms; 0 keeps it until it is closed. */
    timeout?: number;
    /** How many show at once; older ones leave first. */
    limit?: number;
    /** Where the toasts are portalled; the body by default. */
    container?: HTMLElement | null;
    /** Classes for the stack; lift it with `bottom-*` where a bottom bar sits below. */
    viewportClassName?: string;
};

/**
 * Holds the toasts for everything inside it and draws them, centred at the foot of the screen.
 * Raise one from anywhere below it with `useToast().add({ title, type, actionProps })`.
 */
export const ToastProvider = ({
    children,
    timeout = 5000,
    limit = 3,
    container,
    viewportClassName,
}: ToastProviderProps) => (
    <ToastPrimitive.Provider limit={limit} timeout={timeout}>
        {children}
        <ToastPrimitive.Portal container={container}>
            <ThemeScope>
                <ToastPrimitive.Viewport
                    className={cn(
                        // Centred with margins, so the toasts' entry can own translate.
                        'fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit max-w-[calc(100%-32px)] flex-col items-center gap-2 outline-none',
                        viewportClassName,
                    )}
                    data-slot="toast-viewport"
                >
                    <ToastList />
                </ToastPrimitive.Viewport>
            </ThemeScope>
        </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
);

/** The toast manager: `add`, `close`, `update` and `promise`, and the toasts showing now. */
export const useToast = ToastPrimitive.useToastManager;

const typeIcons: Record<string, ReactNode> = {
    success: <CircleCheck className="text-success-500" strokeWidth={2} />,
    error: <CircleAlert className="text-error-500" strokeWidth={2} />,
};

/** Per-toast options, passed as `data` to `add`. */
export type ToastData = {
    /**
     * `bar` keeps it to one 34px line; `stacked` gives the description its own lines and the action
     * a row under it. Left out, a description longer than a short phrase stacks.
     */
    layout?: 'bar' | 'stacked';
};

/** Longer than this, a description reads as a sentence and gets lines of its own. */
const SHORT_DESCRIPTION = 40;

const isStacked = (toast: { description?: ReactNode; data?: ToastData }) => {
    if (toast.data?.layout) return toast.data.layout === 'stacked';
    const { description } = toast;
    if (description === undefined || description === null || description === false) return false;
    return typeof description !== 'string' || description.length > SHORT_DESCRIPTION;
};

// Ghost buttons on the inverse surface: the wash is the surface's own text colour, faintly.
const actionClass = cn(
    'inline-flex h-[26px] shrink-0 cursor-pointer items-center rounded-chip px-2 font-medium text-neutral-50 transition-[background-color] duration-150 hover:bg-neutral-50/15',
    focusRing,
);

const closeClass = cn(
    'inline-flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-chip opacity-70 transition-[background-color,opacity] duration-150 hover:bg-neutral-50/15 hover:opacity-100 [&_svg]:size-3.5',
    focusRing,
);

const ToastList = () => {
    const { toasts } = useToast<ToastData>();

    return toasts.map(toast => {
        const stacked = isStacked(toast);
        const icon = toast.type ? typeIcons[toast.type] : undefined;

        return (
            <ToastPrimitive.Root
                className={cn(
                    // The tooltip's inverse surface, floating.
                    'flex max-w-full rounded-item bg-neutral-950 text-neutral-50 text-xs shadow-float',
                    stacked
                        ? // A sentence wraps at a reading width; the close stays level with the title.
                          'w-[360px] items-start gap-2.5 py-3 pr-2 pl-3'
                        : // One line at the control row's height.
                          'h-[34px] items-center gap-2 pr-1 pl-3',
                    'transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-none',
                    'data-ending-style:translate-y-2 data-starting-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:opacity-0',
                    // Past the limit, the oldest steps out rather than piling up.
                    'data-limited:hidden',
                    '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                )}
                data-layout={stacked ? 'stacked' : 'bar'}
                data-slot="toast"
                key={toast.id}
                swipeDirection="down"
                toast={toast}
            >
                {icon && (stacked ? <span className="flex h-4 items-center">{icon}</span> : icon)}
                {stacked ? (
                    <ToastPrimitive.Content className="flex min-w-0 flex-1 flex-col gap-1">
                        <ToastPrimitive.Title className="font-medium" data-slot="toast-title" />
                        <ToastPrimitive.Description
                            className="leading-[1.45] opacity-70"
                            data-slot="toast-description"
                        />
                        {/* Under the text, pulled out by its padding so its label lines up with it. */}
                        <ToastPrimitive.Action
                            className={cn(actionClass, 'mt-1.5 -ml-2 self-start')}
                            data-slot="toast-action"
                        />
                    </ToastPrimitive.Content>
                ) : (
                    <>
                        <ToastPrimitive.Content className="flex min-w-0 items-baseline gap-1.5">
                            <ToastPrimitive.Title
                                className="truncate font-medium"
                                data-slot="toast-title"
                            />
                            <ToastPrimitive.Description
                                className="truncate opacity-70"
                                data-slot="toast-description"
                            />
                        </ToastPrimitive.Content>
                        <ToastPrimitive.Action
                            className={cn(actionClass, 'ml-1')}
                            data-slot="toast-action"
                        />
                    </>
                )}
                <ToastPrimitive.Close
                    aria-label="Dismiss"
                    className={cn(closeClass, stacked && '-my-[5px]')}
                    data-slot="toast-close"
                >
                    <X strokeWidth={2} />
                </ToastPrimitive.Close>
            </ToastPrimitive.Root>
        );
    });
};
