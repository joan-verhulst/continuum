import { useState } from 'react';

const kpis = [
    { label: 'Total revenue', value: '€48,210', change: '+12.4%', emoji: '💰', color: 'from-violet-500 to-fuchsia-500' },
    { label: 'Orders', value: '1,284', change: '+8.1%', emoji: '📦', color: 'from-sky-500 to-cyan-400' },
    { label: 'Customers', value: '312', change: '+3.2%', emoji: '👥', color: 'from-emerald-500 to-lime-400' },
    { label: 'Avg. order', value: '€37.55', change: '-1.9%', emoji: '📈', color: 'from-orange-500 to-amber-400' },
];

const months = [
    { month: 'Jun', revenue: 31 },
    { month: 'Jul', revenue: 36 },
    { month: 'Aug', revenue: 29 },
    { month: 'Sep', revenue: 41 },
    { month: 'Oct', revenue: 44 },
    { month: 'Nov', revenue: 48 },
];

const orders = [
    { id: '#4821', customer: 'Harbour & Co', total: '€1,240.00', status: 'Paid' },
    { id: '#4820', customer: 'Northwind', total: '€860.00', status: 'Pending' },
    { id: '#4819', customer: 'Orbit Coffee', total: '€312.50', status: 'Failed' },
    { id: '#4818', customer: 'Lumen Labs', total: '€2,040.00', status: 'Paid' },
    { id: '#4817', customer: 'Atlas Freight', total: '€455.00', status: 'Refunded' },
];

const statusStyle: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Failed: 'bg-red-100 text-red-700',
    Refunded: 'bg-purple-100 text-purple-700',
};

export default function Dashboard() {
    const [range, setRange] = useState('6 months');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-pink-50 p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10 text-center">
                    <h1 className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text font-extrabold text-4xl text-transparent">
                        Welcome back, Mira! 👋
                    </h1>
                    <p className="mt-3 text-gray-400 text-lg">Here's what's happening with Larder today.</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-bold text-white shadow-indigo-500/40 shadow-xl transition hover:scale-105"
                            type="button"
                        >
                            + New order
                        </button>
                        <button
                            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-bold text-white shadow-pink-500/40 shadow-xl transition hover:scale-105"
                            type="button"
                        >
                            Export report
                        </button>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-4 gap-6">
                    {kpis.map(kpi => (
                        <div
                            className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-2xl backdrop-blur-xl"
                            key={kpi.label}
                        >
                            <div
                                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${kpi.color}`}
                            >
                                {kpi.emoji}
                            </div>
                            <p className="font-semibold text-gray-400 text-xs uppercase tracking-widest">
                                {kpi.label}
                            </p>
                            <p className="mt-1 font-black text-3xl text-gray-900">{kpi.value}</p>
                            <p
                                className={`mt-2 font-bold text-sm ${kpi.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}
                            >
                                {kpi.change} vs last month
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 rounded-3xl bg-white p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 text-xl">📊 Revenue overview</h2>
                            <select
                                className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-2 font-semibold text-indigo-700 text-sm"
                                onChange={event => setRange(event.target.value)}
                                value={range}
                            >
                                <option>6 months</option>
                                <option>12 months</option>
                            </select>
                        </div>
                        <div className="flex h-64 items-end gap-4">
                            {months.map(item => (
                                <div className="flex flex-1 flex-col items-center gap-2" key={item.month}>
                                    <span className="font-bold text-gray-700 text-xs">€{item.revenue}k</span>
                                    <div
                                        className="w-full rounded-t-2xl bg-gradient-to-t from-indigo-500 to-pink-400 shadow-lg"
                                        style={{ height: `${item.revenue * 5}px` }}
                                    />
                                    <span className="text-gray-400 text-xs">{item.month}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 text-center font-semibold text-gray-500 text-sm">
                            Total revenue: €48,210 (+12.4%)
                        </p>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
                        <h2 className="mb-2 font-bold text-xl">🚀 Pro tip</h2>
                        <p className="mb-6 text-indigo-100">
                            Customers who order twice in a month are 3× more likely to stay. Reach out today!
                        </p>
                        <button
                            className="w-full rounded-2xl bg-white py-3 font-bold text-indigo-700 shadow-lg hover:bg-indigo-50"
                            type="button"
                        >
                            Send a campaign ✨
                        </button>
                    </div>
                </div>

                <div className="mt-8 rounded-3xl bg-white p-8 shadow-2xl">
                    <h2 className="mb-6 font-bold text-gray-900 text-xl">🧾 Recent orders</h2>
                    <table className="w-full">
                        <thead>
                            <tr className="border-gray-100 border-b-2 text-left">
                                <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Order</th>
                                <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Customer</th>
                                <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Total</th>
                                <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr className="border-gray-100 border-b hover:bg-indigo-50/50" key={order.id}>
                                    <td className="py-5 font-bold text-indigo-600">{order.id}</td>
                                    <td className="py-5 text-gray-700">{order.customer}</td>
                                    <td className="py-5 font-semibold text-gray-900">{order.total}</td>
                                    <td className="py-5">
                                        <span
                                            className={`rounded-full px-3 py-1 font-bold text-xs ${statusStyle[order.status]}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
