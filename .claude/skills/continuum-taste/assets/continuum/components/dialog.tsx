'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import {
    type ComponentProps,
    type CSSProperties,
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useLayoutEffect,
    useState,
} from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { Button } from './button';
import { ThemeScope } from './theme';

const CloseButton = ({ className }: { className?: string }) => (
    <DialogPrimitive.Close
        aria-label="Close"
        render={<Button className={className} size="icon-sm" variant="ghost" />}
    >
        <X strokeWidth={2} />
    </DialogPrimitive.Close>
);

/*
 * Layers: a sheet floats beside the page at z-40, and a modal dialog at z-50 above it, so a dialog opened
 * while a non-modal sheet is open dims the sheet too. Menus and tooltips share z-50 and, being portalled
 * after the dialog, open above it.
 */
const SHEET_LAYER = 'z-40';
const DIALOG_LAYER = 'z-50';

// Black rather than a neutral step: the neutral ramp flips in dark mode and would turn the scrim white.
const overlayClass =
    'fixed inset-0 bg-black/40 transition-opacity duration-200 ease-out-strong data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none';

/** Centred confirmation and form dialogs. */
export const Dialog = (props: DialogPrimitive.Root.Props) => (
    <DialogPrimitive.Root data-slot="dialog" {...props} />
);

export const DialogTrigger = (props: DialogPrimitive.Trigger.Props) => (
    <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

export const DialogClose = (props: DialogPrimitive.Close.Props) => (
    <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

export type DialogContentProps = WithClassName<DialogPrimitive.Popup.Props> & {
    /** Where the dialog is portalled; the body by default. A positioned container that paints its own
     * layer (`contain: paint`) holds the dialog and its scrim inside it, as the playground shows one. */
    container?: DialogPrimitive.Portal.Props['container'];
};

export const DialogContent = ({ className, container, ...props }: DialogContentProps) => (
    <DialogPrimitive.Portal container={container}>
        <ThemeScope>
            <DialogPrimitive.Backdrop
                className={cn(overlayClass, DIALOG_LAYER)}
                data-slot="dialog-overlay"
            />
            {/* Centred with margins rather than a transform, so the entry transition can own translate. */}
            <DialogPrimitive.Popup
                className={cn(
                    'fixed inset-0 m-auto flex h-fit max-h-[calc(100dvh-32px)] w-[min(480px,calc(100vw-32px))] flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50 shadow-sheet outline-none',
                    'transition-[opacity,translate] duration-200 ease-out-strong data-ending-style:translate-y-2 data-starting-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
                    DIALOG_LAYER,
                    className,
                )}
                data-slot="dialog-content"
                {...props}
            />
        </ThemeScope>
    </DialogPrimitive.Portal>
);

/**
 * Title row with the close button, ruled off full width; put a DialogTitle in it.
 * Header, body and footer are three parts, and only the body scrolls.
 */
export const DialogHeader = ({ className, children, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex h-[52px] shrink-0 items-center justify-between gap-4 border-neutral-200 border-b pr-[11px] pl-5',
            className,
        )}
        data-slot="dialog-header"
        {...props}
    >
        {children}
        {/* Outlined at the control radius, like the footer's buttons, so it follows each theme's corners. */}
        <DialogPrimitive.Close
            aria-label="Close"
            render={
                <Button
                    className="size-[30px] rounded-control"
                    size="icon-sm"
                    variant="secondary"
                />
            }
        >
            <X className="size-3.5" strokeWidth={2} />
        </DialogPrimitive.Close>
    </div>
);

export const DialogTitle = ({
    className,
    ...props
}: WithClassName<DialogPrimitive.Title.Props>) => (
    <DialogPrimitive.Title
        className={cn('min-w-0 truncate font-medium text-neutral-950 text-sm', className)}
        data-slot="dialog-title"
        {...props}
    />
);

/** Goes first in the DialogBody. */
export const DialogDescription = ({
    className,
    ...props
}: WithClassName<DialogPrimitive.Description.Props>) => (
    <DialogPrimitive.Description
        className={cn('text-neutral-600 text-xs', className)}
        data-slot="dialog-description"
        {...props}
    />
);

/** Everything between header and footer; scrolls on its own once the dialog reaches the viewport's height. */
export const DialogBody = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-5 py-4', className)}
        data-slot="dialog-body"
        {...props}
    />
);

/**
 * The actions, ruled off full width and pinned below the body. The header's height
 * and right inset, so the last button lines up under the close button.
 */
export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex h-[52px] shrink-0 items-center justify-end gap-2 border-neutral-200 border-t px-[11px]',
            className,
        )}
        data-slot="dialog-footer"
        {...props}
    />
);

const SheetModalContext = createContext<DialogPrimitive.Root.Props['modal']>(false);

/**
 * Side sheet for history and details beside the page. Non-modal by default: no
 * overlay, and the page behind stays usable without closing it.
 */
export const Sheet = ({
    modal = false,
    disablePointerDismissal = modal === false,
    ...props
}: DialogPrimitive.Root.Props) => (
    <SheetModalContext.Provider value={modal}>
        {/* A non-modal sheet would otherwise close on any click or focus outside it, so working on the page beside it would dismiss it. */}
        <DialogPrimitive.Root
            data-slot="sheet"
            disablePointerDismissal={disablePointerDismissal}
            modal={modal}
            {...props}
        />
    </SheetModalContext.Provider>
);

