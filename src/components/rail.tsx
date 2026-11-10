'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { PanelLeft } from 'lucide-react';
import {
    type ComponentProps,
    type CSSProperties,
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type RailContextValue = { expanded: boolean; setExpanded: (expanded: boolean) => void };

const RailContext = createContext<RailContextValue>({ expanded: false, setExpanded: () => {} });

type Pill = { top: number; height: number; moved: boolean };

export type RailProps = ComponentProps<'nav'> & {
    /** Open with each item's label beside its icon; closed it is icons, named in tooltips. */
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
};

/**
 * The app's main navigation as a floating island at the page's edge: 52px of icons, or 208px with
 * each item's label once expanded (a `RailToggle` opens and closes it). The current item sits on
 * one action pill that slides from the old item to the new one, and the icons keep their place
 * as the rail widens, so only the labels arrive.
 */
export const Rail = ({
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    className,
    style,
    children,
    ...props
}: RailProps) => {
    const [expandedState, setExpandedState] = useState(defaultExpanded);
    const expanded = expandedProp ?? expandedState;
    const setExpanded = (value: boolean) => {
        setExpandedState(value);
        onExpandedChange?.(value);
    };
    const ref = useRef<HTMLElement>(null);
    const [pill, setPill] = useState<Pill>();

    // Measured before paint after every render, so the pill finds the current item however it was
    // set; it lands on the first one in place and slides from then on.
    useLayoutEffect(() => {
        const item = ref.current?.querySelector<HTMLElement>(
            '[data-slot=rail-item][aria-current=page]',
        );
        setPill(previous => {
            if (!item) return undefined;
            const next = { top: item.offsetTop, height: item.offsetHeight };
            if (previous && previous.top === next.top && previous.height === next.height)
                return previous;
            return { ...next, moved: previous !== undefined };
        });
    });

    return (
        <RailContext.Provider value={{ expanded, setExpanded }}>
            <nav
                className={cn(
                    'group/rail relative isolate flex shrink-0 flex-col gap-0.5 overflow-hidden rounded-dock border border-neutral-200 bg-neutral-50 p-[8px]',
                    'transition-[width] duration-300 ease-out-strong motion-reduce:transition-none',
                    expanded ? 'w-rail-open' : 'w-rail',
                    className,
                )}
                data-expanded={expanded || undefined}
                data-slot="rail"
                ref={ref}
                style={style}
                {...props}
            >
                {pill && (
                    <span
                        aria-hidden
                        className={cn(
                            'absolute inset-x-[8px] top-0 -z-10 rounded-item bg-action shadow-action [background-image:var(--action-gradient)]',
                            pill.moved &&
                                'transition-[translate,height] duration-200 ease-out-strong motion-reduce:transition-none',
                        )}
                        data-slot="rail-pill"
                        style={
                            { translate: `0 ${pill.top}px`, height: pill.height } as CSSProperties
                        }
                    />
                )}
                {children}
            </nav>
        </RailContext.Provider>
    );
};

export const RailSeparator = ({ className, ...props }: ComponentProps<'hr'>) => (
    <hr
        className={cn('my-1.5 h-px w-full shrink-0 border-0 bg-neutral-200', className)}
        data-slot="rail-separator"
        {...props}
    />
);

/*
 * A control-tall row the rail's inner width: closed, the icon sits centred in it, and open it stays
 * put. The rail is a fixed 52px box, so its insets are fixed pixels too, not the spacing unit: 8px
 * round the rows and (52 − 2 border − 16 inset − 16 icon) / 2 = 9px either side of the icon.
 */
const railRowClass =
    'flex h-control w-full shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-item px-[9px] text-neutral-600 transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-800 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0';

// The label beside the icon: there while open, faded out and clipped while closed.
const RailLabel = ({ children }: { children: string }) => (
    <span
        className="min-w-0 truncate font-medium text-xs opacity-0 transition-opacity duration-200 group-data-expanded/rail:opacity-100"
        data-slot="rail-label"
    >
        {children}
    </span>
);

type RailItemProps = useRender.ComponentProps<'button'> & {
    /** Beside the icon when the rail is open, in a tooltip when it is closed, and the accessible name. */
    label: string;
    /** The current section; also set by passing aria-current="page" yourself. */
    active?: boolean;
};

/** One section: its 16px icon as children. Pass `render={<a href="…" />}` to make it a link. */
export const RailItem = ({
    label,
    active,
    render,
    ref,
    className,
    children,
    type = 'button',
    ...props
}: RailItemProps) => {
    const { expanded } = useContext(RailContext);

    // The item is built first and handed to the trigger, so the tooltip wires
    // itself onto the button or link rather than wrapping it in another one.
    const item = useRender({
        defaultTagName: 'button',
        render,
        ref,
        // State keys become data attributes, so this sets data-slot="rail-item".
        state: { slot: 'rail-item' },
        props: mergeProps<'button'>(
            {
                'aria-current': active ? 'page' : undefined,
                'aria-label': label,
                className: cn(
                    railRowClass,
                    // The pill under it is the current look; the item only takes the pill's text colour.
                    'aria-[current=page]:text-on-action aria-[current=page]:hover:bg-transparent aria-[current=page]:hover:text-on-action',
                    focusRing,
                    className,
                ),
                children: (
                    <>
                        {/* A 16px column, so a 24px avatar centres on the icons above it as they do. */}
                        <span className="flex w-4 shrink-0 justify-center" data-slot="rail-icon">
                            {children}
                        </span>
                        <RailLabel>{label}</RailLabel>
                    </>
                ),
                type: render ? undefined : type,
            },
            props,
        ),
    });

    return (
        // Open, the label is on the row already, so the tooltip stands down.
        <Tooltip disabled={expanded}>
            <TooltipTrigger render={item} />
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};

/** Opens and closes the rail; usually its first row. */
export const RailToggle = ({
    className,
    onClick,
    collapseLabel = 'Collapse navigation',
    expandLabel = 'Expand navigation',
    ...props
}: ComponentProps<'button'> & {
    /** Its names for screen readers and the tooltip while the rail is open and while it is closed. */
    collapseLabel?: string;
    expandLabel?: string;
}) => {
    const { expanded, setExpanded } = useContext(RailContext);
    // Named for what it holds, the app's navigation, since "rail" is the library's word, not the reader's.
    const label = expanded ? collapseLabel : expandLabel;

    return (
        <Tooltip disabled={expanded}>
            <TooltipTrigger
                render={
                    <button
                        aria-expanded={expanded}
                        aria-label={label}
                        className={cn(railRowClass, focusRing, className)}
                        data-slot="rail-toggle"
                        onClick={event => {
                            onClick?.(event);
                            setExpanded(!expanded);
                        }}
                        type="button"
                        {...props}
                    >
                        <PanelLeft aria-hidden strokeWidth={2} />
                        <RailLabel>Collapse</RailLabel>
                    </button>
                }
            />
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};
