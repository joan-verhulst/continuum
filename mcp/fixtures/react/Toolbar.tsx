import { Button, Table, TableBody, TableHeader } from 'continuum';
import { useState } from 'react';

type Invoice = { id: string; customer: string; amount: string; status: string };

export const InvoicesScreen = ({ invoices }: { invoices: Invoice[] }) => {
    const [query, setQuery] = useState('');
    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="font-medium text-2xl text-neutral-950">Invoices</h1>
                <div className="flex items-center gap-[10px]">
                    <Button variant="primary">Export</Button>
                    <Button variant="primary">New invoice</Button>
                    <button className="h-9 rounded-md bg-blue-600 px-[13px] font-semibold text-white shadow-md">
                        Send reminders
                    </button>
                </div>
            </div>
            <p className="text-gray-400 text-sm">Invoices sync from the ledger every hour.</p>
            <div className="rounded-xl border-2 border-neutral-200 bg-white p-4 shadow-lg">
                <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search invoices"
                    className="h-control w-64 rounded-control border border-neutral-200 px-3 text-xs"
                />
                <span style={{ color: '#9ca3af' }}>{invoices.length} invoices</span>
            </div>
            <Table>
                <TableHeader>
                    <tr>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </TableHeader>
                <TableBody>
                    {invoices.map(invoice => (
                        <tr key={invoice.id}>
                            <td className="font-medium">{invoice.customer}</td>
                            <td className="text-right tabular-nums">{invoice.amount}</td>
                            <td>{invoice.status}</td>
                        </tr>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
