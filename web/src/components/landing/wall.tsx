'use client';

import {
    ActivityItem,
    ActivityList,
    Alert,
    Avatar,
    Badge,
    BarList,
    BarListItem,
    BlockSlider,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Checklist,
    ChecklistItem,
    Chip,
    ChipAction,
    cn,
    DatePicker,
    DescriptionItem,
    DescriptionList,
    DropZone,
    DropZoneFile,
    DropZoneFiles,
    EmptyState,
    Field,
    FieldHelper,
    FieldLabel,
    FilterBar,
    FilterMenu,
    FilterMenuTrigger,
    IconTile,
    Input,
    Kbd,
    Meter,
    Pagination,
    RadioGroup,
    RadioGroupItem,
    ReadonlyField,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Skeleton,
    StatCard,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
    ToastProvider,
    useToast,
} from '@contui/ui';
import { ChartCard } from '@contui/ui/charts';
import {
    CircleCheck,
    Clock,
    Landmark,
    Mail,
    MoreHorizontal,
    Plus,
    Repeat,
    Send,
    Upload,
    Wallet,
} from 'lucide-react';
import {
    animate,
    type MotionValue,
    motion,
    useInView,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'motion/react';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

/* ---------- The board at work ---------- */

/** The pieces that are used while the board is on screen, one interaction at a time. */
type Actor = 'table' | 'tabs' | 'reminders' | 'filters' | 'setup' | 'fee' | 'terms' | 'upload';

/**
 * The order the pieces are used in, one per beat, looping. Each piece comes up a whole number of
 * times its states, so the loop ends where it began: the table and the tabs three times (three
 * states), the rest twice (there and back).
 */
const SCRIPT: Actor[] = [
    'table',
    'reminders',
    'tabs',
    'filters',
    'setup',
    'fee',
    'table',
    'terms',
    'upload',
    'tabs',
    'reminders',
    'filters',
    'table',
    'fee',
    'setup',
    'tabs',
    'terms',
    'upload',
];

/** A beat: long enough to see one change land before the next starts somewhere else. */
const BEAT_MS = 1600;

/** How many beats have passed since the board started playing; 0 is the board as drawn. */
const BeatContext = createContext(0);

/** How many times a piece has been used in the loop so far: its state is this, wrapped. */
const useStep = (actor: Actor) => {
    const beat = useContext(BeatContext);
    if (beat === 0) return 0;
    const at = (beat - 1) % SCRIPT.length;
    return SCRIPT.slice(0, at + 1).filter(name => name === actor).length;
};

/**
 * A number that eases to its target, for controls that only jump when set (the slider, an upload's
 * bar). Going back down it snaps, so a reset reads as a new start rather than a rewind.
 */
const useTween = (target: number, duration: number) => {
    const [value, setValue] = useState(target);
    const current = useRef(target);
    useEffect(() => {
        if (target < current.current) {
            current.current = target;
            setValue(target);
            return;
        }
        const control = animate(current.current, target, {
            duration,
            ease: [0.65, 0, 0.35, 1],
            onUpdate: next => {
                current.current = next;
                setValue(next);
            },
        });
        return () => control.stop();
    }, [target, duration]);
    return value;
};

/*
 * The kitchen-sink wall: the library laid out as a designer pins a system up, face on, on a dotted
 * board: some thirty small pieces made of the real components at their real size, never scaled, in
 * staggered columns that fill the frame. The frame crops them at its sides and foot, so a phone sees
 * the middle and a wide screen more.
 *
 * Every piece is one part used as its spec says, in one product: Kestrel Studio invoicing its four
 * clients, on Monday 16 November 2026. It is a picture: inert, out of the tab order and the outline.
 * While it is on screen it is used, one piece a beat: a filter picked, a tab opened, a switch
 * turned, each with its component's own motion. Still under reduced motion.
 */

const icon = { strokeWidth: 2 } as const;

/* ---------- The content, shared by every piece ---------- */

const invoices = [
    {
        number: 'INV-0142',
        client: 'Harbour & Co',
        initials: 'HC',
        due: '30 Nov',
        amount: '€2,420.00',
        status: 'Sent',
    },
    {
        number: 'INV-0141',
        client: 'Northwind',
        initials: 'NW',
        due: '27 Nov',
        amount: '€1,860.00',
        status: 'Sent',
    },
    {
        number: 'INV-0140',
        client: 'Lumen Labs',
        initials: 'LL',
        due: '4 Nov',
        amount: '€1,150.00',
        status: 'Overdue',
    },
    {
        number: 'INV-0139',
        client: 'Atlas Freight',
        initials: 'AF',
        due: '2 Nov',
        amount: '€3,200.00',
        status: 'Paid',
    },
] as const;

/** Status colour: waiting on someone `primary`, done `success`, late `error`. */
const tones = { Sent: 'primary', Paid: 'success', Overdue: 'error' } as const;

/* ---------- Figures ---------- */

/** The last twelve months, up to this one. */
const revenue = [
    { month: 'Dec', revenue: 31200, paid: 26400 },
    { month: 'Jan', revenue: 33800, paid: 29100 },
    { month: 'Feb', revenue: 32100, paid: 28800 },
    { month: 'Mar', revenue: 36900, paid: 31200 },
    { month: 'Apr', revenue: 38400, paid: 33900 },
    { month: 'May', revenue: 37200, paid: 32600 },
    { month: 'Jun', revenue: 41800, paid: 36100 },
    { month: 'Jul', revenue: 40100, paid: 35800 },
    { month: 'Aug', revenue: 43600, paid: 38900 },
    { month: 'Sep', revenue: 46200, paid: 40400 },
    { month: 'Oct', revenue: 45100, paid: 41200 },
    { month: 'Nov', revenue: 48210, paid: 43800 },
];

const euro = (value: number) => `€${Math.round(value / 1000)}k`;

/** The figure that leads: a chart card with its own head; no stat card repeats it. */
const RevenueChart = () => (
    <ChartCard
        className="w-full"
        comparison="on last year"
        data={revenue}
        delta="+18.2%"
        formatY={euro}
        height={170}
        icon={<Wallet />}
        series={[
            { key: 'revenue', name: 'Invoiced' },
            { key: 'paid', name: 'Paid' },
        ]}
        title="Revenue"
        value="€48,210"
        x="month"
        xTicks={6}
    />
);

const weekly = [
    { day: 'Mon', sent: 14 },
    { day: 'Tue', sent: 22 },
    { day: 'Wed', sent: 18 },
    { day: 'Thu', sent: 27 },
    { day: 'Fri', sent: 31 },
    { day: 'Sat', sent: 6 },
    { day: 'Sun', sent: 4 },
];

/** A comparison across whole periods: bars, in the kit's own card and padding. */
const SentChart = () => (
    <ChartCard
        className="w-full"
        comparison="on last week"
        data={weekly}
        delta="+9"
        height={110}
        kind="bar"
        series={[{ key: 'sent', name: 'Sent' }]}
        title="Invoices sent"
        value="122"
        x="day"
        xTicks={7}
    />
);

/** Key figures: stat cards in a row, 20 apart as the board's gap; each up-is-good. */
const KeyFigures = () => (
    <div className="grid grid-cols-3 gap-5">
        <StatCard delta="+4.2%" label="Paid on time" value="81%" />
        <StatCard delta="+3" label="Clients billed" value="24" />
        <StatCard delta="0 days" label="Days to get paid" trend="neutral" value="11" />
    </div>
);

/* ---------- Lists ---------- */

const statuses = ['open', 'paid', 'all'] as const;

/** Whether a row is in the view the status filter picks: open is everything not yet paid. */
const inView = (view: (typeof statuses)[number], status: keyof typeof tones) =>
    view === 'all' || (view === 'paid' ? status === 'Paid' : status !== 'Paid');

/**
 * A list of objects: the ruled table, its search and filters in its own toolbar. At work, the
 * status filter steps Open, Paid, All, and the rows outside the view fade back rather than leave,
 * so the board keeps its shape.
 */
const InvoiceTable = () => {
    const view = statuses[useStep('table') % statuses.length] ?? 'open';
    return (
        <Table
            toolbar={
                <TableToolbar>
                    <TableSearch aria-label="Search invoices" placeholder="Search invoices" />
                    <TableToolbarEnd>
                        <SegmentedControl aria-label="Status" value={view}>
                            <SegmentedControlItem value="all">All</SegmentedControlItem>
                            <SegmentedControlItem value="open">Open</SegmentedControlItem>
                            <SegmentedControlItem value="paid">Paid</SegmentedControlItem>
                        </SegmentedControl>
                        <FilterMenu>
                            <FilterMenuTrigger />
                        </FilterMenu>
                    </TableToolbarEnd>
                </TableToolbar>
            }
        >
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead numeric>Amount</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map(invoice => (
                    <TableRow
                        className={cn(
                            'transition-opacity duration-300',
                            !inView(view, invoice.status) && 'opacity-30',
                        )}
                        key={invoice.number}
                    >
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell>
                            <span className="inline-flex items-center gap-2">
                                <Avatar fallback={invoice.initials} size={24} />
                                {invoice.client}
                            </span>
                        </TableCell>
                        <TableCell className="font-normal text-neutral-700">
                            {invoice.due}
                        </TableCell>
                        <TableCell numeric>{invoice.amount}</TableCell>
                        <TableCell>
                            <Badge tone={tones[invoice.status]}>{invoice.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

/** A ranked breakdown: the bar list in a list card. */
const PaidBy = () => (
    <Card layout="list">
        <BarList title="Paid by" valueLabel="November">
            <BarListItem displayValue="€28,400" value={28400}>
                Bank transfer
            </BarListItem>
            <BarListItem displayValue="€9,600" value={9600}>
                Card
            </BarListItem>
            <BarListItem displayValue="€4,100" value={4100}>
                iDEAL
            </BarListItem>
            <BarListItem displayValue="€1,700" value={1700}>
                Direct debit
            </BarListItem>
        </BarList>
    </Card>
);

/** A history: the activity list in a list card, each event in its tone. */
const Activity = () => (
    <Card layout="list">
        <CardHeader>
            <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
            <ActivityList>
                <ActivityItem
                    icon={<Send {...icon} />}
                    time="Today, 10:24"
                    title="INV-0142 sent to Harbour & Co"
                />
                <ActivityItem
                    icon={<CircleCheck {...icon} />}
                    time="Today, 09:12"
                    title="Atlas Freight paid INV-0139"
                    tone="success"
                />
                <ActivityItem
                    icon={<Clock {...icon} />}
                    time="Yesterday"
                    title="Reminder sent to Lumen Labs"
                    tone="warning"
                />
            </ActivityList>
        </CardContent>
    </Card>
);

const team = [
    { name: 'Maya Chen', initials: 'MC', role: 'Owner' },
    { name: 'Liam Okafor', initials: 'LO', role: 'Finance' },
    { name: 'Sara Kim', initials: 'SK', role: 'Accountant' },
] as const;

/** People: a 24 avatar and the name, a divided list in a list card. */
const Team = () => (
    <Card className="[--card-gap:calc(var(--spacing)*2)]" layout="list">
        <CardHeader>
            <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="flex flex-col">
                {team.map(person => (
                    <li
                        className="flex h-table-row items-center gap-2 border-neutral-200 border-b text-xs last:border-b-0"
                        key={person.name}
                    >
                        <Avatar fallback={person.initials} shape="round" size={24} />
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {person.name}
                        </span>
                        <span className="text-neutral-600">{person.role}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

const shortcuts = [
    ['New invoice', ['N']],
    ['Search', ['⌘', 'K']],
    ['Send', ['⌘', '↵']],
    ['Mark as paid', ['P']],
] as const;

/** Shortcut keys: each command beside its Kbd, as the shortcut list draws them. */
const Shortcuts = () => (
    <Card className="[--card-gap:calc(var(--spacing)*2)]">
        <CardHeader>
            <CardTitle>Keyboard shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col">
                {shortcuts.map(([label, keys]) => (
                    <p
                        className="flex h-8 items-center justify-between gap-3 text-neutral-700 text-xs"
                        key={label}
                    >
                        {label}
                        <span className="flex items-center gap-1">
                            {keys.map(key => (
                                <Kbd key={key}>{key}</Kbd>
                            ))}
                        </span>
                    </p>
                ))}
            </div>
        </CardContent>
    </Card>
);

/* ---------- One object ---------- */

/** Key–value facts: the description list, its own bordered box. */
const InvoiceFacts = () => (
    <DescriptionList>
        <DescriptionItem term="Invoice">INV-0142</DescriptionItem>
        <DescriptionItem term="Client">Harbour &amp; Co</DescriptionItem>
        <DescriptionItem term="Due">30 November</DescriptionItem>
        <DescriptionItem term="Total">€2,420.00</DescriptionItem>
        <DescriptionItem term="Status">
            <Badge tone="primary">Sent</Badge>
        </DescriptionItem>
    </DescriptionList>
);

const facets = ['invoices', 'payments', 'notes'] as const;

/** Two facts, label over value, as each tab's panel holds them. */
const Facts = ({ facts }: { facts: [string, string][] }) => (
    <>
        {facts.map(([label, value]) => (
            <div className="flex flex-col gap-1.5" key={label}>
                <span className="text-neutral-600">{label}</span>
                <span className="font-medium text-neutral-950 tabular-nums">{value}</span>
            </div>
        ))}
    </>
);

/**
 * The facets of one client: line tabs under its title, label-over-value facts in the panel. At
 * work, the tabs step through the three facets, each panel the same two facts high.
 */
const Client = () => {
    const facet = facets[useStep('tabs') % facets.length] ?? 'invoices';
    return (
        <Card layout="list">
            <div className="flex items-center gap-3">
                <Avatar fallback="HC" />
                <div className="flex min-w-0 flex-col gap-0.5 text-xs">
                    <span className="truncate font-medium text-neutral-950">Harbour &amp; Co</span>
                    <span className="truncate text-neutral-600">accounts@harbour.co</span>
                </div>
            </div>
            <Tabs value={facet}>
                <TabsList>
                    <TabsTrigger value="invoices">
                        Invoices <TabsCount>12</TabsCount>
                    </TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent className="grid grid-cols-2 gap-x-6 text-xs" value="invoices">
                    <Facts
                        facts={[
                            ['Outstanding', '€2,420.00'],
                            ['Paid this year', '€18,600.00'],
                        ]}
                    />
                </TabsContent>
                <TabsContent className="grid grid-cols-2 gap-x-6 text-xs" value="payments">
                    <Facts
                        facts={[
                            ['Last payment', '€1,860.00'],
                            ['Pays in', '9 days'],
                        ]}
                    />
                </TabsContent>
                <TabsContent className="grid grid-cols-2 gap-x-6 text-xs" value="notes">
                    <Facts
                        facts={[
                            ['Contact', 'Eva Bakker'],
                            ['Prefers', 'Bank transfer'],
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </Card>
    );
};

/* ---------- Forms and settings ---------- */

/** A read-only value to copy: read-only fields, the well and its copy button. */
const PaymentDetails = () => (
    <Card>
        <ReadonlyField copyable label="IBAN" value="NL91 INGB 0004 8217 63" />
        <ReadonlyField copyable label="Payment link" value="pay.kestrel.studio/inv-0142" />
    </Card>
);

/** A labelled control in a form: Field with its label and helper, the medium (38) input. */
const BillingEmail = () => (
    <Card>
        <Field>
            <FieldLabel>Billing email</FieldLabel>
            <Input defaultValue="accounts@harbour.co" leadingIcon={<Mail {...icon} />} />
            <FieldHelper>Invoices and reminders go here.</FieldHelper>
        </Field>
    </Card>
);

/** A date in a form: the date picker at the form's height, its rule in the helper. */
const DueDate = () => (
    <Card>
        <Field>
            <FieldLabel>Due date</FieldLabel>
            <DatePicker defaultValue={new Date(2026, 10, 30)} />
            <FieldHelper>Net 14, from the day it is sent.</FieldHelper>
        </Field>
    </Card>
);

/** One of a few, read together: a radio group, each option with its label. At work, 14 then 30. */
const Terms = () => {
    const days = useStep('terms') % 2 === 1 ? '30' : '14';
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment terms</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup aria-label="Payment terms" value={days}>
                    {['7', '14', '30'].map(days => (
                        <Field className="flex-row items-center gap-2.5" key={days}>
                            <RadioGroupItem value={days} />
                            <FieldLabel>Net {days} days</FieldLabel>
                        </Field>
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    );
};

/**
 * Settings: setting rows in a list card, a switch and the picker that depends on it. At work, the
 * switch goes off and the picker under it greys with it, then both come back.
 */
const Reminders = () => {
    const on = useStep('reminders') % 2 === 0;
    return (
        <Card layout="list">
            <SettingGroup title="Reminders">
                <SettingRow
                    control={<Switch checked={on} />}
                    description="When an invoice falls due, and after."
                    title="Payment reminders"
                />
                <SettingRow
                    control={
                        <Select defaultValue="7">
                            <SelectTrigger className="w-28" indicator="right" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="3">3 days</SelectItem>
                                <SelectItem value="7">7 days</SelectItem>
                                <SelectItem value="14">14 days</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                    dependent
                    description="Until it is paid."
                    disabled={!on}
                    title="Remind every"
                />
            </SettingGroup>
        </Card>
    );
};

/** A value on a range: the block slider, its name and value inside the box. At work, 2% to 4% and back. */
const LateFee = () => {
    const fee = useTween(useStep('fee') % 2 === 1 ? 4 : 2, 0.7);
    return (
        <Card>
            <BlockSlider
                format={([value]) => `${Math.round(value ?? 0)}% a month`}
                label="Late fee"
                max={8}
                min={0}
                value={[fee]}
            />
            <p className="text-neutral-600 text-xs">Added once an invoice is 14 days late.</p>
        </Card>
    );
};

/**
 * Applied filters: the Filter button with its count, a soft chip per group, then Clear all. At
 * work, the client filter is taken off, the count with it, then put back.
 */
const Filters = () => {
    const both = useStep('filters') % 2 === 0;
    return (
        <Card>
            <FilterBar onClear={() => {}}>
                <FilterMenu>
                    <FilterMenuTrigger count={both ? 2 : 1} />
                </FilterMenu>
                <Chip action={<ChipAction />}>Status is Overdue</Chip>
                {both && (
                    <Chip
                        action={<ChipAction />}
                        className="starting:scale-95 starting:opacity-0 transition-[opacity,scale] duration-200"
                    >
                        Client is Lumen Labs
                    </Chip>
                )}
            </FilterBar>
        </Card>
    );
};

/** The page's actions: secondary before the one primary, a ghost menu last. */
const Actions = () => (
    <Card className="flex-row items-center [--card-gap:calc(var(--spacing)*2)]">
        <Button variant="secondary">
            <Upload {...icon} /> Import
        </Button>
        <Button>
            <Plus {...icon} /> New invoice
        </Button>
        <Button aria-label="More" className="ml-auto" size="icon" variant="ghost">
            <MoreHorizontal {...icon} />
        </Button>
    </Card>
);

/* ---------- Status and messages ---------- */

/** Live state: the connection's tile, what it is, and a dot badge saying it is live. */
const BankFeed = () => (
    <Card className="flex-row items-center [--card-gap:calc(var(--spacing)*3)]">
        <IconTile>
            <Landmark {...icon} />
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
            <span className="truncate font-medium text-neutral-950">ING ··4821</span>
            <span className="truncate text-neutral-600">Synced 4 min ago</span>
        </div>
        <Badge tone="success" variant="dot">
            Connected
        </Badge>
    </Card>
);

/** Usage within a known range (a meter, no tone until it is near the limit) and a task under way. */
const Usage = () => (
    <Card className="[--card-gap:calc(var(--spacing)*5)]">
        <Meter caption="38 of 50" label="Invoices this month" max={50} value={38} />
        <Meter caption="24 of 25" label="Clients on your plan" max={25} tone="warning" value={24} />
    </Card>
);

/** Upload: the dashed well on the card, the file under it with its bar while it goes up. At work, it lands. */
const Receipts = () => {
    const progress = useTween(useStep('upload') % 2 === 1 ? 100 : 64, 1.2);
    return (
        <Card>
            <DropZone
                accept=".pdf,.jpg"
                description="PDF or JPG, up to 10 MB each."
                title="Drop receipts here"
            />
            <DropZoneFiles>
                <DropZoneFile
                    name="receipt-adobe-nov.pdf"
                    progress={Math.round(progress)}
                    size={248000}
                    status={progress >= 100 ? 'done' : 'uploading'}
                />
            </DropZoneFiles>
        </Card>
    );
};

/** Paging a table: the pager, folded to "3 of 15" in a narrow box. */
const Pager = () => (
    <Card>
        <Pagination onPageChange={() => {}} page={3} pageCount={15} results="142 invoices" />
    </Card>
);

/**
 * Onboarding: the checklist card, done steps ticked, the next one open with its action. At work,
 * the open step is done and the one after it opens, then the card is as it was.
 */
const Setup = () => {
    const invited = useStep('setup') % 2 === 1;
    return (
        <Checklist completed={invited ? 4 : 3} title="Set up invoicing" total={5}>
            <ChecklistItem done title="Add your company details" />
            <ChecklistItem done title="Connect your bank" />
            <ChecklistItem done title="Send your first invoice" />
            <ChecklistItem
                action={
                    invited ? undefined : (
                        <>
                            <Button>Invite</Button>
                            <Button variant="ghost">Skip</Button>
                        </>
                    )
                }
                current={!invited}
                description={invited ? undefined : 'They see every invoice and receipt, read only.'}
                done={invited}
                title="Invite your accountant"
            />
            <ChecklistItem
                action={
                    invited ? (
                        <>
                            <Button>Import</Button>
                            <Button variant="ghost">Skip</Button>
                        </>
                    ) : undefined
                }
                current={invited}
                description={invited ? 'A CSV or the PDFs, matched to your clients.' : undefined}
                title="Import last year’s invoices"
            />
        </Checklist>
    );
};

/** A message that must stay: the alert in its tone, the fix as its action. */
const Overdue = () => (
    <Alert
        action={<Button variant="secondary">Send reminders</Button>}
        title="3 invoices are overdue"
        tone="warning"
    >
        €3,420 in all, the oldest by 12 days.
    </Alert>
);

/** Where a list will be: the dashed empty state, set on the card surface like every piece. */
const NoRecurring = () => (
    <EmptyState
        action={
            <Button variant="secondary">
                <Plus {...icon} /> New recurring invoice
            </Button>
        }
        className="bg-neutral-50"
        description="Bill a client the same amount every month, without writing it again."
        icon={<Repeat {...icon} />}
        title="No recurring invoices"
    />
);

/** A card while its figures load: skeletons at the size of the activity rows coming. */
const Loading = () => (
    <Card aria-busy aria-label="Loading payments" layout="list">
        <Skeleton className="h-2.5 w-20" />
        <div className="flex flex-col gap-6">
            {[0, 1, 2].map(row => (
                <div className="flex items-center gap-4" key={row}>
                    <Skeleton className="size-8 shrink-0" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-2.5 w-3/4" />
                        <Skeleton className="h-2.5 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

/** Raises one toast and keeps it, so the board shows the card as a reader would meet it. */
const RaiseToast = () => {
    const toast = useToast();
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => {
        const id = toast.add({
            title: 'INV-0142 sent to Harbour & Co',
            description: '€2,420.00, due 30 November.',
            type: 'success',
            timeout: 0,
            data: { tab: 'Invoice sent' },
            actionProps: { children: 'Undo' },
        });
        return () => toast.close(id);
    }, []);
    return null;
};

/** The toast, on the board: its own provider, drawn into a box of its own rather than the page's corner. */
const ToastPiece = () => {
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    return (
        <div className="relative h-26 w-toast" ref={setBox}>
            {box && (
                <ToastProvider
                    container={box}
                    viewportClassName="absolute inset-x-0 bottom-0 right-auto w-full max-sm:inset-x-0 max-sm:bottom-0"
                >
                    <RaiseToast />
                </ToastProvider>
            )}
        </div>
    );
};

/* ---------- The board ---------- */

/** Two pieces side by side in the middle column, each half its width. */
const Pair = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn('grid grid-cols-2 items-start gap-5', className)}>{children}</div>
);

/**
 * The columns, left to right, the middle one twice as wide: components only, each part once. The
 * board is symmetric about the middle column, so its middle lands at the frame's centre. Each column
 * starts a little higher or lower (`shift`), so the rows don't line up across the board, and holds
 * enough to run past the frame's foot.
 */
const columns: { width: number; shift: number; drift: number; pieces: ReactNode[] }[] = [
    {
        width: 300,
        shift: -40,
        drift: 96,
        pieces: [
            <PaymentDetails key="a" />,
            <NoRecurring key="b" />,
            <Team key="c" />,
            <Setup key="d" />,
        ],
    },
    {
        width: 320,
        shift: 0,
        drift: 48,
        pieces: [
            <InvoiceFacts key="a" />,
            <PaidBy key="b" />,
            <BillingEmail key="c" />,
            <Shortcuts key="d" />,
        ],
    },
    {
        width: 640,
        shift: -24,
        drift: 16,
        pieces: [
            <KeyFigures key="a" />,
            <InvoiceTable key="b" />,
            <Pair key="c">
                <Client />
                <Activity />
            </Pair>,
            <Overdue key="d" />,
            <Pair className="grid-cols-[auto_1fr]" key="e">
                <ToastPiece />
                <Terms />
            </Pair>,
            <RevenueChart key="f" />,
        ],
    },
    {
        width: 320,
        shift: -64,
        drift: 64,
        pieces: [
            <Actions key="a" />,
            <DueDate key="b" />,
            <SentChart key="c" />,
            <Usage key="d" />,
            <Filters key="e" />,
            <Pager key="f" />,
        ],
    },
    {
        width: 300,
        shift: -12,
        drift: 112,
        pieces: [
            <BankFeed key="a" />,
            <Reminders key="b" />,
            <Receipts key="c" />,
            <LateFee key="d" />,
            <Loading key="e" />,
        ],
    },
];

/**
 * One column, drifting up as the board passes through the screen: by `drift` px over the pass, from
 * half below its place to half above. Each column at its own speed, the outer ones fastest and the
 * middle almost still, so the board reads as depth rather than a slide. Still under reduced motion.
 */
const Column = ({
    column,
    progress,
    still,
}: {
    column: (typeof columns)[number];
    progress: MotionValue<number>;
    still: boolean;
}) => {
    const y = useTransform(
        progress,
        [0, 1],
        still
            ? [column.shift, column.shift]
            : [column.shift + column.drift / 2, column.shift - column.drift / 2],
    );
    return (
        <motion.div className="flex shrink-0 flex-col gap-5" style={{ width: column.width, y }}>
            {column.pieces}
        </motion.div>
    );
};

/** The dot grid the pieces are pinned to. */
const dots = {
    backgroundImage: 'radial-gradient(circle, var(--color-neutral-300) 1.2px, transparent 1.6px)',
    backgroundSize: '24px 24px',
};

/** The board's soft edges: it fades into the page above and below, and only a little at the sides. */
const fades = {
    background: [
        'linear-gradient(to right, var(--color-neutral-50), transparent 6%, transparent 94%, var(--color-neutral-50))',
        'linear-gradient(to bottom, var(--color-neutral-50), transparent 16%, transparent 84%, var(--color-neutral-50))',
    ].join(', '),
};

export const KitchenSinkWall = ({ className }: { className?: string }) => {
    const board = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: board, offset: ['start end', 'end start'] });
    const still = useReducedMotion() ?? false;
    // The board is used only while it is on screen, and never under reduced motion.
    const onScreen = useInView(board, { amount: 0.3 });
    const [beat, setBeat] = useState(0);
    useEffect(() => {
        if (!onScreen || still) return;
        const timer = window.setInterval(() => setBeat(value => value + 1), BEAT_MS);
        return () => window.clearInterval(timer);
    }, [onScreen, still]);

    return (
        <BeatContext.Provider value={beat}>
            <div
                aria-label="Continuum's components laid out on a board: charts, figures, a table, buttons, fields, settings, tabs, badges and lists."
                // The page's full width less the site's gutter, in a container like the hero's board.
                className={cn(
                    'relative left-1/2 w-screen -translate-x-1/2 px-2 md:px-3',
                    className,
                )}
                role="img"
            >
                <div
                    className="relative h-[460px] overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 md:h-[720px]"
                    ref={board}
                >
                    <div
                        className="pointer-events-none absolute top-0 left-1/2 flex -translate-x-1/2 select-none items-start gap-5 px-5 pt-10"
                        inert
                        style={dots}
                    >
                        {columns.map((column, index) => (
                            <Column
                                column={column}
                                // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                                key={index}
                                progress={scrollYProgress}
                                still={still}
                            />
                        ))}
                    </div>
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={fades}
                    />
                </div>
            </div>
        </BeatContext.Provider>
    );
};
