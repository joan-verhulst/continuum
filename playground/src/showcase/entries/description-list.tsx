import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    DescriptionItem,
    DescriptionList,
} from 'continuum';
import { Pencil } from 'lucide-react';
import { type Entry, type InUse, icon } from '../kit';

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

const CustomerDetails = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Customer</CardTitle>
            <Button variant="ghost">
                <Pencil {...icon} /> Edit
            </Button>
        </CardHeader>
        <DescriptionList>
            <DescriptionItem term="Company">Acme Corp</DescriptionItem>
            <DescriptionItem term="Plan">Business · 12 of 20 seats</DescriptionItem>
            <DescriptionItem term="Status">
                <Badge tone="success">Active</Badge>
            </DescriptionItem>
            <DescriptionItem term="Owners">
                <AvatarStack>
                    <Avatar fallback="AS" shape="round" size={24} />
                    <Avatar fallback="TB" shape="round" size={24} />
                </AvatarStack>
            </DescriptionItem>
            <DescriptionItem term="Customer since">12 April 2023</DescriptionItem>
        </DescriptionList>
    </Card>
);

export const inUse: InUse = {
    title: 'Customer',
    note: 'Facts about a record, a term and its value per row.',
    canvas: true,
    render: () => <CustomerDetails />,
};
