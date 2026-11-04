'use client';

import { Check } from 'lucide-react';
import {
    type ComponentProps,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';

/*
 * Only the icon carries the tone, at 600 as an alert's does: the tab stays the bar's surface, and the
 * colour is the accent that says how it went.
 */
const noticeTones = {
    neutral: '[&_svg]:text-neutral-500',
    primary: '[&_svg]:text-primary-600',
    success: '[&_svg]:text-success-600',
    warning: '[&_svg]:text-warning-600',
    error: '[&_svg]:text-error-600',
} as const;

export type NoticeTone = keyof typeof noticeTones;

export type NoticeProps = Omit<ComponentProps<'output'>, 'children'> & {
    /** What just happened, in a word or two: "Saved", "Link copied". Nothing hides the notice. */
    message?: ReactNode;
    /** Leads the message; a tick by default. Pass a `<Spinner size="sm" />` while it is still working. */
    icon?: ReactNode;
    /** Colours the icon. Success for the default tick, neutral for an icon of your own, as a spinner. */
    tone?: NoticeTone;
};

/**
 * The quiet toast: for small actions that need no undo, a tab slides out from under a bar's
 * hairline, centred, and the hairline runs round it. Place it in a positioned bar with a bottom
 * border (the header bar, a sheet's or a panel's header); it is drawn in the bar's own surface and
 * border, so it reads as the bar saying something, not as something laid over the page. Bigger
 * news, or anything with an undo, is a toast at the foot instead.
 */
export const Notice = ({ message, icon, tone, className, ...props }: NoticeProps) => {
    // The last message stays while the tab slides away, so it does not empty as it leaves.
    const [shown, setShown] = useState<{ message: ReactNode; icon: ReactNode; tone: NoticeTone }>();
    const open = message !== undefined && message !== null && message !== false;

    useEffect(() => {
        if (open) setShown({ message, icon, tone: tone ?? (icon ? 'neutral' : 'success') });
    }, [open, message, icon, tone]);

    return (
        // The clip starts on the bar's hairline (just past its padding box), so the tab comes out of
        // that edge rather than out of nowhere, and covers the hairline where it hangs.
        <output
            aria-live="polite"
            className={cn(
                // Padded by the fillets' size, so the clip keeps them.
                'pointer-events-none absolute top-full left-1/2 z-20 -translate-x-1/2 overflow-hidden px-2 pb-px',
                className,
            )}
            data-slot="notice"
            {...props}
        >
            <div
                className={cn(
                    'pointer-events-auto relative flex h-8 items-center gap-1.5 whitespace-nowrap rounded-b-item border border-neutral-200 border-t-0 bg-neutral-50 px-3 text-neutral-700 text-xs',
                    /*
                     * Where the bar's hairline turns down into the tab, it bends round an 8px curve
                     * instead of a corner: a square either side, filled with the bar's surface outside
                     * a quarter circle and drawn with its border on the curve, transparent inside.
                     */
                    "before:absolute before:top-0 before:-left-2 before:size-2 before:content-[''] before:[background:radial-gradient(circle_at_0_100%,transparent_6.75px,var(--color-neutral-200)_7.25px,var(--color-neutral-200)_7.75px,var(--color-neutral-50)_8.25px)]",
                    "after:absolute after:top-0 after:-right-2 after:size-2 after:content-[''] after:[background:radial-gradient(circle_at_100%_100%,transparent_6.75px,var(--color-neutral-200)_7.25px,var(--color-neutral-200)_7.75px,var(--color-neutral-50)_8.25px)]",
                    '[&_svg:not([class*=size-])]:size-3.5 [&_svg]:shrink-0',
                    noticeTones[shown?.tone ?? 'neutral'],
                    'transition-[translate,opacity] duration-200 ease-out-strong motion-reduce:translate-y-0 motion-reduce:transition-[opacity]',
                    open ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
                )}
                data-open={open || undefined}
                data-slot="notice-tab"
            >
                {shown && (
                    <>
                        {shown.icon ?? <Check strokeWidth={2} />}
                        {shown.message}
                    </>
                )}
            </div>
        </output>
    );
};

export type NoticeOptions = {
    icon?: ReactNode;
    tone?: NoticeTone;
    /** How long it shows, in ms; 0 keeps it until the next one or `clear`. */
    timeout?: number;
};

/**
 * State for a `Notice`: `show("Saved")` raises it and it leaves by itself after a moment.
 * Spread `notice` on the notice: `<HeaderBarNotice {...notice} />`.
 */
export const useNotice = (defaultTimeout = 1800) => {
    const [notice, setNotice] = useState<{
        message?: ReactNode;
        icon?: ReactNode;
        tone?: NoticeTone;
    }>({});
    const timer = useRef<number | undefined>(undefined);

    const clear = useCallback(() => {
        window.clearTimeout(timer.current);
        setNotice(current => ({ ...current, message: undefined }));
    }, []);

    const show = useCallback(
        (message: ReactNode, { icon, tone, timeout = defaultTimeout }: NoticeOptions = {}) => {
            window.clearTimeout(timer.current);
            setNotice({ message, icon, tone });
            if (timeout > 0) timer.current = window.setTimeout(clear, timeout);
        },
        [clear, defaultTimeout],
    );

    useEffect(() => () => window.clearTimeout(timer.current), []);

    return { notice, show, clear };
};
