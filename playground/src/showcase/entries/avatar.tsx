import { Avatar, AvatarStack, Badge, Card, CardHeader, CardTitle } from 'continuum';
import { type Entry, type InUse, type Knob, o, opts, type PreviewProps } from '../kit';

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
        initials: 'JC',
        name: 'Jane Cooper',
        email: 'jane@northwind.studio',
        role: 'Owner',
        shape: 'round',
    },
    {
        initials: 'BJ',
        name: 'Bram Jansen',
        email: 'bram@northwind.studio',
        role: 'Admin',
        shape: 'round',
    },
    {
        initials: 'EB',
        name: 'Eva Bakker',
        email: 'eva@northwind.studio',
        role: 'Member',
        shape: 'round',
    },
    { initials: 'AC', name: 'Acme Corp', email: 'Guest workspace', role: 'Guest', shape: 'square' },
] as const;

const TeamCard = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Team</CardTitle>
            <AvatarStack max={4}>
                {['JC', 'BJ', 'EB', 'DV', 'FS', 'CM'].map(initials => (
                    <Avatar fallback={initials} key={initials} shape="round" size={24} />
                ))}
            </AvatarStack>
        </CardHeader>
        <ul className="flex flex-col gap-3">
            {members.map(member => (
                <li className="flex items-center gap-3" key={member.name}>
                    <Avatar fallback={member.initials} shape={member.shape} />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-neutral-950 text-xs">
                            {member.name}
                        </span>
                        <span className="truncate text-neutral-500 text-xxs">{member.email}</span>
                    </span>
                    <Badge tone={member.role === 'Owner' ? 'primary' : 'neutral'}>
                        {member.role}
                    </Badge>
                </li>
            ))}
        </ul>
    </Card>
);

export const inUse: InUse = {
    title: 'Team',
    note: 'People round, a workspace square, the whole team stacked in the header.',
    canvas: true,
    render: () => <TeamCard />,
};
