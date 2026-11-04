import {
    Avatar,
    Badge,
    Button,
    DialogDescription,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsList,
    TabsTrigger,
    Textarea,
} from 'continuum';
import { UserPlus } from 'lucide-react';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    opts,
    type PreviewProps,
} from '../kit';

const fieldKnobs: Knob[] = [
    { id: 'control', label: 'Control', options: opts('input', 'textarea'), default: 'input' },
    { id: 'helper', label: 'Helper', switch: true, default: true },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const FieldPreview = ({ knobs }: PreviewProps) => (
    <Field className="w-64" disabled={Boolean(knobs.disabled)} invalid={Boolean(knobs.invalid)}>
        <FieldLabel>{knobs.control === 'textarea' ? 'Notes' : 'Invoice number'}</FieldLabel>
        {knobs.control === 'textarea' ? (
            <Textarea className="min-h-16" placeholder="Add a note for the client" />
        ) : (
            <Input defaultValue="INV-2025-0142" size="sm" />
        )}
        {knobs.helper && (
            <FieldHelper>
                {knobs.invalid
                    ? 'This number is already in use.'
                    : 'Shown on every page of the invoice.'}
            </FieldHelper>
        )}
    </Field>
);

export const entry: Entry = {
    id: 'field',
    name: 'Field and textarea',
    category: 'inputs',
    description: 'Label, control and helper wired together, invalid included.',
    knobs: fieldKnobs,
    Preview: FieldPreview,
};

const members = [
    { name: 'Maya Chen', initials: 'MC', email: 'maya@acme.app', role: 'Owner', seen: 'Now' },
    {
        name: 'Liam Ortiz',
        initials: 'LO',
        email: 'liam@acme.app',
        role: 'Admin',
        seen: '1 hour ago',
    },
    { name: 'Sara Kim', initials: 'SK', email: 'sara@acme.app', role: 'Member', seen: 'Yesterday' },
    {
        name: 'Noah Patel',
        initials: 'NP',
        email: 'noah@acme.app',
        role: 'Member',
        seen: '3 days ago',
    },
];

// The settings page the invite was opened from.
const MemberList = () => (
    <div className="flex flex-col gap-6">
        <Tabs defaultValue="members">
            <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
        </Tabs>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Last active</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.map(member => (
                    <TableRow key={member.email}>
                        <TableCell>
                            <span className="flex items-center gap-2.5">
                                <Avatar fallback={member.initials} shape="round" size={24} />
                                <span className="text-neutral-950">{member.name}</span>
                                <span className="font-normal text-neutral-500">{member.email}</span>
                            </span>
                        </TableCell>
                        <TableCell>
                            <Badge>{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-normal text-neutral-600">
                            {member.seen}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

const InviteTeammate = () => (
    <OpenDialog footer={<DialogActions action="Send invite" />} title="Invite a teammate">
        <DialogDescription>They join Acme as a member and can see every report.</DialogDescription>
        <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Bram Jansen" />
        </Field>
        <Field invalid>
            <FieldLabel>Email</FieldLabel>
            <Input defaultValue="bram@northwind" />
            <FieldHelper>Add the domain, such as northwind.com.</FieldHelper>
        </Field>
        <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea className="min-h-16" placeholder="Optional; shown in the invite" />
            <FieldHelper>Up to 280 characters.</FieldHelper>
        </Field>
    </OpenDialog>
);

const MembersWithInvite = () => (
    <AppScene
        page={{
            place: 'settings',
            trail: ['Settings', 'Members'],
            title: 'Settings',
            description: 'The workspace, its members and how it bills.',
            actions: (
                <Button>
                    <UserPlus {...icon} /> Invite
                </Button>
            ),
            children: <MemberList />,
        }}
    >
        <InviteTeammate />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Invite a teammate',
    note: 'Labelled fields in a dialog over the members list, one invalid with its message, a textarea with a hint.',
    bare: true,
    render: () => <MembersWithInvite />,
};
