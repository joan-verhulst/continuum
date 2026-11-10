'use client';

import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { ArrowRight, CircleAlert, CircleCheck, Info, TriangleAlert, Undo2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { Theme, ThemeScope, useTheme } from './theme';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

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

/*
 * A layer above dialogs, menus and tooltips (z-50): a toast raised while a dialog is open reports on
 * what the dialog did, so it stands over the scrim rather than under it.
 */
const TOAST_LAYER = 'z-60';

/**
 * Holds the toasts for everything inside it and draws them in the bottom right corner, across the
 * foot on a phone. They pile up, the newest in front and the older ones peeking
 * over it; pointing at the pile fans it out. Raise one from anywhere below it with
 * `useToast().add({ title, description, type, actionProps })`; a `data.tab` makes it a folder card.
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
                        // The toasts stand on its foot, so it needs a width but no height.
                        'fixed right-6 bottom-6 w-toast outline-none max-sm:inset-x-4 max-sm:bottom-4 max-sm:w-auto',
                        TOAST_LAYER,
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

// The tones and glyphs of an Alert, so a toast of a type reads as an alert of that tone would.
const typeIcons: Record<string, ReactNode> = {
    primary: <Info strokeWidth={2} />,
    success: <CircleCheck strokeWidth={2} />,
    warning: <TriangleAlert strokeWidth={2} />,
    error: <CircleAlert strokeWidth={2} />,
};

// The well takes the badge's wash, its 500 at 20%, under the glyph at 700: a glyph needs 3:1 on
// it, which 700 reaches in every tone, where the badge's words need 4.5:1 and take 800.
const wellTones: Record<string, string> = {
    primary: 'bg-primary-500/20 text-primary-700',
    success: 'bg-success-500/20 text-success-700',
    warning: 'bg-warning-500/20 text-warning-700',
    error: 'bg-error-500/20 text-error-700',
    neutral: 'bg-neutral-500/20 text-neutral-700',
};

/** Per-toast options, passed as `data` to `add`. */
export type ToastData = {
    /**
     * A tab on top, like a folder's, saying what is going on ("Report archived", "Export in
     * progress"); the action moves into it beside the words.
     */
    tab?: string;
    /** A 16px icon, or a 36px picture of the thing, for the well, where a `type` has none of its own. */
    icon?: ReactNode;
    /** The action's icon; an undo arrow for an `undo` action, an arrow for anything else. Its label names it. */
    actionIcon?: ReactNode;
    /**
     * The action takes back what the toast reports, so it draws the undo arrow whatever its label
     * says ("Restore", "Ongedaan maken"). Left out, an action labelled "Undo" still counts as one.
     */
    undo?: boolean;
};
/*
 * The pile, from the variables Base UI sets on each toast. Collapsed, a toast behind the front one
 * takes its height, shrinks a tenth per place and rises 8px a place, so the older ones peek over
 * the front. Fanned out, each stands at its own offset with a 12px gap, and the gap is bridged so
 * the pointer can cross it without the pile closing.
 */
const pileClass = [
    '[--gap:12px] [--peek:8px] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
    '[--height:var(--toast-frontmost-height,var(--toast-height))]',
    '[--offset-y:calc(var(--toast-offset-y)*-1-var(--toast-index)*var(--gap)+var(--toast-swipe-movement-y))]',
    'group/toast absolute right-0 bottom-0 z-[calc(100-var(--toast-index))] flex w-full origin-bottom flex-col items-end',
    // Behind, it is cut to the front one's height; its top, a tab or a card's edge, is what shows.
    'h-(--height) overflow-hidden data-expanded:h-(--toast-height) data-expanded:overflow-visible',
    '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-var(--toast-index)*var(--peek)-var(--shrink)*var(--height)))_scale(var(--scale))]',
    'data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
    "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
    // It rises in from below and leaves the way it is swiped, or back down.
    'data-starting-style:[transform:translateY(24px)] data-starting-style:opacity-0',
    'data-ending-style:opacity-0 [&[data-ending-style]:not([data-swipe-direction])]:[transform:translateY(24px)]',
    'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+100%))]',
    'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+100%))]',
    // Past the limit, the oldest fades out of the back of the pile.
    'data-limited:opacity-0',
    '[transition:transform_400ms_var(--ease-out-strong),opacity_400ms,height_150ms] motion-reduce:transition-none',
];

// What a toast says shows only at the front of the pile or once it fans out; behind, just its shape.
const faceClass =
    'opacity-[calc(1-min(var(--toast-index),1))] transition-opacity duration-200 group-data-expanded/toast:opacity-100';

// The surface, a hairline round it, in the mode opposite the page's (see ToastList).
const surfaceClass = 'border border-neutral-200 bg-neutral-50 text-neutral-950 text-xs';

// A 36px square on the card: the ×, and the action when there is no tab to hold it.
const squareClass = cn(
    'inline-flex size-option shrink-0 cursor-pointer items-center justify-center rounded-item text-neutral-600 transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-950 [&_svg]:size-4',
    focusRing,
    faceClass,
);

// Past these, a title or description wraps in the 360px card.
const LONG_TITLE = 32;
const LONG_DESCRIPTION = 44;

type ListedToast = ToastPrimitive.Root.ToastObject<ToastData>;

/**
 * The action as an icon, named in a tooltip, since Base UI's own action always shows its label.
 * In a tab it sits in the line of text and only darkens and lightens, as a word would; on the
 * card it is a 36px square beside the ×.
 */
const ToastActionIcon = ({ toast, inTab }: { toast: ListedToast; inTab: boolean }) => {
    const { children: label, ...actionProps } = toast.actionProps ?? {};
    if (!label) return null;

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        {...actionProps}
                        aria-label={typeof label === 'string' ? label : undefined}
                        className={
                            inTab
                                ? cn(
                                      '-my-0.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-chip text-neutral-950 transition-colors duration-150 hover:text-neutral-600 [&_svg]:size-3.5',
                                      focusRing,
                                      faceClass,
                                  )
                                : squareClass
                        }
                        data-slot="toast-action"
                        type="button"
                    >
                        {toast.data?.actionIcon ??
                            ((toast.data?.undo ?? label === 'Undo') ? (
                                <Undo2 strokeWidth={2} />
                            ) : (
                                <ArrowRight strokeWidth={2} />
                            ))}
                    </button>
                }
            />
            <TooltipContent positionerClassName={TOAST_LAYER}>{label}</TooltipContent>
        </Tooltip>
    );
};

