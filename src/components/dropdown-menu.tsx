'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import type { VariantProps } from 'class-variance-authority';
import { Check, ChevronRight, Search } from 'lucide-react';
import {
    type ComponentProps,
    createContext,
    type KeyboardEvent,
    type ReactNode,
    useContext,
    useEffect,
    useRef,
} from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { PopoverItem, popoverItemVariants } from './popover-item';
import { ThemeScope } from './theme';

const contentClass = [
    'flex max-h-(--available-height) min-w-menu flex-col gap-1 overflow-y-auto rounded-item border border-neutral-200 bg-neutral-50 p-1 shadow-float outline-none',
    // Base UI keeps the popup mounted while it closes, so the same scale and fade play on the way out.
    'origin-(--transform-origin) transition-[opacity,scale] duration-200 ease-out-strong data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
];

/*
 * Base UI's GroupLabel throws outside a Group, while a label at the top of a menu is common.
 * The groups below flag their subtree so the label can link itself to a group only when it has one.
 */
const InGroupContext = createContext(false);

type PositionProps = Pick<
    MenuPrimitive.Positioner.Props,
    'side' | 'sideOffset' | 'align' | 'alignOffset' | 'collisionPadding'
>;

/** Row-action and account menus (report editor ellipsis, invoice table rows). */
export const DropdownMenu = (props: MenuPrimitive.Root.Props) => (
    <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
);

export const DropdownMenuTrigger = (props: MenuPrimitive.Trigger.Props) => (
    <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
);

export const DropdownMenuGroup = (props: MenuPrimitive.Group.Props) => (
    <InGroupContext.Provider value>
        <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
    </InGroupContext.Provider>
);

export const DropdownMenuSub = (props: MenuPrimitive.SubmenuRoot.Props) => (
    <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
);

export const DropdownMenuRadioGroup = (props: MenuPrimitive.RadioGroup.Props) => (
    <InGroupContext.Provider value>
        <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
    </InGroupContext.Provider>
);

export type DropdownMenuContentProps = WithClassName<MenuPrimitive.Popup.Props> &
    PositionProps & {
        /** Where the menu is portalled; the body by default. */
        container?: MenuPrimitive.Portal.Props['container'];
    };

export const DropdownMenuContent = ({
    className,
    side,
    sideOffset = 4,
    align,
    alignOffset,
    collisionPadding,
    container,
    ...props
}: DropdownMenuContentProps) => (
    <MenuPrimitive.Portal container={container}>
        <ThemeScope>
            <MenuPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                className="z-50 outline-none"
                collisionPadding={collisionPadding}
                data-slot="dropdown-menu-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <MenuPrimitive.Popup
                    className={cn(contentClass, className)}
                    data-slot="dropdown-menu-content"
                    {...props}
                />
            </MenuPrimitive.Positioner>
        </ThemeScope>
    </MenuPrimitive.Portal>
);

export const DropdownMenuSubContent = ({
    className,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionPadding,
    container,
    ...props
}: DropdownMenuContentProps) => (
    <MenuPrimitive.Portal container={container}>
        <ThemeScope>
            <MenuPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                className="z-50 outline-none"
                collisionPadding={collisionPadding}
                data-slot="dropdown-menu-sub-positioner"
                side={side}
                sideOffset={sideOffset}
            >
                <MenuPrimitive.Popup
                    className={cn(contentClass, className)}
                    data-slot="dropdown-menu-sub-content"
                    {...props}
                />
            </MenuPrimitive.Positioner>
        </ThemeScope>
    </MenuPrimitive.Portal>
);

export type DropdownMenuItemProps = WithClassName<MenuPrimitive.Item.Props> &
    VariantProps<typeof popoverItemVariants>;

export const DropdownMenuItem = ({ variant, className, ...props }: DropdownMenuItemProps) => (
    <MenuPrimitive.Item
        className={cn(popoverItemVariants({ variant }), className)}
        data-slot="dropdown-menu-item"
        data-variant={variant ?? 'default'}
        {...props}
    />
);

