import {
    BranchGraph,
    type BranchGraphColumn,
    type BranchGraphCommit,
    type BranchGraphRef,
    Button,
    SegmentedControl,
    SegmentedControlItem,
} from 'continuum';
import { GitBranch } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o } from '../kit';

/* ---------- Histories ---------- */

/** A stable 40-character hash from a short key, so the hash column reads like git's. */
const hash = (key: string) => {
    let a = 2166136261;
    let out = '';
    for (let round = 0; out.length < 40; round += 1) {
        for (const char of `${key}:${round}`)
            a = Math.imul(a ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0;
        out += a.toString(16).padStart(8, '0');
    }
    return out.slice(0, 40);
};

const branch = (name: string, more: Partial<BranchGraphRef> = {}): BranchGraphRef => ({
    name,
    kind: 'branch',
    ...more,
});
const tag = (name: string): BranchGraphRef => ({ name, kind: 'tag' });

type Line = [
    key: string,
    parents: string[],
    message: string,
    author: string,
    refs?: BranchGraphRef[],
];

/** Commits newest first, an hour or a few apart, back from Thursday 12 November 2026, 16:40. */
const history = (lines: Line[], hoursApart = 3): BranchGraphCommit[] =>
    lines.map(([key, parents, message, author, refs], index) => ({
        id: hash(key),
        parents: parents.map(hash),
        message,
        author,
        time: new Date(2026, 10, 12, 16, 40 - index * hoursApart * 23),
        refs,
    }));

/** Two features and a hotfix merged into main, one branch still open, the oldest commit's parent off the list. */
const branching = history([
    [
        'm6',
        ['m5', 'e3'],
        'Merge pull request #142 from acme/feature/export',
        'Mira Okafor',
        [branch('main', { current: true }), branch('origin/main', { remote: true }), tag('v2.4.0')],
    ],
    [
        'e3',
        ['e2'],
        "Export invoices as CSV with the customer's own column names, dates in their locale and totals in their currency",
        'Jonas Weber',
        [branch('feature/export')],
    ],
    [
        'w2',
        ['w1'],
        'Draft the retry schedule for failed webhooks',
        'Lea Fischer',
        [branch('feature/webhooks'), branch('origin/feature/webhooks', { remote: true })],
    ],
    ['m5', ['m4', 'h1'], "Merge branch 'hotfix/tax-id'", 'Mira Okafor'],
    ['h1', ['m4'], 'Guard against empty tax ids on EU invoices', 'Sam Turner'],
    ['e2', ['e1'], 'Add the export dialog and its column picker', 'Jonas Weber'],
    ['w1', ['m3'], 'Sketch the webhook delivery log', 'Lea Fischer'],
    ['m4', ['m3'], 'Fix rounding on credit notes', 'Sam Turner'],
    ['e1', ['m3'], 'Start the CSV export', 'Jonas Weber'],
    ['m3', ['m2'], 'Bump the PDF renderer to 4.2', 'Mira Okafor', [tag('v2.3.1')]],
    ['m2', ['m1', 'r2'], 'Merge pull request #131 from acme/feature/reminders', 'Mira Okafor'],
    ['r2', ['r1'], 'Send the second reminder after 14 days', 'Ada Novak'],
    ['r1', ['m1'], 'Add reminder schedules to the dunning settings', 'Ada Novak'],
    ['m1', ['m0'], 'Update the changelog for 2.3', 'Mira Okafor', [tag('v2.3.0')]],
    ['m0', ['mx'], 'Rename "Clients" to "Customers" across the app', 'Sam Turner'],
]);

/** One line of work, no branches: the graph is a single lane down the edge. */
const linear = history(
    [
        [
            'l12',
            ['l11'],
            'Show the invoice number in the page title',
            'Mira Okafor',
            [branch('main', { current: true }), branch('origin/main', { remote: true })],
        ],
        ['l11', ['l10'], 'Keep the filter bar on one line under 640', 'Jonas Weber'],
        ['l10', ['l9'], "Read the due date in the customer's time zone", 'Ada Novak'],
        ['l9', ['l8'], 'Drop the unused chart colours', 'Sam Turner'],
        ['l8', ['l7'], 'Update the changelog for 2.2', 'Mira Okafor', [tag('v2.2.0')]],
        ['l7', ['l6'], 'Fix the empty state on a search with no results', 'Lea Fischer'],
        ['l6', ['l5'], 'Write the totals with tabular figures', 'Jonas Weber'],
        ['l5', ['l4'], 'Add a copy button to the API key field', 'Ada Novak'],
        ['l4', ['l3'], 'Move the reminders into their own settings page', 'Sam Turner'],
        ['l3', ['l2'], 'Rename the "Archive" action to "Close"', 'Mira Okafor'],
        ['l2', ['l1'], 'Upgrade to React 19', 'Lea Fischer'],
        ['l1', ['l0'], 'Set up the project', 'Mira Okafor', [tag('v2.1.0')]],
    ],
    5,
);

/** Four branches open at once, one made from another, merged in turn. */
const busy = history(
    [
        [
            'a3',
            ['a2'],
            'Wire the plan picker to the new prices',
            'Ada Novak',
            [branch('feature/pricing')],
        ],
        [
            'M4',
            ['M3', 's3'],
            'Merge pull request #158 from acme/feature/search',
            'Mira Okafor',
            [
                branch('main', { current: true }),
                branch('origin/main', { remote: true }),
                branch('staging'),
                tag('v2.6.0-rc.1'),
            ],
        ],
        [
            'c3',
            ['c2'],
            'Translate the onboarding emails into German',
            'Lea Fischer',
            [branch('feature/i18n')],
        ],
        ['s3', ['s2'], 'Search customers by VAT number', 'Jonas Weber'],
        ['a2', ['a1'], 'Show yearly prices beside monthly', 'Ada Novak'],
        ['M3', ['M2', 'x1'], 'Merge pull request #156 from acme/fix/session', 'Mira Okafor'],
        ['d1', ['s2'], 'Spike: keep drafts offline', 'Jonas Weber', [branch('spike/offline')]],
        ['x1', ['M2'], 'Keep sessions alive across the billing redirect', 'Sam Turner'],
        ['s2', ['s1'], 'Index customers for search', 'Jonas Weber'],
        ['c2', ['c1'], 'Extract the email strings', 'Lea Fischer'],
        ['a1', ['M2'], 'Add the price table', 'Ada Novak'],
        ['M2', ['M1'], 'Release 2.5', 'Mira Okafor', [tag('v2.5.0'), branch('release/2.5')]],
        ['s1', ['M1'], 'Add the search field to the customer list', 'Jonas Weber'],
        ['c1', ['M1'], 'Set up the translation files', 'Lea Fischer'],
        ['M1', ['M0', 't1'], 'Merge pull request #150 from acme/feature/teams', 'Mira Okafor'],
        ['t1', ['M0'], 'Invite teammates by email', 'Sam Turner'],
        ['M0', ['Mx'], 'Tidy the settings layout', 'Sam Turner'],
    ],
    2,
);

const histories: Record<string, BranchGraphCommit[]> = { branching, linear, busy };

/* ---------- The entry ---------- */

const knobs: Knob[] = [
    {
        id: 'history',
        label: 'History',
        options: [o('branching', 'Branches'), o('busy', 'Busy'), o('linear', 'Linear')],
        default: 'branching',
    },
    {
        id: 'density',
        label: 'Rows',
        options: [o('compact', 'Compact · 34'), o('default', 'Default · 41')],
        default: 'compact',
    },
    { id: 'author', label: 'Author', switch: true, default: true },
    { id: 'hash', label: 'Hash', switch: true, default: true },
    { id: 'time', label: 'Time', switch: true, default: true },
];

const BranchGraphPreview = ({ knobs: values }: { knobs: Record<string, string | boolean> }) => {
    const commits = histories[values.history as string] ?? branching;
    const [selected, setSelected] = useState<string | null>(null);
    const columns = (['author', 'hash', 'time'] as const).filter(
        column => values[column],
    ) as BranchGraphColumn[];
    return (
        <BranchGraph
            aria-label="Commits"
            className="w-full max-w-4xl"
            columns={columns}
            commits={commits}
            density={values.density as 'compact' | 'default'}
            onSelectedChange={setSelected}
            selected={selected}
        />
    );
};

export const entry: Entry = {
    id: 'branch-graph',
    name: 'Branch graph',
    category: 'content',
    description: 'A commit history: a row per commit, beside the lanes its branches run in.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs,
    Preview: BranchGraphPreview,
};

/* ---------- In use: a repository's commits ---------- */

const CommitsPage = () => {
    const [scope, setScope] = useState('all');
    const [selected, setSelected] = useState<string | null>(hash('e3'));
    const commits =
        scope === 'all'
            ? branching
            : branching
                  .filter(commit =>
                      ['m6', 'm5', 'm4', 'm3', 'm2', 'm1', 'm0'].some(
                          key => hash(key) === commit.id,
                      ),
                  )
                  .map(commit => ({ ...commit, parents: commit.parents.slice(0, 1) }));
    return (
        <AppWindow
            actions={
                <Button variant="secondary">
                    <GitBranch {...icon} />
                    New branch
                </Button>
            }
            description="acme/billing · 15 commits on 4 branches"
            nav="none"
            title="Commits"
        >
            <div className="flex flex-col gap-3">
                <SegmentedControl onValueChange={value => setScope(String(value))} value={scope}>
                    <SegmentedControlItem value="all">All branches</SegmentedControlItem>
                    <SegmentedControlItem value="main">main only</SegmentedControlItem>
                </SegmentedControl>
                <BranchGraph
                    aria-label="Commits on acme/billing"
                    commits={commits}
                    onSelectedChange={setSelected}
                    selected={selected}
                />
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Commits',
    note: "A repository's history: two features and a hotfix merged into main, the webhooks branch still open.",
    app: true,
    render: () => <CommitsPage />,
};
