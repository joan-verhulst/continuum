import {
    Avatar,
    Badge,
    BottomBar,
    Button,
    Checkbox,
    Input,
    Pagination,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Toolbar,
    ToolbarButton,
} from 'continuum';
import { Archive, Download, EllipsisVertical, Mail, Plus, Search, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { customers, formatEuro, PageHead, type Status, statusTone, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

const filters: ('All' | Status)[] = ['All', 'Active', 'Trial', 'Past due'];

/**
 * A list: search and filters over a ruled table, and pages at the foot. Selecting rows brings up
 * the bar of what can be done to them all, floating at the panel's foot.
 */
export const Customers = () => {
    const [status, setStatus] = useState<'All' | Status>('All');
    const [selected, setSelected] = useState<string[]>(['globex', 'initech']);
    const [page, setPage] = useState(1);
    const rows = customers.filter(customer => status === 'All' || customer.status === status);
    const all = rows.length > 0 && rows.every(row => selected.includes(row.id));

    const toggle = (id: string, on: boolean) =>
        setSelected(current => (on ? [...current, id] : current.filter(item => item !== id)));

    // What a selection is for: the bar holds the actions on it, and clears it.
    const bulk = selected.length > 0 && (
        <BottomBar floating>
            <Toolbar aria-label="Selected customers" variant="floating">
                <span className="flex items-center px-3 font-medium text-neutral-950 text-xs tabular-nums">
                    {selected.length} selected
                </span>
                <ToolbarButton>
                    <Mail {...icon} />
                    Message
                </ToolbarButton>
                <ToolbarButton>
                    <Download {...icon} />
                    Export
                </ToolbarButton>
                <ToolbarButton>
                    <Archive {...icon} />
                    Archive
                </ToolbarButton>
                <ToolbarButton aria-label="Clear the selection" onClick={() => setSelected([])}>
                    <X {...icon} />
                </ToolbarButton>
            </Toolbar>
        </BottomBar>
    );

    return (
        <Workspace bar={bulk} place="customers" trail={['Customers']} width="wide">
            <PageHead description="1,284 companies on a paid plan or a trial." title="Customers">
                <Button variant="secondary">
                    <Upload {...icon} />
                    Import
                </Button>
                <Button>
                    <Plus {...icon} />
                    New customer
                </Button>
            </PageHead>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Input
                        aria-label="Search customers"
                        className="w-64"
                        leadingIcon={<Search {...icon} />}
                        placeholder="Search customers"
                        size="sm"
                    />
                    <SegmentedControl
                        aria-label="Status"
                        onValueChange={value =>
                            setStatus(filters.find(filter => filter === value) ?? 'All')
                        }
                        value={status}
                    >
                        {filters.map(filter => (
                            <SegmentedControlItem key={filter} value={filter}>
                                {filter}
                            </SegmentedControlItem>
                        ))}
                    </SegmentedControl>
                    <Select defaultValue="any">
                        <SelectTrigger aria-label="Plan" className="w-36" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="any">Any plan</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-11">
                                <Checkbox
                                    aria-label="Select every customer"
                                    checked={all}
                                    onCheckedChange={on =>
                                        setSelected(on ? rows.map(row => row.id) : [])
                                    }
                                />
                            </TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="w-32">Plan</TableHead>
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead className="w-32 text-right">Monthly revenue</TableHead>
                            <TableHead className="w-44">Owner</TableHead>
                            <TableHead className="w-32">Last seen</TableHead>
                            <TableHead className="w-11">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map(customer => (
                            <TableRow
                                data-selected={selected.includes(customer.id) || undefined}
                                key={customer.id}
                            >
                                <TableCell>
                                    <Checkbox
                                        aria-label={`Select ${customer.name}`}
                                        checked={selected.includes(customer.id)}
                                        onCheckedChange={on => toggle(customer.id, on === true)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <span className="flex min-w-0 items-center gap-3">
                                        <Avatar
                                            alt={customer.name}
                                            fallback={customer.initials}
                                            size={24}
                                        />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-neutral-950">
                                                {customer.name}
                                            </span>
                                            <span className="truncate font-normal text-neutral-500 text-xxs">
                                                {customer.domain}
                                            </span>
                                        </span>
                                    </span>
                                </TableCell>
                                <TableCell className="font-normal text-neutral-700">
                                    {customer.plan}
                                </TableCell>
                                <TableCell>
                                    <Badge tone={statusTone[customer.status]}>
                                        {customer.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {customer.mrr ? formatEuro(customer.mrr) : '—'}
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2 font-normal text-neutral-700">
                                        <Avatar
                                            alt={customer.owner}
                                            fallback={customer.ownerInitials}
                                            shape="round"
                                            size={24}
                                        />
                                        {customer.owner}
                                    </span>
                                </TableCell>
                                <TableCell className="font-normal text-neutral-600">
                                    {customer.seen}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        aria-label={`Actions for ${customer.name}`}
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

                <Pagination
                    onPageChange={setPage}
                    page={page}
                    pageCount={129}
                    results={`Showing ${(page - 1) * 10 + 1}–${page * 10} of 1,284`}
                />
            </div>
        </Workspace>
    );
};
