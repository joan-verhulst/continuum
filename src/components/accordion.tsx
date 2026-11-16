'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';

/*
 * An accordion: a divided list of questions, each opening its answer under it. For things read one
 * at a time and skipped otherwise: the questions under a product, the terms of a plan, the notes on
 * a step. One answer is open at a time unless `multiple`. To switch between the facets of one
 * object use Tabs; to hide a group of settings, a page of its own.
 */

export type AccordionVariant = 'plain' | 'outline';

// A context, not a parent selector, so an accordion inside another keeps its own look.
const AccordionVariantContext = createContext<AccordionVariant>('plain');

export type AccordionProps = WithClassName<ComponentProps<typeof AccordionPrimitive.Root>> & {
    /**
     * `plain` (the default) sets the rows on the page, a hairline between them and one above and
     * below, for a list in a reading column. `outline` puts them in a hairline box on the card
     * corner, for a list that stands on its own beside other boxes.
     */
    variant?: AccordionVariant;
};

export const Accordion = ({ variant = 'plain', className, ...props }: AccordionProps) => (
    <AccordionVariantContext.Provider value={variant}>
        <AccordionPrimitive.Root
            className={cn(
                'flex min-w-0 flex-col',
                variant === 'plain'
                    ? 'border-neutral-200 border-y'
                    : 'overflow-hidden rounded-card border border-neutral-200 bg-neutral-50',
                className,
            )}
            data-slot="accordion"
            data-variant={variant}
            {...props}
        />
    </AccordionVariantContext.Provider>
);

/** One question and its answer. Give it a `value` to open it from outside or by default. */
export const AccordionItem = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof AccordionPrimitive.Item>>) => (
    <AccordionPrimitive.Item
        className={cn('border-neutral-200 border-b last:border-b-0', className)}
        data-slot="accordion-item"
        {...props}
    />
);

export type AccordionTriggerProps = WithClassName<
    ComponentProps<typeof AccordionPrimitive.Trigger>
> & {
    /** The heading the question is: h3 under a section's h2 (the default), h4 one level down. */
    level?: 2 | 3 | 4 | 5 | 6;
    children?: ReactNode;
};

/**
 * The question: the whole row is the button, its chevron at the right end turning as it opens. A
 * long question wraps and the row grows; the chevron stays centred on it.
 */
export const AccordionTrigger = ({
    level = 3,
    className,
    children,
    ...props
}: AccordionTriggerProps) => {
    const variant = useContext(AccordionVariantContext);
    const Heading = `h${level}` as const;

    return (
        <AccordionPrimitive.Header className="flex" render={<Heading />}>
            <AccordionPrimitive.Trigger
                className={cn(
                    'group/accordion-trigger flex min-h-row w-full cursor-pointer items-center justify-between gap-4 rounded-chip py-3 text-left font-medium text-neutral-950 text-xs',
                    variant === 'outline' && 'px-4',
                    'data-disabled:pointer-events-none data-disabled:opacity-50',
                    focusRing,
                    // Inside the box the ring is drawn inward, or the box's clip would cut it.
                    variant === 'outline' && 'focus-visible:-outline-offset-2',
                    className,
                )}
                data-slot="accordion-trigger"
                {...props}
            >
                <span className="min-w-0">{children}</span>
                <ChevronDown
                    aria-hidden
                    className="size-4 shrink-0 text-neutral-600 transition-[rotate,color] duration-200 ease-out-strong group-hover/accordion-trigger:text-neutral-950 group-data-panel-open/accordion-trigger:rotate-180 motion-reduce:transition-none"
                    strokeWidth={2}
                />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
};

/**
 * The answer, under its question: it opens by its own height and fades in, over 200ms, and does
 * neither for a reader who asked for less motion. Its words keep a reading measure however wide the
 * list is.
 */
export const AccordionPanel = ({
    className,
    children,
    ...props
}: WithClassName<ComponentProps<typeof AccordionPrimitive.Panel>>) => {
    const variant = useContext(AccordionVariantContext);

    return (
        <AccordionPrimitive.Panel
            className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out-strong data-ending-style:h-0 data-starting-style:h-0 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
            data-slot="accordion-panel"
            {...props}
        >
            <div
                className={cn(
                    'max-w-xl pb-4 text-neutral-600 text-xs',
                    variant === 'outline' && 'px-4',
                    className,
                )}
                data-slot="accordion-panel-content"
            >
                {children}
            </div>
        </AccordionPrimitive.Panel>
    );
};
