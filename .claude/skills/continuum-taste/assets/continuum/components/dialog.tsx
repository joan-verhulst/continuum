'use client';

import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { ThemeScope } from './theme';

const CloseButton = ({ className }: { className?: string }) => (
    <DialogPrimitive.Close asChild>
        <Button aria-label="Close" className={className} size="icon-sm" variant="ghost">
            <X strokeWidth={1.5} />
        </Button>
    </DialogPrimitive.Close>
);

// Black rather than a neutral step: the neutral ramp flips in dark mode and would turn the scrim white.
const overlayClass =
    'fixed inset-0 z-50 bg-black/40 starting:opacity-0 transition-opacity duration-200 ease-out-strong motion-reduce:transition-none';

/** Centred confirmation and form dialogs. */
export const Dialog = (props: ComponentProps<typeof DialogPrimitive.Root>) => (
    <DialogPrimitive.Root data-slot="dialog" {...props} />
);

export const DialogTrigger = (props: ComponentProps<typeof DialogPrimitive.Trigger>) => (
    <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
);

export const DialogClose = (props: ComponentProps<typeof DialogPrimitive.Close>) => (
    <DialogPrimitive.Close data-slot="dialog-close" {...props} />
);

export const DialogContent = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
    <DialogPrimitive.Portal>
        <ThemeScope>
            <DialogPrimitive.Overlay className={overlayClass} data-slot="dialog-overlay" />
            {/* Centred with margins rather than a transform, so the entry transition can own translate. */}
            <DialogPrimitive.Content
                className={cn(
                    'fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-32px)] w-[min(480px,calc(100vw-32px))] flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50 shadow-sheet outline-none',
                    'starting:translate-y-2 starting:opacity-0 transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-none',
                    className,
                )}
                data-slot="dialog-content"
                {...props}
            />
        </ThemeScope>
    </DialogPrimitive.Portal>
);

/** Title row with the close button; put a DialogTitle in it. */
export const DialogHeader = ({ className, children, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex h-[52px] shrink-0 items-center justify-between gap-4 pr-3 pl-4',
            className,
        )}
        data-slot="dialog-header"
        {...props}
    >
        {children}
        <CloseButton />
    </div>
);

export const DialogTitle = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
    <DialogPrimitive.Title
        className={cn('min-w-0 truncate font-medium text-neutral-950 text-sm', className)}
        data-slot="dialog-title"
        {...props}
    />
);

export const DialogDescription = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
    <DialogPrimitive.Description
        className={cn('px-4 pb-4 text-neutral-600 text-xs', className)}
        data-slot="dialog-description"
        {...props}
    />
);

export const DialogBody = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('min-h-0 flex-1 overflow-auto px-4 pb-4', className)}
        data-slot="dialog-body"
        {...props}
    />
);

export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex shrink-0 items-center justify-end gap-2 border-neutral-200 border-t px-4 py-3',
            className,
        )}
        data-slot="dialog-footer"
        {...props}
    />
);

const SheetModalContext = createContext(false);

type SheetProps = ComponentProps<typeof DialogPrimitive.Root>;

/**
 * The invoice editor's "Status History" side sheet. Non-modal by default, as
 * drawn: no overlay, and the page behind stays usable without closing it.
 */
export const Sheet = ({ modal = false, ...props }: SheetProps) => (
    <SheetModalContext.Provider value={modal}>
        <DialogPrimitive.Root data-slot="sheet" modal={modal} {...props} />
    </SheetModalContext.Provider>
);

export const SheetTrigger = (props: ComponentProps<typeof DialogPrimitive.Trigger>) => (
    <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

export const SheetClose = (props: ComponentProps<typeof DialogPrimitive.Close>) => (
    <DialogPrimitive.Close data-slot="sheet-close" {...props} />
);

export const SheetContent = ({
    className,
    onInteractOutside,
    ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => {
    const modal = useContext(SheetModalContext);

    return (
        <DialogPrimitive.Portal>
            <ThemeScope>
                {/* Radix renders no overlay for a non-modal root. */}
                <DialogPrimitive.Overlay className={overlayClass} data-slot="sheet-overlay" />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed top-2 right-2 bottom-2 z-50 flex w-[min(512px,calc(100vw-16px))] flex-col overflow-hidden rounded-item border border-neutral-200 bg-neutral-100 shadow-sheet outline-none',
                        'starting:translate-x-4 starting:opacity-0 transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-none',
                        className,
                    )}
                    data-slot="sheet-content"
                    onInteractOutside={event => {
                        onInteractOutside?.(event);
                        if (!modal) event.preventDefault();
                    }}
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

/** Title row with a leading icon and the close button; put a SheetTitle in it. */
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
        {/* 36px target, as drawn on the Status History sheet. */}
        <CloseButton className="ml-auto size-9" />
    </div>
);

export const SheetTitle = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
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
