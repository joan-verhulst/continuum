import {
    Card,
    CardTitle,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'continuum';
import { useState } from 'react';
import type { Entry, InUse } from '../kit';

const PaginationPreview = () => {
    const [page, setPage] = useState(4);

    return (
        <div className="w-full overflow-x-auto">
            <Pagination
                className="min-w-[520px]"
                onPageChange={setPage}
                page={page}
                pageCount={12}
            />
        </div>
    );
};

export const entry: Entry = {
    id: 'pagination',
    name: 'Pagination',
    category: 'navigation',
    description: 'The same number of slots on every page.',
    span: 2,
    Preview: PaginationPreview,
};

const contacts = [
    { name: 'Anna de Vries', email: 'anna@acme.com', company: 'Acme Corp' },
    { name: 'Bram Jansen', email: 'bram@northwind.com', company: 'Northwind' },
    { name: 'Chloé Martin', email: 'chloe@lumenlabs.io', company: 'Lumen Labs' },
    { name: 'Daan Visser', email: 'daan@tideline.travel', company: 'Tideline Travel' },
];

const ContactsList = () => {
    const [page, setPage] = useState(3);

    return (
        <Card className="w-full gap-3">
            <CardTitle>Contacts</CardTitle>
            <ul className="flex flex-col divide-y divide-neutral-200 text-xs">
                {contacts.map(contact => (
                    <li className="flex h-10 items-center gap-4" key={contact.email}>
                        <span className="w-40 font-medium text-neutral-950">{contact.name}</span>
                        <span className="flex-1 text-neutral-600">{contact.email}</span>
                        <span className="text-neutral-600">{contact.company}</span>
                    </li>
                ))}
            </ul>
            <Pagination
                end={
                    <Select defaultValue="4">
                        <SelectTrigger aria-label="Rows per page" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="4">4 rows</SelectItem>
                            <SelectItem value="10">10 rows</SelectItem>
                        </SelectContent>
                    </Select>
                }
                onPageChange={setPage}
                page={page}
                pageCount={12}
                results={`${(page - 1) * 4 + 1} – ${page * 4} of 48`}
            />
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Contacts',
    note: 'Results on the left, the pages in the middle, rows per page on the right.',
    canvas: true,
    render: () => <ContactsList />,
};
