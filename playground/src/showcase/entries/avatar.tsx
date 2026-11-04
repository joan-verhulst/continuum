import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { EllipsisVertical, UserPlus } from 'lucide-react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
} from '../kit';

const avatarKnobs: Knob[] = [
    { id: 'shape', label: 'Shape', options: opts('round', 'square'), default: 'round' },
    { id: 'size', label: 'Size', options: [o('24', '24px'), o('32', '32px')], default: '32' },
    { id: 'initials', label: 'Initials', switch: true, default: true },
    { id: 'stack', label: 'Stack of six, max 4', switch: true, default: false },
];

const AvatarPreview = ({ knobs }: PreviewProps) => {
    const shape = knobs.shape === 'square' ? 'square' : 'round';
    const size = knobs.size === '24' ? 24 : 32;

    if (knobs.stack) {
        return (
            <AvatarStack max={4}>
                {['AS', 'TB', 'RV', 'EP', 'JL', 'MK'].map(initials => (
                    <Avatar
                        fallback={knobs.initials ? initials : undefined}
                        key={initials}
                        shape={shape}
                        size={size}
                    />
                ))}
            </AvatarStack>
        );
    }

    return <Avatar fallback={knobs.initials ? 'AS' : undefined} shape={shape} size={size} />;
};

export const entry: Entry = {
    id: 'avatar',
    name: 'Avatar',
    category: 'labels',
    description: 'Square for workspaces, round for people, stacked.',
    knobs: avatarKnobs,
    Preview: AvatarPreview,
};

const members = [
    {
        initials: 'MC',
        name: 'Maya Chen',
        email: 'maya@acme.com',
        role: 'Owner',
        seen: 'Online now',
        shape: 'round',
    },
    {
        initials: 'LO',
        name: 'Liam Ortiz',
        email: 'liam@acme.com',
        role: 'Admin',
        seen: '18 min ago',
        shape: 'round',
    },
    {
        initials: 'SK',
        name: 'Sara Kim',
        email: 'sara@acme.com',
        role: 'Member',
        seen: 'Yesterday',
        shape: 'round',
    },
    {
        initials: 'NP',
        name: 'Noah Patel',
        email: 'noah@acme.com',
        role: 'Member',
        seen: '3 days ago',
        shape: 'round',
    },
    {
        initials: 'NT',
        name: 'Northwind Traders',
        email: 'Guest workspace · 3 people',
        role: 'Guest',
        seen: 'Last week',
        shape: 'square',
    },
] as const;

const Members = () => (
    <AppWindow
        actions={
            <Button>
                <UserPlus {...icon} /> Invite people
            </Button>
        }
        description={
            <span className="inline-flex items-center gap-2.5">
                <AvatarStack max={5}>
                    {['MC', 'LO', 'SK', 'NP', 'EB', 'JV', 'TD'].map(initials => (
                        <Avatar fallback={initials} key={initials} shape="round" size={24} />
                    ))}
                </AvatarStack>
                7 people in Acme, 2 invites pending
            </span>
        }
        place="settings"
        title="Members"
        trail={['Settings', 'Members']}
    >
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.map(member => (
                    <TableRow key={member.name}>
                        <TableCell>
                            <span className="flex items-center gap-3">
                                <Avatar fallback={member.initials} shape={member.shape} />
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium text-neutral-950">
                                        {member.name}
                                    </span>
                                    <span className="truncate text-neutral-600">
                                        {member.email}
                                    </span>
                                </span>
                            </span>
                        </TableCell>
                        <TableCell>
                            <Badge tone={member.role === 'Owner' ? 'primary' : 'neutral'}>
                                {member.role}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-600">{member.seen}</TableCell>
                        <TableCell>
                            <Button
                                aria-label={`More for ${member.name}`}
                                size="icon-sm"
                                variant="ghost"
                            >
                                <EllipsisVertical {...icon} />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Members',
    note: 'The members of a workspace: people round, a guest workspace square, everyone stacked in the head.',
    app: true,
    render: () => <Members />,
};
