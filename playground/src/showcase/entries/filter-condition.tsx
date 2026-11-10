import {
    Badge,
    defaultFilterOperator,
    FilterCondition,
    FilterConditionAdd,
    FilterConditionField,
    FilterConditionOperator,
    FilterConditionRemove,
    FilterConditions,
    FilterConditionValue,
    type FilterField,
    filterOperators,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableConditions,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
} from 'continuum';
import { CircleCheck, Tag, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, type Knob, type PreviewProps } from '../kit';

type Kind = keyof typeof filterOperators;

type FieldDef = FilterField & { kind: Kind; options: string[] };

const statusField: FieldDef = {
    id: 'status',
    label: 'Status',
    icon: <CircleCheck {...icon} />,
    kind: 'many',
    options: ['Paid', 'Due soon', 'Overdue'],
};

const fields: FieldDef[] = [
    statusField,
    {
        id: 'owner',
        label: 'Owner',
        icon: <UserRound {...icon} />,
        kind: 'many',
        options: ['Anna de Vries', 'Bram Jansen', 'Chloé Martin'],
    },
    {
        id: 'tag',
        label: 'Tag',
        icon: <Tag {...icon} />,
        kind: 'one',
        options: ['Retainer', 'Project', 'Licence'],
    },
];

export type Condition = { field: string; operator: string; values: string[] };

const fieldOf = (id: string): FieldDef => fields.find(field => field.id === id) ?? statusField;

type ConditionsProps = {
    conditions: Condition[];
    onChange: (next: Condition[]) => void;
    searchable?: boolean;
    container?: HTMLElement;
};

/** The button that adds a condition, offering the fields not yet applied. */
export const AddCondition = ({ conditions, onChange, searchable, container }: ConditionsProps) => (
    <FilterConditionAdd
        container={container}
        fields={fields.filter(field => !conditions.some(c => c.field === field.id))}
        onAdd={id =>
            onChange([
                ...conditions,
                { field: id, operator: defaultFilterOperator(fieldOf(id).kind), values: [] },
            ])
        }
        searchable={searchable}
    />
);

/**
 * The applied conditions and Clear all; on their own (`withAdd`) the add button follows them, in a
 * table it sits at the right end of the conditions row instead.
 */
