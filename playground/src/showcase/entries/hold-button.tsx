import {
    Avatar,
    Button,
    HoldButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@contui/ui';
import { RotateCcw, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const knobs: Knob[] = [
    {
        id: 'duration',
        label: 'Hold for',
        options: [o('600', '600 ms'), o('1000', '1000 ms'), o('1500', '1500 ms')],
        default: '1000',
    },
    {
        id: 'variant',
        label: 'Variant',
        options: [o('secondary', 'Secondary'), o('ghost', 'Ghost')],
        default: 'secondary',
    },
];

const HoldButtonPreview = ({ knobs: values }: PreviewProps) => {
    const [done, setDone] = useState(0);

    return (
        <div className="flex flex-col items-center gap-3">
            <HoldButton
                duration={Number(values.duration)}
                onConfirm={() => setDone(count => count + 1)}
                variant={values.variant === 'ghost' ? 'ghost' : 'secondary'}
            >
                <Trash2 {...icon} /> Hold to remove
            </HoldButton>
            <span aria-live="polite" className="text-neutral-600 text-xxs">
                {done === 0
                    ? 'Let go early and nothing happens'
                    : `Removed ${done === 1 ? 'once' : `${done} times`}`}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'hold-button',
    name: 'Hold button',
    category: 'actions',
    description:
        'A destructive action that runs once held: it fills over a second, and letting go sooner undoes nothing because nothing was done.',
    knobs,
    Preview: HoldButtonPreview,
};

const people = [
    { initials: 'LO', name: 'Liam Ortiz', email: 'liam@acme.com' },
    { initials: 'SK', name: 'Sara Kim', email: 'sara@acme.com' },
    { initials: 'NP', name: 'Noah Patel', email: 'noah@acme.com' },
    { initials: 'EB', name: 'Emma Brooks', email: 'emma@acme.com' },
];

/** Seats being freed one by one: each row removed by a hold, no dialog per person. */
const FreeSeats = () => {
    const [left, setLeft] = useState(people.map(person => person.name));
    const shown = people.filter(person => left.includes(person.name));

    return (
        <AppWindow
            actions={
                shown.length < people.length ? (
                    <Button
                        onClick={() => setLeft(people.map(person => person.name))}
                        variant="secondary"
                    >
                        <RotateCcw {...icon} /> Reset
                    </Button>
                ) : (
                    <Button>
                        <UserPlus {...icon} /> Invite people
                    </Button>
                )
            }
            description={`${shown.length} of 4 seats taken on the Team plan`}
            place="settings"
            title="Seats"
            trail={['Settings', 'Seats']}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-40">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shown.map(person => (
                        <TableRow key={person.name}>
                            <TableCell>
                                <span className="flex items-center gap-3">
                                    <Avatar fallback={person.initials} shape="round" />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate font-medium text-neutral-950">
                                            {person.name}
                                        </span>
                                        <span className="truncate text-neutral-600">
                                            {person.email}
                                        </span>
                                    </span>
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <HoldButton
                                    aria-label={`Hold to remove ${person.name}`}
                                    onConfirm={() =>
                                        setLeft(now => now.filter(name => name !== person.name))
                                    }
                                    variant="ghost"
                                >
                                    Hold to remove
                                </HoldButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Freeing seats',
    note: 'Members taken off a plan one after another: each row is removed by holding, with no dialog per person.',
    app: true,
    render: () => <FreeSeats />,
};
