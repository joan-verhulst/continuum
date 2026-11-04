import { Badge, Button, Chip, ChipAction, EmptyState } from 'continuum';
import { CalendarDays, CircleAlert, CircleCheck, FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps, previewIcon } from '../kit';

const emptyKnobs: Knob[] = [
    {
        id: 'kind',
        label: 'Why it is empty',
        options: [o('first', 'Nothing yet'), o('filtered', 'Filtered to nothing')],
        default: 'first',
    },
    { id: 'icon', label: 'Icon', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
];

const EmptyStatePreview = ({ knobs }: PreviewProps) =>
    knobs.kind === 'filtered' ? (
        <EmptyState
            action={knobs.action && <Button variant="secondary">Clear filters</Button>}
            className="w-[460px]"
            description="No invoices are overdue and owned by Bram Jansen."
            icon={knobs.icon && <Search {...previewIcon} />}
            title="Nothing matches these filters"
        />
    ) : (
        <EmptyState
            action={
                knobs.action && (
                    <Button variant="secondary">
                        New invoice <Plus {...previewIcon} />
                    </Button>
                )
            }
            className="w-[460px]"
            description="Invoices you send show up here, with when they are due and who has paid."
            icon={knobs.icon && <FileText {...previewIcon} />}
            title="No invoices yet"
        />
    );

export const entry: Entry = {
    id: 'empty-state',
    name: 'Empty state',
    category: 'messages',
    description: 'A dashed panel saying what goes here, with one action.',
    knobs: emptyKnobs,
    Preview: EmptyStatePreview,
};

const overdueInvoices = [
    { number: 'INV-0139', client: 'Globex', amount: '€1,860.00' },
    { number: 'INV-0134', client: 'Umbrella', amount: '€2,340.00' },
];

const NoOverdue = () => {
    const [filtered, setFiltered] = useState(true);

    return (
        <div className="flex w-full max-w-xl flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-950 text-sm">Invoices</p>
                <Button>
                    New invoice <Plus {...icon} />
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Chip icon={<CalendarDays {...icon} />}>This quarter</Chip>
                {filtered ? (
                    <Chip
                        icon={<CircleAlert {...icon} />}
                        action={
                            <ChipAction
                                label="Remove the overdue filter"
                                onClick={() => setFiltered(false)}
                            />
                        }
                    >
                        Status is Overdue
                    </Chip>
                ) : (
                    <Button onClick={() => setFiltered(true)} variant="ghost">
                        <Plus {...icon} /> Overdue only
                    </Button>
                )}
            </div>
            {filtered ? (
                <EmptyState
                    action={
                        <Button onClick={() => setFiltered(false)} variant="secondary">
                            Show all invoices
                        </Button>
                    }
                    description="Everything sent this quarter has been paid or is not due yet."
                    icon={<CircleCheck {...icon} />}
                    title="No overdue invoices"
                />
            ) : (
                <ul className="flex flex-col gap-3">
                    {overdueInvoices
                        .map(invoice => ({ ...invoice, status: 'Due soon' }))
                        .map(invoice => (
                            <li className="flex items-center gap-3 text-xs" key={invoice.number}>
                                <span className="w-20 shrink-0 text-neutral-500 tabular-nums">
                                    {invoice.number}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                                    {invoice.client}
                                </span>
                                <Badge tone="warning">{invoice.status}</Badge>
                                <span className="w-20 shrink-0 text-right text-neutral-900 tabular-nums">
                                    {invoice.amount}
                                </span>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};

export const inUse: InUse = {
    title: 'Filtered to nothing',
    note: 'A filter that matches nothing says so, and offers the way back.',
    render: () => <NoOverdue />,
};
