import {
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Mail, Plus, Send } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon, previewIcon } from '../kit';

const steps = [
    { subject: 'Welcome to Northwind', delay: 'Immediately', sent: 1240, opened: 812 },
    { subject: 'Set up your first report', delay: '1 day', sent: 1188, opened: 604 },
    { subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
];

const TablePreview = () => (
    <Table wrapperClassName="w-full">
        <TableHeader>
            <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead numeric>Sent</TableHead>
                <TableHead numeric>Open rate</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {steps.map(step => (
                <TableRow key={step.subject}>
                    <TableCell>
                        <span className="inline-flex items-center gap-2">
                            <Mail className="size-4 text-neutral-600" {...previewIcon} />
                            {step.subject}
                        </span>
                    </TableCell>
                    <TableCell className="font-normal text-neutral-600">{step.delay}</TableCell>
                    <TableCell numeric>{step.sent.toLocaleString('en-US')}</TableCell>
                    <TableCell numeric>
                        <Badge tone={step.opened / step.sent > 0.5 ? 'success' : 'neutral'}>
                            {Math.round((step.opened / step.sent) * 100)}%
                        </Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export const entry: Entry = {
    id: 'table',
    name: 'Table',
    category: 'content',
    description: 'Ruled for data you work through, rows for ranked lists.',
    span: 2,
    Preview: TablePreview,
};

const phases = [
    {
        title: 'Welcome',
        hint: 'day 0 to 3',
        steps: [
            { subject: 'Welcome to Acme', delay: 'Immediately', sent: 1240, opened: 812 },
            { subject: 'Send your first invoice', delay: '1 day', sent: 1188, opened: 604 },
        ],
    },
    {
        title: 'Activation',
        hint: 'week 1 to 2',
        steps: [
            { subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
            { subject: 'Get paid faster with reminders', delay: '7 days', sent: 1001, opened: 538 },
            { subject: 'Your first month in numbers', delay: '14 days', sent: 980, opened: 520 },
        ],
    },
];

const SequenceTable = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Send {...icon} /> Send a test
                </Button>
                <Button>
                    <Plus {...icon} /> Add email
                </Button>
            </>
        }
        description="Five emails over two weeks, sent to every new customer."
        nav="top"
        place="customers"
        title="Onboarding sequence"
    >
        <Table wrapperClassName="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead numeric>Sent</TableHead>
                    <TableHead numeric>Opened</TableHead>
                    <TableHead numeric>Open rate</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {phases.map(phase => [
                    <TableGroupRow hint={phase.hint} key={phase.title}>
                        {phase.title}
                    </TableGroupRow>,
                    ...phase.steps.map(step => (
                        <TableRow key={step.subject}>
                            <TableCell>
                                <span className="inline-flex items-center gap-2">
                                    <Mail className="size-4 text-neutral-600" {...icon} />
                                    {step.subject}
                                </span>
                            </TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {step.delay}
                            </TableCell>
                            <TableCell numeric>{step.sent.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>{step.opened.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>
                                <Badge tone={step.opened / step.sent > 0.5 ? 'success' : 'neutral'}>
                                    {Math.round((step.opened / step.sent) * 100)}%
                                </Badge>
                            </TableCell>
                        </TableRow>
                    )),
                ])}
            </TableBody>
        </Table>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Onboarding sequence',
    note: 'A sequence’s emails in a ruled table, grouped into phases, the numbers right-aligned.',
    app: true,
    render: () => <SequenceTable />,
};
