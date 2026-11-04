import { Avatar, Badge, PopoverItem, PopoverItemIndicator, PopoverItemShortcut } from 'continuum';
import { Check, ChevronRight, Mail, Star, Trash2, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
import { type Entry, type Knob, o, type PreviewProps, previewIcon } from '../kit';

const popoverItemKnobs: Knob[] = [
    {
        id: 'leading',
        label: 'Leading',
        options: [
            o('none', 'Nothing'),
            o('icon', 'Icon'),
            o('avatar', 'Avatar'),
            o('checkbox', 'Checkbox'),
            o('radio', 'Radio'),
            o('chip', 'Chip'),
        ],
        default: 'avatar',
    },
    {
        id: 'meta',
        label: 'After the name',
        options: [o('none', 'Nothing'), o('badge', 'Badge'), o('text', 'Muted text')],
        default: 'badge',
    },
    { id: 'description', label: 'Description', switch: true, default: true },
    {
        id: 'trailing',
        label: 'Trailing',
        options: [
            o('none', 'Nothing'),
            o('check', 'Check'),
            o('shortcut', 'Shortcut'),
            o('count', 'Count'),
            o('chevron', 'Chevron'),
            o('several', 'Icon and shortcut'),
        ],
        default: 'shortcut',
    },
    {
        id: 'state',
        label: 'Middle row',
        options: [
            o('default', 'Default'),
            o('highlighted', 'Highlighted'),
            o('selected', 'Selected'),
            o('disabled', 'Disabled'),
            o('danger', 'Danger'),
        ],
        default: 'highlighted',
    },
];

const popoverItemRows = [
    {
        label: 'Anna de Vries',
        email: 'anna@northwind.com',
        initials: 'AV',
        role: 'Owner',
        region: 'NL',
        icon: <UserRound {...previewIcon} />,
        shortcut: '⌘1',
        count: 12,
    },
    {
        label: 'Bram Jansen',
        email: 'bram@northwind.com',
        initials: 'BJ',
        role: 'Admin',
        region: 'BE',
        icon: <Users {...previewIcon} />,
        shortcut: '⌘2',
        count: 4,
    },
    {
        label: 'Chloé Martin',
        email: 'chloe@northwind.com',
        initials: 'CM',
        role: 'Member',
        region: 'FR',
        icon: <Mail {...previewIcon} />,
        shortcut: '⌘3',
        count: 31,
    },
];

/**
 * The rows on their own, in a popup's panel: the states are set by hand, as Base UI would set them,
 * and the highlight follows the pointer as it does in a real list.
 */
const PopoverItemPreview = ({ knobs }: PreviewProps) => {
    const [pointed, setPointed] = useState<number>();

    return (
        <div
            onPointerLeave={() => setPointed(undefined)}
            className="flex w-80 flex-col gap-1 rounded-item border border-neutral-200 bg-neutral-50 p-1 shadow-float"
        >
            {popoverItemRows.map((row, index) => {
                const middle = index === 1;
                // The pointer takes the highlight, as Base UI moves it; the knob's state shows otherwise.
                const state =
                    pointed !== undefined && knobs.state === 'highlighted'
                        ? pointed === index
                            ? 'highlighted'
                            : 'default'
                        : middle
                          ? knobs.state
                          : 'default';
                const hovered = pointed === index && state !== 'disabled';
                const danger = state === 'danger';
                // The picked row: the middle one when it is selected, the first otherwise.
                const picked = knobs.state === 'selected' ? middle : index === 0;

                const leading = danger ? (
                    <Trash2 {...previewIcon} />
                ) : knobs.leading === 'icon' ? (
                    row.icon
                ) : knobs.leading === 'avatar' ? (
                    <Avatar
                        fallback={row.initials}
                        shape="round"
                        size={knobs.description ? 32 : 24}
                    />
                ) : knobs.leading === 'checkbox' ? (
                    <PopoverItemIndicator />
                ) : knobs.leading === 'radio' ? (
                    <PopoverItemIndicator kind="radio" />
                ) : knobs.leading === 'chip' ? (
                    <Badge>{row.region}</Badge>
                ) : undefined;

                const trailing =
                    knobs.trailing === 'check' ? (
                        picked && <Check {...previewIcon} />
                    ) : knobs.trailing === 'shortcut' ? (
                        <PopoverItemShortcut>{row.shortcut}</PopoverItemShortcut>
                    ) : knobs.trailing === 'count' ? (
                        <span className="tabular-nums">{row.count}</span>
                    ) : knobs.trailing === 'chevron' ? (
                        <ChevronRight {...previewIcon} />
                    ) : knobs.trailing === 'several' ? (
                        <>
                            {index === 0 && <Star {...previewIcon} />}
                            <PopoverItemShortcut>{row.shortcut}</PopoverItemShortcut>
                        </>
                    ) : undefined;

                return (
                    <PopoverItem
                        // A checkbox or radio list marks its picked row checked, as a menu would.
                        data-checked={
                            (knobs.leading === 'checkbox' || knobs.leading === 'radio') &&
                            picked &&
                            state !== 'selected'
                                ? true
                                : undefined
                        }
                        data-disabled={state === 'disabled' || undefined}
                        data-highlighted={state === 'highlighted' || hovered || undefined}
                        data-selected={state === 'selected' || undefined}
                        description={
                            knobs.description
                                ? danger
                                    ? 'Removes them from the workspace'
                                    : row.email
                                : undefined
                        }
                        key={row.label}
                        leading={leading}
                        onPointerEnter={() => setPointed(index)}
                        meta={
                            danger ? undefined : knobs.meta === 'badge' ? (
                                <Badge>{row.role}</Badge>
                            ) : knobs.meta === 'text' ? (
                                index === 0 ? (
                                    'you'
                                ) : (
                                    row.role.toLowerCase()
                                )
                            ) : undefined
                        }
                        trailing={trailing}
                        variant={danger ? 'danger' : 'default'}
                    >
                        {danger ? 'Remove member' : row.label}
                    </PopoverItem>
                );
            })}
        </div>
    );
};

export const entry: Entry = {
    id: 'popover-item',
    name: 'Popover item',
    category: 'overlays',
    description: 'The row every popup list is made of: options, actions, filters and commands.',
    knobs: popoverItemKnobs,
    Preview: PopoverItemPreview,
};