export const DropdownMenuCheckboxItem = ({
    icon,
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.CheckboxItem.Props> & {
    /** A 16px icon before the name, in the row's leading slot like a plain item's. */
    icon?: ReactNode;
}) => (
    <PopoverItem
        className={className}
        data-slot="dropdown-menu-checkbox-item"
        leading={icon}
        render={<MenuPrimitive.CheckboxItem {...props} />}
        trailing={
            <MenuPrimitive.CheckboxItemIndicator className="flex">
                <Check strokeWidth={2} />
            </MenuPrimitive.CheckboxItemIndicator>
        }
    >
        {children}
    </PopoverItem>
);

export const DropdownMenuRadioItem = ({
    icon,
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.RadioItem.Props> & {
    /** A 16px icon before the name, in the row's leading slot like a plain item's. */
    icon?: ReactNode;
}) => (
    // Checked takes the same selected wash as a select's picked option.
    <PopoverItem
        className={cn('data-checked:bg-selected data-checked:text-neutral-950', className)}
        data-slot="dropdown-menu-radio-item"
        leading={icon}
        render={<MenuPrimitive.RadioItem {...props} />}
        trailing={
            <MenuPrimitive.RadioItemIndicator className="flex">
                <Check strokeWidth={2} />
            </MenuPrimitive.RadioItemIndicator>
        }
    >
        {children}
    </PopoverItem>
);

export const DropdownMenuSubTrigger = ({
    icon,
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.SubmenuTrigger.Props> & {
    /** A 16px icon before the name, in the row's leading slot; in the children it would sit over the name. */
    icon?: ReactNode;
}) => (
    <PopoverItem
        className={cn('data-popup-open:bg-selected data-popup-open:text-neutral-800', className)}
        data-slot="dropdown-menu-sub-trigger"
        leading={icon}
        render={<MenuPrimitive.SubmenuTrigger {...props} />}
        trailing={<ChevronRight strokeWidth={2} />}
    >
        {children}
    </PopoverItem>
);

const labelClass = 'px-3 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs';

export const DropdownMenuLabel = ({ className, ...props }: ComponentProps<'div'>) => {
    const inGroup = useContext(InGroupContext);

    // Outside a group the label only titles the menu, so a plain element is enough.
    const Label = inGroup ? MenuPrimitive.GroupLabel : 'div';

    return (
        <Label className={cn(labelClass, className)} data-slot="dropdown-menu-label" {...props} />
    );
};

export const DropdownMenuSeparator = ({
    className,
    ...props
}: WithClassName<MenuPrimitive.Separator.Props>) => (
    <MenuPrimitive.Separator
        className={cn('-mx-1 h-px bg-neutral-200', className)}
        data-slot="dropdown-menu-separator"
        {...props}
    />
);

export const DropdownMenuShortcut = ({ className, ...props }: ComponentProps<'span'>) => (
    <span
        className={cn('ml-auto pl-3 font-medium text-neutral-600 text-xxs', className)}
        data-slot="dropdown-menu-shortcut"
        {...props}
    />
);

// The keys a search hands on to the menu: moving into the list, and leaving it.
const menuKeys = new Set(['ArrowDown', 'ArrowUp', 'Escape', 'Tab']);

export type DropdownMenuSearchProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
    value: string;
    onValueChange: (value: string) => void;
};

/**
 * A search at the top of a menu, for one long enough to need it (assign to, move to, add label).
 * No box: a 16px icon and the text, ruled off from the list full width, the icon in line with the
 * rows' icons. It takes focus as the menu opens and keeps its typing from the menu's typeahead;
 * the arrows still move into the list, and Enter runs the first item left. The menu filters its
 * own items by `value`.
 */
export const DropdownMenuSearch = ({
    value,
    onValueChange,
    placeholder = 'Search',
    className,
    onKeyDown,
    ...props
}: DropdownMenuSearchProps) => {
    const ref = useRef<HTMLInputElement>(null);

    // The menu focuses its popup as it opens; the search takes it over on the next frame.
    useEffect(() => {
        const frame = requestAnimationFrame(() => ref.current?.focus());
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (!menuKeys.has(event.key)) event.stopPropagation();
        // Enter runs the first item left, as a command menu's search does; not while an IME is composing.
        if (event.key === 'Enter' && !event.defaultPrevented && !event.nativeEvent.isComposing) {
            const first = event.currentTarget
                .closest('[data-slot=dropdown-menu-content],[data-slot=dropdown-menu-sub-content]')
                ?.querySelector<HTMLElement>(
                    '[role^=menuitem]:not([data-disabled]):not([aria-disabled=true])',
                );
            if (first) {
                event.preventDefault();
                first.click();
            }
        }
    };

    return (
        <div
            className="-mx-1 -mt-1 flex h-row shrink-0 items-center gap-3 border-neutral-200 border-b px-4 text-neutral-500 [&_svg]:size-4 [&_svg]:shrink-0"
            data-slot="dropdown-menu-search"
        >
            <Search aria-hidden strokeWidth={2} />
            <input
                autoComplete="off"
                className={cn(
                    'h-full min-w-0 flex-1 bg-transparent text-neutral-950 text-xs outline-none placeholder:text-neutral-600',
                    className,
                )}
                data-slot="dropdown-menu-search-input"
                onChange={event => onValueChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                ref={ref}
                spellCheck={false}
                value={value}
                {...props}
            />
        </div>
    );
};

/** What a searched menu shows when nothing matches. */
export const DropdownMenuEmpty = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('px-3 py-2.5 text-neutral-600 text-xs', className)}
        data-slot="dropdown-menu-empty"
        {...props}
    />
);
