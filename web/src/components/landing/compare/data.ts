/*
 * The content of the landing's before and after, frozen: one workspace, one quarter, the same
 * figures on both sides. Only the design differs between the two screens, never what they show,
 * so the comparison is about the system and not about who invented the better data.
 */

export const workspace = { name: 'Acme Inc.', plan: 'Pro plan' };
export const user = { name: 'Maya Chen', email: 'maya@acme.com', initials: 'MC' };

/** The places in the app, with a count where something waits for the reader. */
export const nav = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'invoices', label: 'Invoices', count: 3 },
    { id: 'reports', label: 'Reports' },
    { id: 'inbox', label: 'Inbox', count: 4 },
    { id: 'agent', label: 'Agent' },
] as const;

export const navWorkspace = [
    { id: 'settings', label: 'Settings' },
    { id: 'help', label: 'Help and support' },
] as const;

export const period = { label: 'Last 12 weeks', words: 'over the last twelve weeks' };

/** The twelve weeks the page reads, Mondays, the last one this week. */
export const weekLabels = [
    '3 Aug',
    '10 Aug',
    '17 Aug',
    '24 Aug',
    '31 Aug',
    '7 Sept',
    '14 Sept',
    '21 Sept',
    '28 Sept',
    '5 Oct',
    '12 Oct',
    '19 Oct',
];

export type Kpi = {
    id: string;
    label: string;
    value: string;
    delta: string;
    /** Whether the change is good news; churn falling is. */
    good: boolean | null;
    /** The figure week by week over the twelve weeks, the last one now. */
    series: number[];
    /** Two figures that stand beside the key one. */
    facts: [{ label: string; value: string }, { label: string; value: string }];
};

export const kpis: Kpi[] = [
    {
        id: 'customers',
        label: 'Active customers',
        value: '36',
        delta: '+3',
        good: true,
        series: [31, 31, 32, 32, 33, 33, 33, 34, 34, 35, 35, 36],
        facts: [
            { label: 'Trials', value: '4' },
            { label: 'Churned', value: '2' },
        ],
    },
    {
        id: 'new',
        label: 'New customers',
        value: '9',
        delta: '+2',
        good: true,
        series: [0, 1, 0, 1, 1, 0, 1, 1, 0, 2, 1, 1],
        facts: [
            { label: 'Trials', value: '6' },
            { label: 'Referrals', value: '3' },
        ],
    },
    {
        id: 'churn',
        label: 'Churn',
        value: '1.9%',
        delta: '−0.4 pt',
        good: true,
        series: [2.6, 2.5, 2.5, 2.4, 2.3, 2.3, 2.2, 2.1, 2.1, 2.0, 1.9, 1.9],
        facts: [
            { label: 'Lost', value: '€620' },
            { label: 'Saved', value: '2' },
        ],
    },
    {
        id: 'tickets',
        label: 'Open tickets',
        value: '23',
        delta: '+5',
        good: false,
        series: [14, 16, 15, 17, 16, 18, 19, 17, 20, 21, 18, 23],
        facts: [
            { label: 'Overdue', value: '3' },
            { label: 'Reply', value: '2h' },
        ],
    },
];

/** Monthly recurring revenue now, and what it was twelve weeks ago. */
export const mrr = { value: '€48,260', start: 41210, now: 48260, delta: '+17.1%' };

/**
 * Where the revenue moved each week, in euros a month: new customers and upgrades add, cancellations
 * and downgrades take away. The twelve weeks add up to the €7,050 the total grew by.
 */
export const movement = [
    { week: '3 Aug', new: 420, expansion: 180, churn: -240 },
    { week: '10 Aug', new: 610, expansion: 90, churn: -120 },
    { week: '17 Aug', new: 290, expansion: 260, churn: -310 },
    { week: '24 Aug', new: 740, expansion: 140, churn: -90 },
    { week: '31 Aug', new: 380, expansion: 520, churn: -180 },
    { week: '7 Sept', new: 510, expansion: 210, churn: -260 },
    { week: '14 Sept', new: 860, expansion: 120, churn: -140 },
    { week: '21 Sept', new: 470, expansion: 380, churn: -200 },
    { week: '28 Sept', new: 640, expansion: 160, churn: -350 },
    { week: '5 Oct', new: 540, expansion: 240, churn: -110 },
    { week: '12 Oct', new: 520, expansion: 300, churn: -270 },
    { week: '19 Oct', new: 710, expansion: 190, churn: -160 },
];

/** Recurring revenue by plan, largest first, in euros a month. */
export const byPlan = [
    { plan: 'Enterprise', revenue: 21400, customers: 6 },
    { plan: 'Pro', revenue: 15860, customers: 13 },
    { plan: 'Team', revenue: 7200, customers: 9 },
    { plan: 'Starter', revenue: 3800, customers: 8 },
];

/** Accounts that need the reader to act, the most urgent first. */
export const attention = [
    {
        account: 'Initech',
        domain: 'initech.com',
        issue: 'Payment failed',
        detail: 'Card declined twice',
        tone: 'error',
        mrr: '€1,240',
        action: 'Retry payment',
    },
    {
        account: 'Umbrella Health',
        domain: 'umbrella.health',
        issue: 'Trial ends in 2 days',
        detail: 'Pro trial, 6 seats in use',
        tone: 'warning',
        mrr: '€890',
        action: 'Send offer',
    },
    {
        account: 'Hooli',
        domain: 'hooli.xyz',
        issue: 'No login for 21 days',
        detail: 'Usage down 64%',
        tone: 'warning',
        mrr: '€2,100',
        action: 'Reach out',
    },
] as const;

/** What moved lately, newest first. */
export const activity = [
    { what: 'Tyrell & Co started on the Starter plan', when: '12 min ago', kind: 'new' },
    { what: 'Riverbend Media started a trial of Pro', when: '2 hours ago', kind: 'trial' },
    { what: 'A payment from Initech failed', when: '3 hours ago', kind: 'failed' },
    { what: 'Northwind Traders upgraded to Enterprise', when: 'Yesterday', kind: 'upgrade' },
    { what: 'Cyberdyne cancelled their plan', when: '2 weeks ago', kind: 'cancel' },
] as const;