export const Conditions = ({
    conditions,
    onChange,
    searchable,
    container,
    withAdd = true,
}: ConditionsProps & { withAdd?: boolean }) => {
    const update = (index: number, patch: Partial<Condition>) =>
        onChange(conditions.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    return (
        <FilterConditions
            add={
                withAdd && (
                    <AddCondition
                        conditions={conditions}
                        container={container}
                        onChange={onChange}
                        searchable={searchable}
                    />
                )
            }
            onClear={conditions.length > 0 ? () => onChange([]) : undefined}
        >
            {conditions.map((condition, index) => {
                const field = fieldOf(condition.field);
                return (
                    <FilterCondition aria-label={`${field.label} filter`} key={condition.field}>
                        <FilterConditionField icon={field.icon}>{field.label}</FilterConditionField>
                        <FilterConditionOperator
                            container={container}
                            onValueChange={operator => update(index, { operator })}
                            options={filterOperators[field.kind]}
                            value={condition.operator}
                        />
                        <FilterConditionValue
                            container={container}
                            multiple={field.kind === 'many'}
                            onValueChange={values => update(index, { values })}
                            options={field.options.map(value => ({ value }))}
                            searchable={searchable}
                            value={condition.values}
                        />
                        <FilterConditionRemove
                            aria-label={`Remove the ${String(field.label).toLowerCase()} filter`}
                            onClick={() => onChange(conditions.filter((_, i) => i !== index))}
                        />
                    </FilterCondition>
                );
            })}
        </FilterConditions>
    );
};

const knobs: Knob[] = [
    { id: 'searchable', label: 'Search in menus', switch: true, default: false },
];

const Preview = ({ knobs }: PreviewProps) => {
    // Off a stage (an in-use piece) the menus portal to the page, not into nothing.
    const stage = useStageContainer() ?? undefined;
    const [conditions, setConditions] = useState<Condition[]>([
        { field: 'status', operator: 'any', values: ['Due soon', 'Overdue'] },
    ]);

    return (
        // Narrow enough to clear the knobs panel; a second condition is one click away.
        <div className="flex w-130 justify-center pb-48">
            <Conditions
                conditions={conditions}
                container={stage}
                onChange={setConditions}
                searchable={Boolean(knobs.searchable)}
            />
        </div>
    );
};

export const entry: Entry = {
    id: 'filter-condition',
    name: 'Filter conditions',
    category: 'filtering',
    description: 'Each filter a sentence, field · operator · value, every part of it the control.',
    hero: 'min-h-100',
    knobs,
    Preview,
};

export const invoices = [
    {
        number: 'INV-0142',
        client: 'Acme Corp',
        status: 'Due soon',
        owner: 'Anna de Vries',
        amount: '€4,120.00',
    },
    {
        number: 'INV-0141',
        client: 'Northwind Traders',
        status: 'Paid',
        owner: 'Bram Jansen',
        amount: '€1,980.00',
    },
    {
        number: 'INV-0139',
        client: 'Globex',
        status: 'Overdue',
        owner: 'Bram Jansen',
        amount: '€1,860.00',
    },
    {
        number: 'INV-0137',
        client: 'Initech',
        status: 'Paid',
        owner: 'Anna de Vries',
        amount: '€920.00',
    },
    {
        number: 'INV-0134',
        client: 'Umbrella Health',
        status: 'Overdue',
        owner: 'Chloé Martin',
        amount: '€2,340.00',
    },
    {
        number: 'INV-0132',
        client: 'Soylent Labs',
        status: 'Due soon',
        owner: 'Chloé Martin',
        amount: '€1,560.00',
    },
];

export const tone: Record<string, 'success' | 'warning' | 'error'> = {
    Paid: 'success',
    'Due soon': 'warning',
    Overdue: 'error',
};

export const matches = (invoice: (typeof invoices)[number], condition: Condition) => {
    const value = condition.field === 'status' ? invoice.status : invoice.owner;
    if (condition.field === 'tag') return true;
    if (condition.values.length === 0) return true;
    const hit = condition.values.includes(value);
    return condition.operator === 'none' ? !hit : hit;
};

const NarrowedInvoices = () => {
    // Off a stage (an in-use piece) the menus portal to the page, not into nothing.
    const stage = useStageContainer() ?? undefined;
    const [owner, setOwner] = useState('any');
    const [conditions, setConditions] = useState<Condition[]>([
        { field: 'status', operator: 'any', values: ['Due soon', 'Overdue'] },
    ]);
    const rows = invoices.filter(
        invoice =>
            (owner === 'any' || invoice.owner === owner) &&
            conditions.every(c => matches(invoice, c)),
    );
    // At the right of the conditions row while there is one, in the bar while there are none.
    const add = <AddCondition conditions={conditions} container={stage} onChange={setConditions} />;

    return (
        <Table
            toolbar={
                <>
                    <TableToolbar>
                        <TableSearch aria-label="Search invoices" placeholder="Search invoices" />
                        <TableToolbarEnd>
                            <Select onValueChange={value => setOwner(String(value))} value={owner}>
                                <SelectTrigger aria-label="Owner" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end" container={stage}>
                                    <SelectItem value="any">Any owner</SelectItem>
                                    <SelectItem value="Anna de Vries">Anna de Vries</SelectItem>
                                    <SelectItem value="Bram Jansen">Bram Jansen</SelectItem>
                                    <SelectItem value="Chloé Martin">Chloé Martin</SelectItem>
                                </SelectContent>
                            </Select>
                            {conditions.length === 0 && add}
                        </TableToolbarEnd>
                    </TableToolbar>
                    {conditions.length > 0 && (
                        <TableConditions>
                            <Conditions
                                conditions={conditions}
                                container={stage}
                                onChange={setConditions}
                                withAdd={false}
                            />
                            <TableToolbarEnd>{add}</TableToolbarEnd>
                        </TableConditions>
                    )}
                </>
            }
        >
            <TableHeader>
                <TableRow>
                    <TableHead className="w-28">Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-36">Owner</TableHead>
                    <TableHead className="w-28" numeric>
                        Amount
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map(invoice => (
                    <TableRow key={invoice.number}>
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell>
                            <Badge tone={tone[invoice.status]}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="font-normal text-neutral-700">
                            {invoice.owner}
                        </TableCell>
                        <TableCell numeric>{invoice.amount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const inUse: InUse = {
    title: 'Invoices, narrowed',
    note: 'The table’s bar keeps the search and a select; the conditions sit in a row of their own under it.',
    canvas: true,
    render: () => <NarrowedInvoices />,
};
