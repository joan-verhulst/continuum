import { Badge, Button, Tabs, TabsList, TabsTrigger, ValueField } from 'continuum';
import { Pencil, Plus } from 'lucide-react';
import { SectionHead } from '../../screens/workspace';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

const ValueFieldPreview = () => (
    <div className="grid w-full max-w-72 grid-cols-2 gap-3">
        <ValueField copyable label="Entry page" value="/home" />
        <ValueField label="Source" value={null} />
    </div>
);

export const entry: Entry = {
    id: 'value-field',
    name: 'Value field',
    category: 'forms',
    description: 'A read-only value in a well, with copy.',
    Preview: ValueFieldPreview,
};

const CustomerBilling = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Pencil {...icon} /> Edit details
                </Button>
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            </>
        }
        description={
            <span className="inline-flex items-center gap-2">
                northwind.com · Enterprise plan
                <Badge tone="success">Active</Badge>
            </span>
        }
        place="customers"
        title="Northwind Traders"
        trail={['Customers', 'Northwind Traders']}
    >
        <Tabs defaultValue="billing">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
        </Tabs>
        <section className="flex flex-col gap-5">
            <SectionHead
                description="What goes on every invoice to Northwind; copy any of it into a payment or a reply."
                title="Billing details"
            />
            <div className="grid grid-cols-2 gap-4">
                <ValueField copyable label="Customer ID" value="cus_8f2a91c4" />
                <ValueField copyable label="VAT number" value="GB 284 9917 06" />
                <ValueField copyable label="Billing email" value="accounts@northwind.com" />
                <ValueField copyable label="IBAN" value="GB29 NWBK 6016 1331 9268 19" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ValueField
                    label="Card on file"
                    tone="success"
                    value="Visa ending 4242"
                    variant="vital"
                />
                <ValueField label="Last payment" value="€4,800.00 on 1 October" variant="vital" />
            </div>
        </section>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Billing details',
    note: 'A customer’s billing facts as values to read and copy, and two vitals under them.',
    app: true,
    render: () => <CustomerBilling />,
};
