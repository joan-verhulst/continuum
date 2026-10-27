'use client';

import { Info } from 'lucide-react';
import { type ComponentProps, type ReactNode, useId } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type InfoTipProps = Omit<ComponentProps<'button'>, 'children' | 'content'> &
    Pick<ComponentProps<typeof Popover>, 'open' | 'defaultOpen' | 'onOpenChange'> &
    Pick<ComponentProps<typeof PopoverContent>, 'side' | 'align' | 'container'> & {
        /** What the tip explains. */
        content: ReactNode;
        /** The button's accessible name. */
        label?: string;
    };

/**
 * A ghost 16px info icon beside a section title that explains it on hover, focus and tap.
 * Open state can be controlled with `open` and `onOpenChange`.
 */
export const InfoTip = ({
    content,
    label = 'More information',
    open,
    defaultOpen,
    onOpenChange,
    side = 'top',
    align = 'center',
    container,
    className,
    type = 'button',
    'aria-describedby': describedBy,
    ...props
}: InfoTipProps) => {
    const contentId = useId();

    return (
        /*
         * A popover that also opens on hover rather than a tooltip: Base UI turns tooltips off on touch,
         * which would leave the explanation out of reach on a phone. A tap opens this one.
         */
        <Popover defaultOpen={defaultOpen} onOpenChange={onOpenChange} open={open}>
            <PopoverTrigger
                delay={300}
                openOnHover
                render={
                    <button
                        aria-describedby={[describedBy, contentId].filter(Boolean).join(' ')}
                        aria-label={label}
                        className={cn(
                            'relative inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-neutral-500 transition-[color] duration-150 hover:text-neutral-800 data-popup-open:text-neutral-800',
                            // A 16px icon is too small to hit; the invisible 24px ring around it is the target.
                            'after:absolute after:-inset-1 after:content-[""]',
                            focusRing,
                            className,
                        )}
                        data-slot="info-tip"
                        type={type}
                        {...props}
                    />
                }
            >
                <Info aria-hidden className="size-4" strokeWidth={2} />
            </PopoverTrigger>
            {/* The text is also in the page, so a screen reader hears it on focus without opening anything. */}
            <span className="sr-only" data-slot="info-tip-description" id={contentId}>
                {content}
            </span>
            <PopoverContent
                align={align}
                aria-label={label}
                // A short explanation, not a panel of controls: sized to its text, with the item corner.
                className="w-auto max-w-64 gap-0 text-balance rounded-item px-2.5 py-1.5 text-neutral-700 text-xs"
                container={container}
                data-slot="info-tip-content"
                // Focus stays on the icon, so tabbing on after a tap carries on through the page.
                finalFocus={false}
                initialFocus={false}
                side={side}
                sideOffset={6}
            >
                {content}
            </PopoverContent>
        </Popover>
    );
};
