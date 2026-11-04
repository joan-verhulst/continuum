import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    DescriptionItem,
    DescriptionList,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'continuum';
import { Download, Send } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

const DescriptionPreview = () => (
    <DescriptionList className="w-full max-w-72">
        <DescriptionItem term="Client">Acme Studio</DescriptionItem>
        <DescriptionItem term="Status">
            <Badge tone="warning">Due soon</Badge>
        </DescriptionItem>
        <DescriptionItem term="Owners">
            <AvatarStack>
                <Avatar fallback="AS" shape="round" size={24} />
                <Avatar fallback="TB" shape="round" size={24} />
            </AvatarStack>
        </DescriptionItem>
    </DescriptionList>
);

export const entry: Entry = {
    id: 'description-list',
    name: 'Description list',
    category: 'content',
    description: 'Facts about one object, term beside value.',
    Preview: DescriptionPreview,
};

const InvoiceDetail = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Download {...icon} /> Download PDF
                </Button>
                <Button>
                    <Send {...icon} /> Send reminder
                </Button>
            </>
        }
        description={
            <span className="inline-flex items-center gap-2">
                Acme Corp · sent 12 October
                <Badge tone="warning">Due soon</Badge>
            </span>
        }
        place="invoices"
        title="INV-0142"
        trail={['Invoices', 'INV-0142']}
    >
        <Tabs defaultValue="details">
            <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Line items</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            <TabsContent className="grid grid-cols-2 gap-6 pt-4" value="details">
                <div className="flex flex-col gap-3">
                    <h2 className="font-medium text-neutral-950 text-xs">Invoice</h2>
                    <DescriptionList>
                        <DescriptionItem term="Amount">€4,120.00</DescriptionItem>
                        <DescriptionItem term="Issued">12 October 2026</DescriptionItem>
                        <DescriptionItem term="Due">26 October 2026</DescriptionItem>
                        <DescriptionItem term="Terms">Net 14</DescriptionItem>
                        <DescriptionItem term="Reference">PO-88213</DescriptionItem>
                    </DescriptionList>
                </div>
                <div className="flex flex-col gap-3">
                    <h2 className="font-medium text-neutral-950 text-xs">Billed to</h2>
                    <DescriptionList>
                        <DescriptionItem term="Company">Acme Corp</DescriptionItem>
                        <DescriptionItem term="Contact">finance@acme.com</DescriptionItem>
                        <DescriptionItem term="VAT number">NL 8541.22.019.B01</DescriptionItem>
                        <DescriptionItem term="Payment">Bank transfer</DescriptionItem>
                        <DescriptionItem term="Owners">
                            <AvatarStack>
                                <Avatar fallback="MC" shape="round" size={24} />
                                <Avatar fallback="LO" shape="round" size={24} />
                            </AvatarStack>
                        </DescriptionItem>
                    </DescriptionList>
                </div>
            </TabsContent>
        </Tabs>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'An invoice',
    note: 'The facts of one invoice on its detail page, a term beside each value, in two ruled lists.',
    app: true,
    render: () => <InvoiceDetail />,
};
