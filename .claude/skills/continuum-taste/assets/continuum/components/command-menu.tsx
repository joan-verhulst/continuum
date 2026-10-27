'use client';

import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Search } from 'lucide-react';
import {
    type ComponentProps,
    createContext,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Dialog, DialogContent, type DialogContentProps } from './dialog';

type CommandMenuContextValue = {
    query: string;
    setQuery: (query: string) => void;
    active?: string;
    setActive: (id: string | undefined) => void;
    listId: string;
    listRef: RefObject<HTMLDivElement | null>;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

const useCommandMenu = () => {
    const context = useContext(CommandMenuContext);
    if (!context) throw new Error('Command menu parts must be inside <CommandMenu>.');
    return context;
};

/** Whether every word typed appears in the label or one of its keywords. */
export const matchesCommand = (query: string, ...fields: (string | undefined)[]) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = fields.filter(Boolean).join(' ').toLowerCase();
    return words.every(word => haystack.includes(word));
};

/** Opens a command menu with ⌘K or Ctrl+K from anywhere on the page. */
export const useCommandMenuShortcut = (onOpen: () => void, key = 'k') => {
    useEffect(() => {
        const listener = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
                event.preventDefault();
                onOpen();
            }
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, [onOpen, key]);
};

export type CommandMenuProps = Omit<DialogPrimitive.Root.Props, 'children'> & {
    children?: ReactNode;
    /** The search, controlled; it is cleared each time the menu opens otherwise. */
    query?: string;
    onQueryChange?: (query: string) => void;
};

/**
 * Search and run anything from the keyboard: a dialog pinned near the top with a borderless search,
 * commands in groups below it, arrows to move and Enter to run. Items hide themselves when they do
 * not match what is typed, and a group with nothing left hides with them.
 */
export const CommandMenu = ({
    query: queryProp,
    onQueryChange,
    open,
    onOpenChange,
    children,
    ...props
}: CommandMenuProps) => {
    const [ownQuery, setOwnQuery] = useState('');
    const query = queryProp ?? ownQuery;
    const [active, setActive] = useState<string>();
    const listId = useId();
    const listRef = useRef<HTMLDivElement>(null);

    const setQuery = useCallback(
        (next: string) => {
            setOwnQuery(next);
            onQueryChange?.(next);
        },
        [onQueryChange],
    );

    return (
        <Dialog
            onOpenChange={(next, details) => {
                if (next && queryProp === undefined) setOwnQuery('');
                onOpenChange?.(next, details);
            }}
            open={open}
            {...props}
        >
            <CommandMenuContext.Provider
                value={{ query, setQuery, active, setActive, listId, listRef }}
            >
                {children}
            </CommandMenuContext.Provider>
        </Dialog>
    );
};

/** The panel: 560px, pinned at a sixth of the screen from the top, so it does not jump as results change. */
export const CommandMenuContent = ({
    className,
    'aria-label': label = 'Command menu',
    ...props
}: DialogContentProps) => (
    <DialogContent
        aria-label={label}
        className={cn('mt-[16vh] mb-auto w-[min(560px,calc(100%-32px))]', className)}
        data-slot="command-menu-content"
        {...props}
    />
);

/** The items showing now, in order, read from the list itself. */
const visibleItems = (list: HTMLElement | null) =>
    Array.from(
        list?.querySelectorAll<HTMLElement>(
            '[data-slot="command-menu-item"]:not([data-disabled])',
        ) ?? [],
    );

export type CommandMenuInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
    /** Trailing in the search row, such as an Esc key. */
    trailing?: ReactNode;
};