export const SheetTrigger = (props: DialogPrimitive.Trigger.Props) => (
    <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

export const SheetClose = (props: DialogPrimitive.Close.Props) => (
    <DialogPrimitive.Close data-slot="sheet-close" {...props} />
);

const SheetAreaContext = createContext<HTMLElement | null>(null);

/**
 * The content area sheets float in, below the header bar and beside the sidebar.
 * A sheet opened anywhere inside it sits 16px in from its top, right and bottom.
 */
export const SheetArea = ({ ref, ...props }: ComponentProps<'div'>) => {
    // State, not a ref: a sheet inside renders before the area's ref is attached, and has to render again once it is.
    const [area, setArea] = useState<HTMLDivElement | null>(null);
    const setRef = useCallback(
        (node: HTMLDivElement | null) => {
            setArea(node);
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        },
        [ref],
    );

    return (
        <SheetAreaContext.Provider value={area}>
            <div data-slot="sheet-area" ref={setRef} {...props} />
        </SheetAreaContext.Provider>
    );
};

const SHEET_GAP = 16;

/**
 * The sheet is portalled and fixed to the viewport, so it follows its area by
 * measuring it: the area's box, cut down to whatever part of it the viewport and
 * any clipping ancestor still show, so a scrolled-away area never drags it along.
 */
const useAreaInset = (node: HTMLElement | null) => {
    const [inset, setInset] = useState<CSSProperties>();

    useLayoutEffect(() => {
        if (!node) return;

        const update = () => {
            const { clientWidth, clientHeight } = document.documentElement;
            let { top, right, bottom } = node.getBoundingClientRect();
            top = Math.max(top, 0);
            right = Math.min(right, clientWidth);
            bottom = Math.min(bottom, clientHeight);
            for (let parent = node.parentElement; parent; parent = parent.parentElement) {
                if (getComputedStyle(parent).overflow === 'visible') continue;
                const box = parent.getBoundingClientRect();
                top = Math.max(top, box.top);
                right = Math.min(right, box.right);
                bottom = Math.min(bottom, box.bottom);
            }
            setInset({
                top: top + SHEET_GAP,
                right: clientWidth - right + SHEET_GAP,
                bottom: clientHeight - bottom + SHEET_GAP,
                // Too little of the area left to hold a sheet: hide it rather than squash it.
                visibility: bottom - top < 160 ? 'hidden' : undefined,
            });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        window.addEventListener('scroll', update, { capture: true, passive: true });
        window.addEventListener('resize', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', update, { capture: true });
            window.removeEventListener('resize', update);
        };
    }, [node]);

    return inset;
};

export type SheetContentProps = WithClassName<DialogPrimitive.Popup.Props> & {
    /** Where the sheet is portalled; the body by default. In a container of its own it keeps to that
     * container's edges rather than the sheet area's. */
    container?: DialogPrimitive.Portal.Props['container'];
};

export const SheetContent = ({ className, style, container, ...props }: SheetContentProps) => {
    const modal = useContext(SheetModalContext);
    const area = useContext(SheetAreaContext);
    const inset = useAreaInset(container ? null : area);

    return (
        <DialogPrimitive.Portal container={container}>
            <ThemeScope>
                {/* Base UI renders the backdrop whatever the modality, so only a fully modal sheet gets the scrim; "trap-focus" leaves the page clickable. */}
                {modal === true && (
                    <DialogPrimitive.Backdrop
                        className={cn(overlayClass, SHEET_LAYER)}
                        data-slot="sheet-overlay"
                    />
                )}
                <DialogPrimitive.Popup
                    // The surface and the panel radius, like the AppPanel it floats beside, so it follows every theme.
                    className={cn(
                        'fixed top-4 right-4 bottom-4 flex w-[min(512px,calc(100vw-32px))] flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 shadow-sheet outline-none',
                        'transition-[opacity,translate] duration-200 ease-out-strong data-ending-style:translate-x-4 data-starting-style:translate-x-4 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
                        SHEET_LAYER,
                        className,
                    )}
                    data-slot="sheet-content"
                    style={
                        typeof style === 'function'
                            ? state => ({ ...inset, ...style(state) })
                            : { ...inset, ...style }
                    }
                    {...props}
                />
            </ThemeScope>
        </DialogPrimitive.Portal>
    );
};

type SheetHeaderProps = ComponentProps<'div'> & {
    /** Leading 16px icon before the title. */
    icon?: ReactNode;
};

/** Title row with a leading icon and the close button, ruled off full width; put a SheetTitle in it. */
export const SheetHeader = ({ icon, className, children, ...props }: SheetHeaderProps) => (
    <div
        className={cn(
            'flex h-[52px] shrink-0 items-center gap-2 border-neutral-200 border-b pr-1.5 pl-4 [&>svg:not([class*=size-])]:size-4 [&>svg]:shrink-0 [&>svg]:text-neutral-950',
            className,
        )}
        data-slot="sheet-header"
        {...props}
    >
        {icon}
        {children}
        {/* A 36px target rather than icon-sm's, sized to the 52px header. */}
        <CloseButton className="ml-auto size-9" />
    </div>
);

export const SheetTitle = ({ className, ...props }: WithClassName<DialogPrimitive.Title.Props>) => (
    <DialogPrimitive.Title
        className={cn('min-w-0 truncate font-medium text-neutral-950 text-sm', className)}
        data-slot="sheet-title"
        {...props}
    />
);

export const SheetBody = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('min-h-0 flex-1 overflow-auto', className)}
        data-slot="sheet-body"
        {...props}
    />
);

/** A padded part of the sheet; every part after the first is ruled off by a full-width divider. */
export const SheetSection = ({ className, ...props }: ComponentProps<'section'>) => (
    <section
        className={cn('border-neutral-200 border-t p-5 first:border-t-0', className)}
        data-slot="sheet-section"
        {...props}
    />
);
