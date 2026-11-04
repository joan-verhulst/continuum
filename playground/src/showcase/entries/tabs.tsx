import {
    Avatar,
    Badge,
    Button,
    DescriptionItem,
    DescriptionList,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
    type TabsVariant,
} from 'continuum';
import { FileText, History, LayoutList, ListChecks, Pencil, Plus } from 'lucide-react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const tabsKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('line', 'pill'), default: 'line' },
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'count', label: 'Count', switch: true, default: false },
    { id: 'content', label: 'Content', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const TabsPreview = ({ knobs }: PreviewProps) => (
    <Tabs className="w-fit min-w-80" defaultValue="summary">
        <TabsList variant={knobs.variant as TabsVariant}>
            <TabsTrigger value="summary">
                {knobs.icons && <LayoutList {...previewIcon} />}
                Summary
            </TabsTrigger>
            <TabsTrigger value="findings">
                {knobs.icons && <ListChecks {...previewIcon} />}
                Findings
                {knobs.count && <TabsCount>12</TabsCount>}
            </TabsTrigger>
            <TabsTrigger value="sources">
                {knobs.icons && <FileText {...previewIcon} />}
                Sources
            </TabsTrigger>
            {knobs.disabled && (
                <TabsTrigger disabled value="history">
                    {knobs.icons && <History {...previewIcon} />}
                    History
                </TabsTrigger>
            )}
        </TabsList>
        {knobs.content && (
            <>
                <TabsContent className="text-neutral-600 text-xs" value="summary">
                    Three risks need a decision before Friday.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="findings">
                    Twelve findings, four of them new.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="sources">
                    Built from 38 documents.
                </TabsContent>
            </>
        )}
    </Tabs>
);

export const entry: Entry = {
    id: 'tabs',
    name: 'Tabs',
    category: 'navigation',
    description:
        'Switch between the panels of one object. Line under a page or section title, pill for a tight spot in a card or dialog.',
    knobs: tabsKnobs,
    Preview: TabsPreview,
};

const northwindInvoices = [
    { number: 'INV-0141', issued: '2 October', amount: '€4,800.00', status: 'Paid' },
    { number: 'INV-0118', issued: '2 September', amount: '€4,800.00', status: 'Paid' },
    { number: 'INV-0097', issued: '2 August', amount: '€4,800.00', status: 'Paid' },
    { number: 'INV-0074', issued: '2 July', amount: '€4,320.00', status: 'Paid' },
];

const northwindActivity = [
    { who: 'Maya Chen', what: 'renewed the Enterprise plan for a year', when: '2 days ago' },
    { who: 'Northwind', what: 'added 12 seats', when: '1 week ago' },
    { who: 'Maya Chen', what: 'logged a call about the Q4 rollout', when: '2 weeks ago' },
];

const CustomerDetail = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Pencil {...icon} /> Edit
                </Button>
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            </>
        }
        description="Enterprise · a customer since March 2023 · northwind.com"
        nav="top"
        place="customers"
        title="Northwind Traders"
    >
        <Tabs className="gap-6" defaultValue="overview">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoices">
                    Invoices <TabsCount>24</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="contacts">
                    Contacts <TabsCount>3</TabsCount>
                </TabsTrigger>
            </TabsList>
            <TabsContent className="flex flex-col gap-6" value="overview">
                <div className="grid grid-cols-3 gap-4">
                    <StatCard delta="+12.0%" label="Monthly revenue" value="€4,800" />
                    <StatCard delta="+12" label="Seats in use" value="86 of 100" />
                    <StatCard delta="+6" label="Invoices this year" value="24" />
                </div>
                <DescriptionList>
                    <DescriptionItem term="Owner">Maya Chen</DescriptionItem>
                    <DescriptionItem term="Billing email">finance@northwind.com</DescriptionItem>
                    <DescriptionItem term="Renews">1 March 2027</DescriptionItem>
                </DescriptionList>
            </TabsContent>
            <TabsContent value="invoices">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {northwindInvoices.map(invoice => (
                            <TableRow key={invoice.number}>
                                <TableCell className="font-medium text-neutral-950">
                                    {invoice.number}
                                </TableCell>
                                <TableCell className="text-neutral-600">{invoice.issued}</TableCell>
                                <TableCell className="text-right text-neutral-950 tabular-nums">
                                    {invoice.amount}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge tone="success">{invoice.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TabsContent>
            <TabsContent className="flex flex-col gap-4" value="activity">
                {northwindActivity.map(event => (
                    <p className="flex items-center gap-3 text-xs" key={event.what}>
                        <Avatar fallback={event.who === 'Northwind' ? 'NT' : 'MC'} size={24} />
                        <span className="min-w-0 flex-1 text-neutral-700">
                            <span className="font-medium text-neutral-950">{event.who}</span>{' '}
                            {event.what}
                        </span>
                        <span className="text-neutral-500">{event.when}</span>
                    </p>
                ))}
            </TabsContent>
            <TabsContent className="flex flex-col gap-4" value="contacts">
                {[
                    ['Ellen Price', 'Head of finance', 'EP'],
                    ['Tomás Ruiz', 'IT lead', 'TR'],
                    ['Grace Liu', 'Operations', 'GL'],
                ].map(([name, role, initials]) => (
                    <p className="flex items-center gap-3 text-xs" key={name}>
                        <Avatar fallback={initials} size={24} />
                        <span className="font-medium text-neutral-950">{name}</span>
                        <span className="text-neutral-600">{role}</span>
                    </p>
                ))}
            </TabsContent>
        </Tabs>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'A customer',
    note: 'Line tabs under the customer’s title for its facets, counts on the lists.',
    app: true,
    render: () => <CustomerDetail />,
};
