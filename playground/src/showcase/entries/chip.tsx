import { Button, Card, CardHeader, CardTitle, Chip, ChipAction } from 'continuum';
import { CalendarDays, Globe, Mail, Monitor, Pencil, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const chipKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('soft', 'outline'), default: 'soft' },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 25px'), o('md', 'md · 29px')],
        default: 'sm',
    },
    { id: 'click', label: 'Takes a click', switch: true, default: false },
    {
        id: 'action',
        label: 'Action',
        options: [o('remove', 'Remove'), o('edit', 'Edit'), o('none', 'None')],
        default: 'remove',
    },
    { id: 'icon', label: 'Icon', switch: true, default: true },
];

const initialFilters = [
    { id: 'range', label: 'Last 30 days', Icon: CalendarDays },
    { id: 'country', label: 'Country is Netherlands', Icon: Globe },
    { id: 'device', label: 'Device is mobile', Icon: Users },
];

const ChipPreview = ({ knobs }: PreviewProps) => {
    const [filters, setFilters] = useState(initialFilters);
    const [last, setLast] = useState<string>();
    const variant = knobs.variant as 'soft' | 'outline';
    const size = knobs.size as 'sm' | 'md';

    return (
        <div className="flex max-w-96 flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {filters.map(filter => (
                    <Chip
                        action={
                            knobs.action === 'remove' ? (
                                <ChipAction
                                    onClick={() =>
                                        setFilters(current =>
                                            current.filter(item => item.id !== filter.id),
                                        )
                                    }
                                />
                            ) : knobs.action === 'edit' ? (
                                <ChipAction
                                    label={`Edit ${filter.label}`}
                                    onClick={() => setLast(`Editing ${filter.label}`)}
                                >
                                    <Pencil aria-hidden strokeWidth={2} />
                                </ChipAction>
                            ) : undefined
                        }
                        icon={knobs.icon ? <filter.Icon {...previewIcon} /> : undefined}
                        key={filter.id}
                        onClick={knobs.click ? () => setLast(`Opened ${filter.label}`) : undefined}
                        size={size}
                        variant={variant}
                    >
                        {filter.label}
                    </Chip>
                ))}
                {filters.length < initialFilters.length && (
                    <Button
                        onClick={() => setFilters(initialFilters)}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <Plus {...previewIcon} />
                        <span className="sr-only">Restore filters</span>
                    </Button>
                )}
            </div>
            <span className="text-neutral-500 text-xxs">
                {last ?? 'Click a chip or its action'}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'chip',
    name: 'Chip',
    category: 'filtering',
    description: 'A short value in a pill that can take a click and end in one action.',
    knobs: chipKnobs,
    Preview: ChipPreview,
};

const initialFiltersInUse = [
    { id: 'country', icon: <Globe {...icon} />, label: 'Country is Netherlands' },
    { id: 'device', icon: <Monitor {...icon} />, label: 'Device is desktop' },
    { id: 'source', icon: <Mail {...icon} />, label: 'Source is newsletter' },
];

const FilteredSessions = () => {
    const [filters, setFilters] = useState(initialFiltersInUse);
    const count = filters.length === 0 ? 12480 : 1284 * (4 - filters.length);

    return (
        <Card className="w-full max-w-xl gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sessions</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">
                    {count.toLocaleString('en-GB')} sessions
                </span>
            </CardHeader>
            <div className="flex flex-wrap items-center gap-2">
                <Chip icon={<CalendarDays {...icon} />}>Last 30 days</Chip>
                {filters.map(filter => (
                    <Chip
                        icon={filter.icon}
                        key={filter.id}
                        action={
                            <ChipAction
                                onClick={() =>
                                    setFilters(current =>
                                        current.filter(item => item.id !== filter.id),
                                    )
                                }
                            />
                        }
                    >
                        {filter.label}
                    </Chip>
                ))}
                {filters.length < initialFiltersInUse.length ? (
                    <Button onClick={() => setFilters(initialFiltersInUse)} variant="ghost">
                        <Plus {...icon} /> Add filter
                    </Button>
                ) : (
                    <Button onClick={() => setFilters([])} variant="ghost">
                        Clear all
                    </Button>
                )}
            </div>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Applied filters',
    note: 'Every filter as a chip that removes itself, over the number it narrows.',
    canvas: true,
    render: () => <FilteredSessions />,
};