/** The search: no box, a 16px icon, the text at 14px, ruled off from the list full width. */
export const CommandMenuInput = ({
    trailing,
    className,
    placeholder = 'Search or run a command',
    onKeyDown,
    ...props
}: CommandMenuInputProps) => {
    const { query, setQuery, active, setActive, listId, listRef } = useCommandMenu();

    const move = (by: number) => {
        const items = visibleItems(listRef.current);
        if (items.length === 0) return;
        const index = items.findIndex(item => item.id === active);
        const next = items[(index + by + items.length) % items.length];
        setActive(next?.id);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            move(event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Home' || event.key === 'End') {
            const items = visibleItems(listRef.current);
            event.preventDefault();
            setActive((event.key === 'Home' ? items[0] : items.at(-1))?.id);
        } else if (event.key === 'Enter' && active) {
            event.preventDefault();
            document.getElementById(active)?.click();
        }
    };

    return (
        <div
            className="flex h-[52px] shrink-0 items-center gap-2.5 border-neutral-200 border-b px-4 text-neutral-500 [&_svg]:size-4 [&_svg]:shrink-0"
            data-slot="command-menu-search"
        >
            <Search aria-hidden strokeWidth={2} />
            <input
                aria-activedescendant={active}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded
                autoComplete="off"
                className={cn(
                    'h-full min-w-0 flex-1 bg-transparent text-neutral-950 text-sm outline-none placeholder:text-neutral-500',
                    className,
                )}
                data-slot="command-menu-input"
                onChange={event => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                role="combobox"
                spellCheck={false}
                value={query}
                {...props}
            />
            {trailing}
        </div>
    );
};

/** The commands, scrolling under the search once there are more than fit. */
export const CommandMenuList = ({ className, children, ...props }: ComponentProps<'div'>) => {
    const { query, active, setActive, listId, listRef } = useCommandMenu();

    // After every change to what shows, keep an item highlighted: the same one if it is still there.
    useLayoutEffect(() => {
        const items = visibleItems(listRef.current);
        if (!items.some(item => item.id === active)) setActive(items[0]?.id);
    });

    // Typing starts again from the top of the list.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each new query on purpose
    useLayoutEffect(() => {
        setActive(visibleItems(listRef.current)[0]?.id);
        listRef.current?.scrollTo({ top: 0 });
    }, [query]);

    useEffect(() => {
        if (active) document.getElementById(active)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    return (
        <div
            className={cn(
                'group/command-list flex max-h-[min(360px,50dvh)] flex-col gap-1 overflow-y-auto p-1.5',
                className,
            )}
            data-slot="command-menu-list"
            id={listId}
            ref={listRef}
            role="listbox"
            {...props}
        >
            {children}
        </div>
    );
};

export type CommandMenuGroupProps = Omit<ComponentProps<'div'>, 'title'> & {
    label: ReactNode;
};

/** A labelled run of commands; it hides once none of them match. */
export const CommandMenuGroup = ({
    label,
    className,
    children,
    ...props
}: CommandMenuGroupProps) => {
    const labelId = useId();

    return (
        // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox, which a fieldset is not
        <div
            aria-labelledby={labelId}
            className={cn(
                'flex not-has-[[data-slot=command-menu-item]]:hidden flex-col',
                className,
            )}
            data-slot="command-menu-group"
            role="group"
            {...props}
        >
            <div
                className="px-2 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs"
                data-slot="command-menu-label"
                id={labelId}
            >
                {label}
            </div>
            {children}
        </div>
    );
};

export type CommandMenuItemProps = Omit<ComponentProps<'div'>, 'onSelect'> & {
    /** What the item is matched by, along with `keywords`. */
    value: string;
    /** Other words it answers to: "invoice" for "Billing". */
    keywords?: string[];
    /** Leading 16px icon. */
    icon?: ReactNode;
    /** Trailing, quiet: a Kbd shortcut or where the item lives. */
    hint?: ReactNode;
    disabled?: boolean;
    /** Runs the command, from a click or Enter. */
    onSelect?: () => void;
};

/** One command: a 32px menu row, highlighted with the 5% wash as the arrows reach it. */
export const CommandMenuItem = ({
    value,
    keywords,
    icon,
    hint,
    disabled = false,
    onSelect,
    className,
    children,
    ...props
}: CommandMenuItemProps) => {
    const { query, active, setActive } = useCommandMenu();
    const id = useId();

    if (!matchesCommand(query, value, ...(keywords ?? []))) return null;

    const highlighted = active === id;

    return (
        // Never focused itself: the search keeps focus and points at the highlighted option.
        <div
            aria-disabled={disabled || undefined}
            aria-selected={highlighted}
            className={cn(
                'flex h-8 shrink-0 cursor-pointer select-none items-center gap-2 rounded-item px-2 font-medium text-neutral-700 text-xs',
                'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-950',
                'data-disabled:pointer-events-none data-disabled:opacity-50',
                '[&>svg]:text-neutral-600 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                className,
            )}
            data-disabled={disabled || undefined}
            data-highlighted={highlighted || undefined}
            data-slot="command-menu-item"
            id={id}
            onClick={disabled ? undefined : onSelect}
            onPointerMove={() => {
                if (!disabled && !highlighted) setActive(id);
            }}
            role="option"
            tabIndex={-1}
            {...props}
        >
            {icon}
            <span className="min-w-0 flex-1 truncate">{children ?? value}</span>
            {hint && (
                <span
                    className="ml-auto flex shrink-0 items-center gap-1 pl-3 font-normal text-neutral-500 text-xxs"
                    data-slot="command-menu-hint"
                >
                    {hint}
                </span>
            )}
        </div>
    );
};

/** Shown in place of the list once nothing matches what is typed. */
export const CommandMenuEmpty = ({ className, children, ...props }: ComponentProps<'p'>) => {
    const { query } = useCommandMenu();

    return (
        <p
            className={cn(
                'hidden px-2 py-3 text-neutral-600 text-xs group-not-has-[[data-slot=command-menu-item]]/command-list:block',
                className,
            )}
            data-slot="command-menu-empty"
            {...props}
        >
            {children ?? `Nothing matches “${query.trim()}”.`}
        </p>
    );
};

/** Keys to drive the list, under it and ruled off full width. */
export const CommandMenuFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex h-10 shrink-0 items-center gap-4 border-neutral-200 border-t px-4 text-neutral-500 text-xxs',
            className,
        )}
        data-slot="command-menu-footer"
        {...props}
    />
);
