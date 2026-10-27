'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronRight } from 'lucide-react';
import { type ComponentProps, createContext, useContext } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { ThemeScope } from './theme';

const contentClass = [
    'flex max-h-(--available-height) min-w-40 flex-col gap-1 overflow-y-auto rounded-item border border-neutral-200 bg-neutral-50 p-1 shadow-float outline-none',
    // Base UI keeps the popup mounted while it closes, so the same scale and fade play on the way out.
    'origin-(--transform-origin) transition-[opacity,scale] duration-200 ease-out-strong data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
];

const itemVariants = cva(
    [
        'relative flex h-8 shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-item px-2 font-medium text-xs outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    ],
    {
        variants: {
            variant: {
                default: [
                    'text-neutral-700 [&_svg]:text-neutral-600',
                    'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-800',
                ],
                danger: 'text-error-600 data-highlighted:bg-neutral-950/5 [&_svg]:text-current',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

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
    VariantProps<typeof itemVariants>;

export const DropdownMenuItem = ({ variant, className, ...props }: DropdownMenuItemProps) => (
    <MenuPrimitive.Item
        className={cn(itemVariants({ variant }), className)}
        data-slot="dropdown-menu-item"
        data-variant={variant ?? 'default'}
        {...props}
    />
);

export const DropdownMenuCheckboxItem = ({
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.CheckboxItem.Props>) => (
    <MenuPrimitive.CheckboxItem
        className={cn(itemVariants(), 'pr-1.5', className)}
        data-slot="dropdown-menu-checkbox-item"
        {...props}
    >
        {children}
        <MenuPrimitive.CheckboxItemIndicator className="ml-auto flex">
            <Check strokeWidth={2} />
        </MenuPrimitive.CheckboxItemIndicator>
    </MenuPrimitive.CheckboxItem>
);

export const DropdownMenuRadioItem = ({
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.RadioItem.Props>) => (
    <MenuPrimitive.RadioItem
        className={cn(
            itemVariants(),
            'pr-1.5 data-checked:bg-neutral-100 data-checked:text-neutral-950',
            className,
        )}
        data-slot="dropdown-menu-radio-item"
        {...props}
    >
        {children}
        <MenuPrimitive.RadioItemIndicator className="ml-auto flex">
            <Check strokeWidth={2} />
        </MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
);

export const DropdownMenuSubTrigger = ({
    className,
    children,
    ...props
}: WithClassName<MenuPrimitive.SubmenuTrigger.Props>) => (
    <MenuPrimitive.SubmenuTrigger
        className={cn(
            itemVariants(),
            'pr-1.5 data-popup-open:bg-selected data-popup-open:text-neutral-800',
            className,
        )}
        data-slot="dropdown-menu-sub-trigger"
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto" strokeWidth={2} />
    </MenuPrimitive.SubmenuTrigger>
);

const labelClass = 'px-2 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs';

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
        className={cn('ml-auto pl-3 font-medium text-neutral-500 text-xxs', className)}
        data-slot="dropdown-menu-shortcut"
        {...props}
    />
);
