'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    Children,
    type ComponentProps,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useContext,
    useId,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

type BarListTone = 'neutral' | 'chart';

type BarListContextValue = { max: number; tone: BarListTone };

const BarListContext = createContext<BarListContextValue>({ max: 0, tone: 'neutral' });

// A fixed locale: the runtime's own would let a server render "1,234" and the browser hydrate "1.234".
const numberFormat = new Intl.NumberFormat('en-GB');

export const barListRowVariants = cva(
    [
        // The control row's 34px, the height of a nav item and a button.
        'relative isolate flex h-[34px] w-full min-w-0 items-center gap-2 overflow-hidden rounded-item text-left text-xs',
        'bg-neutral-950/[0.03] px-2.5',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    ],
    {
        variants: {
            interactive: {
                false: '',
                true: [
                    'cursor-pointer transition-[background-color,color] duration-150 hover:bg-neutral-950/5',
                    // A row used as a filter toggle: the wash alone barely moves over the track, so a
                    // pressed row takes the coloured selection and a medium label.
                    'aria-pressed:bg-tint aria-pressed:hover:bg-tint aria-pressed:[&_[data-slot=bar-list-label]]:font-medium aria-pressed:[&_[data-slot=bar-list-label]]:text-tint-fg',
                    'aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50',
                    focusRing,
                ],
            },
        },
        defaultVariants: { interactive: false },
    },
);

export const barListFillVariants = cva(
    // The fill animates its width only: it is absolutely placed, so nothing beside it reflows.
    'pointer-events-none absolute inset-y-0 left-0 -z-10 rounded-item transition-[width] duration-200 ease-out-strong motion-reduce:transition-none',
    {
        variants: {
            tone: {
                // Translucent neutral-950 rather than a ramp step, so the bar reads on any surface and in dark mode.
                neutral: 'bg-neutral-950/[0.07]',
                chart: 'bg-chart-1/20',
            },
        },
        defaultVariants: { tone: 'neutral' },
    },
);

type ShowMoreState = {
    expanded: boolean;
    /** Rows held back by `limit`; zero once expanded. */
    hiddenCount: number;
    total: number;
    toggle: () => void;
};

export type BarListProps = Omit<ComponentProps<'div'>, 'title'> &
    VariantProps<typeof barListFillVariants> & {
        /** Left of the heading row, e.g. "Top pages". Also names the list for screen readers. */
        title?: ReactNode;
        /** Right of the heading row, over the values, e.g. "Visitors". */
        valueLabel?: ReactNode;
        /** The value a full bar stands for. Defaults to the largest item value, hidden rows included. */
        max?: number;
        /** Rows shown before "Show more"; the rest wait until the list is expanded. */
        limit?: number;
        expanded?: boolean;
        defaultExpanded?: boolean;
        onExpandedChange?: (expanded: boolean) => void;
        /**
         * Replaces the default show more toggle: a node, or a function of the list's state, e.g. to
         * open the full list in a dialog instead of expanding in place.
         */
        footer?: ReactNode | ((state: ShowMoreState) => ReactNode);
        /** Shown in place of the rows when there are none. */
        empty?: ReactNode;
    };

const itemValue = (child: ReactNode) =>
    isValidElement<{ value?: unknown }>(child) && typeof child.props.value === 'number'
        ? child.props.value
        : 0;

/**
 * Ranked rows with a bar behind each label, sized to its value, under an optional heading row; the
 * analytics card's top pages, countries, sources and devices.
 */