/**
 * One toast: a card with the thing (`title`, two lines at most), a line about it (`description`,
 * three at most) and its icon in a badge-toned well, then the action and the ×. A `data.tab` sets
 * a tab on top saying what is going on, and the action moves into it. It is drawn in the mode
 * opposite the page's, so it stands out in either and keeps the theme's own colours.
 */
const ToastList = () => {
    const { toasts } = useToast<ToastData>();
    const { mode } = useTheme();

    return toasts.map(toast => {
        const icon = toast.data?.icon ?? (toast.type ? typeIcons[toast.type] : undefined);
        const tab = toast.data?.tab;
        // Text that wraps reads as a paragraph, so the title stands a little further off it.
        const wordy =
            (typeof toast.title === 'string' && toast.title.length > LONG_TITLE) ||
            (typeof toast.description === 'string' && toast.description.length > LONG_DESCRIPTION);

        return (
            <ToastPrimitive.Root
                className={cn(pileClass)}
                data-slot="toast"
                key={toast.id}
                swipeDirection={['down', 'right']}
                toast={toast}
            >
                <Theme
                    className="flex h-full w-full flex-col items-start"
                    mode={mode === 'dark' ? 'light' : 'dark'}
                >
                    {tab && (
                        <span
                            className={cn(
                                surfaceClass,
                                'relative z-10 -mb-px flex max-w-3/4 items-center gap-2 rounded-t-item border-b-0 px-4 pt-2.5 pb-1 text-neutral-600',
                            )}
                            data-slot="toast-tab"
                        >
                            <span className={cn('truncate', faceClass)}>{tab}</span>
                            <ToastActionIcon inTab toast={toast} />
                            {/*
                             * The foot curves into the card, the hairline running along it. It is
                             * sized from the tab's corner (12px at the default 10px), so it squares
                             * off with the theme's corners and keeps a 1px line at any size.
                             */}
                            <svg
                                aria-hidden="true"
                                className="absolute bottom-0 left-[calc(100%+1px)] size-[calc(var(--radius-item)*1.2)] overflow-visible"
                                viewBox="0 0 12 12"
                            >
                                <path
                                    className="fill-neutral-50"
                                    d="M-0.5 -0.5A12 12 0 0 0 11.5 11.5V12H-1Z"
                                />
                                <path
                                    className="fill-none stroke-neutral-200"
                                    d="M-0.5 -0.5A12 12 0 0 0 11.5 11.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </span>
                    )}
                    <div
                        className={cn(
                            // Top-aligned, so a name or line that wraps grows the card down and the well and × stay put.
                            'flex w-full min-w-0 flex-1 items-start gap-1.5 rounded-card p-2',
                            tab && 'rounded-tl-none',
                            !icon && 'pl-4',
                            surfaceClass,
                        )}
                        data-slot="toast-card"
                    >
                        {icon && (
                            <span
                                className={cn(
                                    'flex size-option shrink-0 items-center justify-center overflow-hidden rounded-item [&_svg:not([class*=size-])]:size-4',
                                    wellTones[toast.type ?? 'neutral'] ?? wellTones.neutral,
                                    faceClass,
                                )}
                                data-slot="toast-icon"
                            >
                                {icon}
                            </span>
                        )}
                        <span
                            className={cn(
                                // Two lines beside the 36px well; more text grows it.
                                'flex min-h-option min-w-0 flex-1 flex-col justify-center py-0.5 pr-1',
                                wordy ? 'gap-1.5' : 'gap-0.5',
                                icon && 'ml-2.5',
                                faceClass,
                            )}
                        >
                            <ToastPrimitive.Title
                                className="line-clamp-2 font-medium text-sm"
                                data-slot="toast-title"
                                render={<span />}
                            />
                            <ToastPrimitive.Description
                                className="line-clamp-3 text-neutral-600"
                                data-slot="toast-description"
                                render={<span />}
                            />
                        </span>
                        {/* The action and the × side by side, their squares touching, so they read as one pair. */}
                        <span className="flex shrink-0">
                            {!tab && <ToastActionIcon inTab={false} toast={toast} />}
                            <ToastPrimitive.Close
                                aria-label="Dismiss"
                                className={squareClass}
                                data-slot="toast-close"
                            >
                                <X strokeWidth={2} />
                            </ToastPrimitive.Close>
                        </span>
                    </div>
                </Theme>
            </ToastPrimitive.Root>
        );
    });
};
