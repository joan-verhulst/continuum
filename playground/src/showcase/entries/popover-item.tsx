import {
    Avatar,
    Badge,
    Button,
    Popover,
    PopoverContent,
    PopoverItem,
    PopoverItemIndicator,
    PopoverItemShortcut,
    PopoverTrigger,
} from 'continuum';
import { Check, ChevronRight, Mail, Star, Trash2, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
} from '../kit';

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

const members = [
    { name: 'Anna de Vries', email: 'anna@acme.com', initials: 'AV', role: 'Owner', open: 12 },
    { name: 'Bram Jansen', email: 'bram@acme.com', initials: 'BJ', role: 'Admin', open: 4 },
    { name: 'Chloé Martin', email: 'chloe@acme.com', initials: 'CM', role: 'Member', open: 31 },
    { name: 'Noah Patel', email: 'noah@acme.com', initials: 'NP', role: 'Member', open: 7 },
];

const AssignOwner = () => {
    const stage = useStageContainer();
    const [owner, setOwner] = useState('Bram Jansen');
    const [pointed, setPointed] = useState<string>();
    const current = members.find(member => member.name === owner);

    return (
        <Popover modal={false} open>
            <PopoverTrigger render={<Button variant="secondary" />}>
                <Avatar fallback={current?.initials ?? '?'} size={24} />
                {owner}
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 gap-1 p-1"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <p className="px-3 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs">
                    Who follows up on this invoice
                </p>
                <div className="flex flex-col gap-1" onPointerLeave={() => setPointed(undefined)}>
                    {members.map(member => (
                        <PopoverItem
                            aria-pressed={member.name === owner}
                            data-highlighted={member.name === pointed || undefined}
                            description={member.email}
                            key={member.name}
                            leading={<Avatar fallback={member.initials} shape="round" size={32} />}
                            meta={<Badge>{member.role}</Badge>}
                            onClick={() => setOwner(member.name)}
                            onBlur={() => setPointed(undefined)}
                            onFocus={() => setPointed(member.name)}
                            onPointerEnter={() => setPointed(member.name)}
                            // A button each, so the rows take the keyboard as well as the pointer.
                            render={<button className="w-full text-left" type="button" />}
                            trailing={
                                member.name === owner ? (
                                    <Check {...icon} />
                                ) : (
                                    <span className="tabular-nums">{member.open} open</span>
                                )
                            }
                        >
                            {member.name}
                        </PopoverItem>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const inUse: InUse = {
    title: 'Assign an owner',
    note: 'The owner picker on an invoice: each row a person with their role, email and open invoices, the owner ticked.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'top',
                place: 'invoices',
                title: 'INV-0142',
                description: 'Acme Corp · €4,120.00 · due 26 October.',
                actions: <AssignOwner />,
                children: (
                    <p className="max-w-150 text-neutral-700 text-sm leading-relaxed">
                        Sent on 12 October; viewed twice since. A reminder goes out three days
                        before it is due, unless it is paid first.
                    </p>
                ),
            }}
        />
    ),
};