export const BarList = ({
    title,
    valueLabel,
    max,
    limit,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    footer,
    empty = 'No data yet',
    tone = 'neutral',
    className,
    children,
    ...props
}: BarListProps) => {
    const id = useId();
    const titleId = `${id}-title`;
    const listId = `${id}-list`;
    const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
    const expanded = expandedProp ?? uncontrolled;

    const items = Children.toArray(children).filter(isValidElement) as ReactElement[];
    // Scale against every item, not just the visible ones, so the bars keep their length on expand.
    const scale = max ?? Math.max(0, ...items.map(itemValue));
    const canCollapse = limit !== undefined && items.length > limit;
    const visible = canCollapse && !expanded ? items.slice(0, limit) : items;
    const hiddenCount = items.length - visible.length;

    const toggle = () => {
        const next = !expanded;
        if (expandedProp === undefined) setUncontrolled(next);
        onExpandedChange?.(next);
    };

    const footerNode =
        typeof footer === 'function'
            ? footer({ expanded, hiddenCount, total: items.length, toggle })
            : (footer ??
              (canCollapse && (
                  <button
                      aria-controls={listId}
                      aria-expanded={expanded}
                      className={cn(
                          'h-[29px] cursor-pointer self-start rounded-item px-2 font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-800',
                          focusRing,
                      )}
                      data-slot="bar-list-more"
                      onClick={toggle}
                      type="button"
                  >
                      {expanded ? 'Show less' : `Show ${hiddenCount} more`}
                  </button>
              )));

    return (
        <div
            className={cn('flex min-w-0 flex-col gap-2', className)}
            data-expanded={expanded || undefined}
            data-slot="bar-list"
            {...props}
        >
            {(title || valueLabel) && (
                // Same side padding as a row, so the heading sits over the labels and the values.
                <div
                    className="flex items-baseline justify-between gap-3 px-2.5 text-xs"
                    data-slot="bar-list-header"
                >
                    <span
                        className="min-w-0 truncate font-normal text-neutral-600"
                        data-slot="bar-list-title"
                        id={titleId}
                    >
                        {title}
                    </span>
                    {valueLabel && (
                        <span
                            className="shrink-0 font-normal text-neutral-500"
                            data-slot="bar-list-value-label"
                        >
                            {valueLabel}
                        </span>
                    )}
                </div>
            )}
            {items.length === 0 ? (
                <p
                    className="flex h-[34px] items-center rounded-item bg-neutral-950/[0.03] px-2.5 text-neutral-500 text-xs"
                    data-slot="bar-list-empty"
                >
                    {empty}
                </p>
            ) : (
                <BarListContext.Provider value={{ max: scale, tone: tone ?? 'neutral' }}>
                    <ul
                        aria-labelledby={title ? titleId : undefined}
                        className="flex flex-col gap-1.5"
                        data-slot="bar-list-items"
                        id={listId}
                    >
                        {visible}
                    </ul>
                </BarListContext.Provider>
            )}
            {footerNode && (
                <div className="flex flex-col" data-slot="bar-list-footer">
                    {footerNode}
                </div>
            )}
        </div>
    );
};

export type BarListItemProps = Omit<useRender.ComponentProps<'div'>, 'children'> & {
    value: number;
    /** The label; truncates rather than wraps. */
    children?: ReactNode;
    /** A 16px icon, flag or favicon before the label. */
    icon?: ReactNode;
    /** Shown in place of `value`, e.g. "1.2k" or "33%". */
    displayValue?: ReactNode;
    /** Makes the row a link. */
    href?: string;
    /** Makes the row a button, e.g. to filter the page by this item. */
    onClick?: ComponentProps<'button'>['onClick'];
    disabled?: boolean;
    /** Classes for the list item that wraps the row. */
    itemClassName?: string;
};

/** One ranked row: icon, label and value over a bar sized to the value. Interactive with `href`, `onClick` or `render`. */
export const BarListItem = ({
    value,
    icon,
    displayValue,
    href,
    onClick,
    disabled,
    render,
    ref,
    className,
    itemClassName,
    children,
    ...props
}: BarListItemProps) => {
    const { max, tone } = useContext(BarListContext);
    const share = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    const interactive = Boolean(href || onClick || render);
    // A link or a button unless the caller passes its own element (a router link). A disabled link
    // drops its href, which also takes it out of the tab order.
    const element: useRender.ComponentProps<'div'>['render'] =
        render ??
        ((href ? (
            // biome-ignore lint/a11y/useAnchorContent: useRender fills the anchor with the row's content
            <a href={disabled ? undefined : href} />
        ) : onClick ? (
            <button type="button" />
        ) : undefined) as useRender.ComponentProps<'div'>['render']);

    const row = useRender({
        defaultTagName: 'div',
        render: element,
        ref,
        state: { slot: 'bar-list-row' },
        props: mergeProps<'div'>(
            {
                className: cn(barListRowVariants({ interactive }), className),
                onClick: disabled ? undefined : (onClick as ComponentProps<'div'>['onClick']),
                // A link cannot be disabled natively, so aria-disabled keeps it out of reach for both.
                'aria-disabled': interactive && disabled ? true : undefined,
                ...(!render && !href && onClick ? { disabled } : {}),
                children: (
                    <>
                        <span
                            aria-hidden
                            className={barListFillVariants({ tone })}
                            data-slot="bar-list-fill"
                            // A sliver for any value above zero, so a row of 1 still shows it was counted.
                            style={{ width: share > 0 ? `max(${share * 100}%, 4px)` : 0 }}
                        />
                        {icon && (
                            <span
                                className="flex size-4 shrink-0 items-center justify-center overflow-hidden text-neutral-600 [&_img]:size-4 [&_img]:object-cover"
                                data-slot="bar-list-icon"
                            >
                                {icon}
                            </span>
                        )}
                        <span
                            className="min-w-0 flex-1 truncate font-normal text-neutral-950"
                            data-slot="bar-list-label"
                        >
                            {children}
                        </span>
                        <span
                            className="shrink-0 font-normal text-neutral-600 tabular-nums"
                            data-slot="bar-list-value"
                        >
                            {displayValue ?? numberFormat.format(value)}
                        </span>
                    </>
                ),
            },
            props,
        ),
    });

    return (
        <li className={cn('flex min-w-0', itemClassName)} data-slot="bar-list-item">
            {row}
        </li>
    );
};
