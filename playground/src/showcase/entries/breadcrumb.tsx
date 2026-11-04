import {
    AppPanel,
    AppShell,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbMenu,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    DropdownMenuItem,
    HeaderBar,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Download, Folder } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { PageHead, WorkspaceSidebar } from '../../screens/workspace';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    Scene,
} from '../kit';

const breadcrumbKnobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 13px'), o('lg', 'lg · 14px')],
        default: 'md',
    },
    {
        id: 'trail',
        label: 'Trail',
        options: [
            o('short', 'Short'),
            o('long', 'Long, all shown'),
            o('collapsed', 'Long, collapsed'),
        ],
        default: 'collapsed',
    },
    { id: 'switcher', label: 'Workspace switcher', switch: true, default: true },
    { id: 'home', label: 'Home icon', switch: true, default: true },
    { id: 'longPage', label: 'Long page name', switch: true, default: false },
];

const hiddenCrumbs = ['Finance', 'Payments', '2026'];

const workspaces = ['Northwind', 'Acme Corp', 'Globex'];

const BreadcrumbPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');
    const middle =
        knobs.trail === 'short' ? [] : knobs.trail === 'long' ? hiddenCrumbs : ['collapsed'];

    return (
        // A bar's width, so a long page name has something to truncate against.
        <Breadcrumb className="w-[440px] max-w-full">
            <BreadcrumbList size={knobs.size === 'lg' ? 'lg' : 'md'}>
                {knobs.home && (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </>
                )}
                <BreadcrumbItem>
                    {knobs.switcher ? (
                        <BreadcrumbMenu container={stage} label={workspace}>
                            {workspaces.map(name => (
                                <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </BreadcrumbMenu>
                    ) : (
                        <BreadcrumbLink href="#">{workspace}</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                {middle.map(crumb => (
                    <BreadcrumbItem key={crumb}>
                        <BreadcrumbSeparator />
                        {crumb === 'collapsed' ? (
                            <BreadcrumbMenu container={stage}>
                                {hiddenCrumbs.map(name => (
                                    <DropdownMenuItem key={name}>
                                        <Folder {...previewIcon} /> {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        ) : (
                            <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">Batches</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>
                        {knobs.longPage
                            ? 'Batch #12345 · October payouts to European suppliers'
                            : 'Batch #12345'}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export const entry: Entry = {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'navigation',
    description: 'Where the page sits; a long trail folds its middle into a menu.',
    knobs: breadcrumbKnobs,
    Preview: BreadcrumbPreview,
};

const foldedCrumbs = ['Finance', 'Payments', '2026'];

const payouts = [
    { supplier: 'Hansa Freight GmbH', country: 'Germany', amount: '€6,240.00', status: 'Paid' },
    { supplier: 'Atelier Moreau', country: 'France', amount: '€3,180.00', status: 'Paid' },
    { supplier: 'Noordzee Print BV', country: 'Netherlands', amount: '€2,960.00', status: 'Paid' },
    { supplier: 'Lisboa Studio Lda', country: 'Portugal', amount: '€2,410.00', status: 'Pending' },
    { supplier: 'Kraków Components', country: 'Poland', amount: '€1,870.00', status: 'Paid' },
] as const;

// The trail as the header bar sets it: a workspace switcher, the middle folded, the page last.
const DeepTrail = () => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');

    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">
                        <BreadcrumbHome />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbMenu container={stage} label={workspace}>
                        {['Northwind', 'Acme Corp', 'Globex'].map(name => (
                            <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                {name}
                            </DropdownMenuItem>
                        ))}
                    </BreadcrumbMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbMenu container={stage} defaultOpen modal={false}>
                        {foldedCrumbs.map(name => (
                            <DropdownMenuItem key={name}>
                                <Folder {...icon} /> {name}
                            </DropdownMenuItem>
                        ))}
                    </BreadcrumbMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">October batches</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Batch #12345 · European suppliers</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
};

const PayoutBatch = () => (
    <Scene className="p-0">
        <div className="absolute inset-0">
            <AppShell className="h-full min-h-0 w-full">
                <WorkspaceSidebar place="invoices" />
                <AppPanel>
                    <HeaderBar>
                        <DeepTrail />
                    </HeaderBar>
                    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden px-10 pt-10 [mask-image:linear-gradient(to_bottom,black_calc(100%-48px),transparent)]">
                        <PageHead
                            description="14 payouts · €18,420.00 · sent 14 October"
                            title="Batch #12345"
                        >
                            <Button variant="secondary">
                                <Download {...icon} /> Export
                            </Button>
                        </PageHead>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map(payout => (
                                    <TableRow key={payout.supplier}>
                                        <TableCell className="font-medium text-neutral-950">
                                            {payout.supplier}
                                        </TableCell>
                                        <TableCell className="text-neutral-600">
                                            {payout.country}
                                        </TableCell>
                                        <TableCell className="text-right text-neutral-950 tabular-nums">
                                            {payout.amount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                tone={
                                                    payout.status === 'Paid' ? 'success' : 'neutral'
                                                }
                                            >
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </AppPanel>
            </AppShell>
        </div>
    </Scene>
);

export const inUse: InUse = {
    title: 'A payout batch',
    note: 'A deep trail in the header bar: a workspace switcher, the middle folded, the page last.',
    bare: true,
    render: () => <PayoutBatch />,
};
