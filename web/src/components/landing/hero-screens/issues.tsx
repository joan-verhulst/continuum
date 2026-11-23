'use client';

import {
    BottomBar,
    Button,
    Chip,
    Dock,
    DockAction,
    DockCount,
    DockItem,
    FilterMenu,
    FilterMenuTrigger,
    MenuItem,
    MenuItemShortcut,
    PageContent,
    Progress,
    Select,
    SelectTrigger,
    SelectValue,
    Separator,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
} from 'continuum';
import {
    ChevronDown,
    ChevronRight,
    CircleCheck,
    CircleDashed,
    CircleUserRound,
    CircleX,
    Contrast,
    EllipsisVertical,
    Eye,
    GitPullRequest,
    GitPullRequestDraft,
    Link,
    type LucideIcon,
    Minus,
    Plus,
    SignalHigh,
    SignalLow,
    SignalMedium,
    Tag,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import { Fragment } from 'react';
import { compact, Frame, type Initials, icon, PageHead, Person, people } from './shell';

/** The page's start: the system's 96 below the header bar's hairline, at every size. */
const TOP = 96;

/*
 * Issues, a dense index: the platform team's Cycle 24, 9 to 22 November, six days left. The head
 * says how far the cycle has come in points; the table's own bar finds and narrows; the cycle's 38
 * issues are grouped by status, the work in progress first, each row its priority, ID, title and
 * labels, the pull request it is in, who has it, its estimate and its due date. One row is pointed
 * at with its menu open. The list's views sit in the dock beside the page's one primary action.
 */

type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

const priorities: Record<Priority, { icon: LucideIcon; label: string; className: string }> = {
    urgent: { icon: TriangleAlert, label: 'Urgent', className: 'text-error-600' },
    high: { icon: SignalHigh, label: 'High', className: 'text-neutral-950' },
    medium: { icon: SignalMedium, label: 'Medium', className: 'text-neutral-700' },
    low: { icon: SignalLow, label: 'Low', className: 'text-neutral-600' },
    none: { icon: Minus, label: 'No priority', className: 'text-neutral-600' },
};

type Pull = { number: number; draft?: boolean };

type Issue = {
    id: string;
    title: string;
    priority: Priority;
    labels: string[];
    pull?: Pull;
    assignee: Initials;
    points: number;
    due?: string;
    late?: boolean;
};

type Group = {
    status: string;
    icon: LucideIcon;
    /** The status icon's tone: the 700 of its ramp, the step an icon reaches 3:1 with. */
    tone: string;
    count: number;
    issues: Issue[];
};

const groups: Group[] = [
    {
        status: 'In progress',
        icon: Contrast,
        tone: 'text-warning-700',
        count: 6,
        issues: [
            {
                id: 'NW-1284',
                title: 'Retry job charges a settled invoice a second time',
                priority: 'urgent',
                labels: ['Bug', 'Billing'],
                pull: { number: 2291 },
                assignee: 'LO',
                points: 3,
                due: '14 Nov',
                late: true,
            },
            {
                id: 'NW-1279',
                title: 'Metered usage lines on invoices',
                priority: 'high',
                labels: ['Feature', 'Billing'],
                pull: { number: 2287, draft: true },
                assignee: 'AR',
                points: 5,
                due: '19 Nov',
            },
            {
                id: 'NW-1290',
                title: 'SAML sign-in drops nested groups when mapping roles',
                priority: 'high',
                labels: ['Bug', 'Auth'],
                pull: { number: 2294 },
                assignee: 'SK',
                points: 2,
                due: '18 Nov',
            },
            {
                id: 'NW-1262',
                title: 'Reports service takes 4.2 s to cold start',
                priority: 'medium',
                labels: ['Performance'],
                pull: { number: 2280, draft: true },
                assignee: 'TB',
                points: 3,
                due: '20 Nov',
            },
            {
                id: 'NW-1251',
                title: 'Move webhook delivery onto the event bus',
                priority: 'medium',
                labels: ['Infra'],
                assignee: 'NP',
                points: 5,
            },
            {
                id: 'NW-1301',
                title: 'Payment webhooks time out after 10 s under load',
                priority: 'high',
                labels: ['Bug', 'Payments'],
                pull: { number: 2296 },
                assignee: 'MC',
                points: 2,
                due: '17 Nov',
            },
        ],
    },
    {
        status: 'In review',
        icon: Eye,
        tone: 'text-primary-700',
        count: 4,
        issues: [
            {
                id: 'NW-1270',
                title: 'Exports keep the filters applied to a table',
                priority: 'medium',
                labels: ['Feature'],
                pull: { number: 2276 },
                assignee: 'EB',
                points: 2,
                due: '18 Nov',
            },
            {
                id: 'NW-1240',
                title: 'Audit log drops events over 64 KB',
                priority: 'high',
                labels: ['Bug', 'Security'],
                pull: { number: 2269 },
                assignee: 'LO',
                points: 2,
                due: '19 Nov',
            },
            {
                id: 'NW-1258',
                title: 'Dunning emails in the customer’s own language',
                priority: 'medium',
                labels: ['Billing', 'i18n'],
                pull: { number: 2271 },
                assignee: 'MC',
                points: 3,
                due: '21 Nov',
            },
            {
                id: 'NW-1266',
                title: 'Rate-limit headers on every public endpoint',
                priority: 'low',
                labels: ['API'],
                pull: { number: 2273 },
                assignee: 'NP',
                points: 1,
            },
        ],
    },
    {
        status: 'Todo',
        icon: CircleDashed,
        tone: 'text-neutral-600',
        count: 8,
        issues: [
            {
                id: 'NW-1293',
                title: 'Seat changes prorate to the day',
                priority: 'high',
                labels: ['Billing'],
                assignee: 'AR',
                points: 2,
                due: '21 Nov',
            },
            {
                id: 'NW-1288',
                title: 'Invoice PDFs print the tax ID twice',
                priority: 'medium',
                labels: ['Bug', 'Billing'],
                assignee: 'LO',
                points: 1,
            },
            {
                id: 'NW-1286',
                title: 'Alert when a charge is retried more than twice',
                priority: 'high',
                labels: ['Billing', 'Alerts'],
                assignee: 'LO',
                points: 1,
                due: '22 Nov',
            },
            {
                id: 'NW-1281',
                title: 'Cursor pagination on /v2/customers',
                priority: 'medium',
                labels: ['API'],
                assignee: 'NP',
                points: 3,
            },
            {
                id: 'NW-1298',
                title: 'Customer portal shows a cancelled plan as active',
                priority: 'medium',
                labels: ['Bug'],
                assignee: 'EB',
                points: 2,
            },
            {
                id: 'NW-1295',
                title: 'Upgrade the reports replica to Postgres 17',
                priority: 'low',
                labels: ['Infra'],
                assignee: 'TB',
                points: 3,
            },
            {
                id: 'NW-1287',
                title: 'Remove the legacy CSV importer',
                priority: 'low',
                labels: ['Cleanup'],
                assignee: 'TB',
                points: 2,
            },
            {
                id: 'NW-1297',
                title: 'Flaky test: checkout webhook signature',
                priority: 'none',
                labels: ['Tests'],
                assignee: 'SK',
                points: 1,
            },
        ],
    },
    { status: 'Done', icon: CircleCheck, tone: 'text-success-700', count: 17, issues: [] },
    { status: 'Canceled', icon: CircleX, tone: 'text-neutral-600', count: 3, issues: [] },
];

/** The row the pointer is on, its menu open. */
const POINTED = 'NW-1290';

/**
 * The pointed row's menu, drawn where it opens rather than portalled: a DropdownMenu's panel and
 * rows, the states set by hand as Base UI would set them. A phone has no pointer, so there the row
 * rests like the others and the menu stays shut.
 */
const pointedRest = '@max-shell-compact/shell:bg-transparent';

const RowMenu = () => (
    <div
        className={`absolute top-full right-1 z-20 mt-1 flex w-56 flex-col gap-1 rounded-item border border-neutral-200 bg-neutral-50 p-1 text-left shadow-float ${compact.hidden}`}
    >
        <MenuItem
            leading={<Contrast {...icon} />}
            meta="In progress"
            trailing={<ChevronRight {...icon} />}
        >
            Status
        </MenuItem>
        <MenuItem
            data-highlighted=""
            leading={<CircleUserRound {...icon} />}
            meta="Sara Kim"
            trailing={<ChevronRight {...icon} />}
        >
            Assignee
        </MenuItem>
        <MenuItem
            leading={<SignalHigh {...icon} />}
            meta="High"
            trailing={<ChevronRight {...icon} />}
        >
            Priority
        </MenuItem>
        <MenuItem leading={<Tag {...icon} />} trailing={<ChevronRight {...icon} />}>
            Labels
        </MenuItem>
        <MenuItem
            leading={<Link {...icon} />}
            trailing={<MenuItemShortcut>⌘ ⇧ C</MenuItemShortcut>}
        >
            Copy link
        </MenuItem>
        <Separator className="-mx-1 w-auto" />
        <MenuItem leading={<Trash2 {...icon} />} variant="danger">
            Delete issue
        </MenuItem>
    </div>
);

const IssueRow = ({ issue }: { issue: Issue }) => {
    const priority = priorities[issue.priority];
    const PriorityIcon = priority.icon;
    const PullIcon = issue.pull?.draft ? GitPullRequestDraft : GitPullRequest;
    const pointed = issue.id === POINTED;

    // The avatar, the chips and the menu button sit inside the row's 41 rather than padding it out.
    // On a phone the title takes a second line of meta, the ID and the due date, and the row its 54.
    return (
        <TableRow
            className={`@max-shell-compact/shell:[&>td]:py-2 [&>td]:py-0 ${pointed ? `bg-neutral-950/3 ${pointedRest}` : ''}`}
        >
            <TableCell className="pr-0">
                <PriorityIcon
                    aria-label={priority.label}
                    className={`size-4 ${priority.className}`}
                    {...icon}
                />
            </TableCell>
            <TableCell className={`font-normal text-neutral-600 tabular-nums ${compact.hidden}`}>
                {issue.id}
            </TableCell>
            <TableCell className="max-w-0">
                <span className="flex min-w-0 @max-shell-compact/shell:flex-col items-center @max-shell-compact/shell:items-stretch @max-shell-compact/shell:gap-1 gap-3">
                    <span className="min-w-0 truncate">{issue.title}</span>
                    <span className={`flex shrink-0 items-center gap-1 ${compact.hidden}`}>
                        {issue.labels.map(label => (
                            <Chip key={label}>{label}</Chip>
                        ))}
                    </span>
                    <span className="@max-shell-compact/shell:block hidden truncate font-normal text-neutral-600 tabular-nums">
                        {issue.id}
                        {issue.due && (
                            <>
                                {' · '}
                                <span className={issue.late ? 'text-error-600' : undefined}>
                                    Due {issue.due}
                                </span>
                            </>
                        )}
                    </span>
                </span>
            </TableCell>
            <TableCell className={`font-normal text-neutral-700 tabular-nums ${compact.hidden}`}>
                {issue.pull ? (
                    <span className="flex items-center gap-1.5">
                        <PullIcon className="size-4 text-neutral-600" {...icon} />#
                        {issue.pull.number}
                    </span>
                ) : (
                    '—'
                )}
            </TableCell>
            <TableCell>
                {/* A person as the table shows one; on a phone the avatar alone. */}
                <span className="flex min-w-0 items-center gap-2 font-normal text-neutral-700">
                    <Person initials={issue.assignee} />
                    <span className={`truncate ${compact.hidden}`}>{people[issue.assignee]}</span>
                </span>
            </TableCell>
            <TableCell className={`font-normal text-neutral-700 ${compact.hidden}`} numeric>
                {issue.points}
            </TableCell>
            <TableCell
                className={`font-normal tabular-nums ${issue.late ? 'text-error-600' : 'text-neutral-700'} ${compact.hidden}`}
            >
                {issue.due ?? '—'}
            </TableCell>
            <TableCell className="relative px-1">
                <Button
                    aria-label={`Actions for ${issue.id}`}
                    className={
                        pointed
                            ? `bg-neutral-950/5 text-neutral-800 ${pointedRest} @max-shell-compact/shell:text-neutral-600`
                            : undefined
                    }
                    size="icon-sm"
                    variant="ghost"
                >
                    <EllipsisVertical {...icon} />
                </Button>
                {pointed && <RowMenu />}
            </TableCell>
        </TableRow>
    );
};

/** What finds and narrows the cycle's issues, on the table's own bar. */
const toolbar = (
    <TableToolbar>
        <TableSearch aria-label="Search issues" placeholder="Search issues" />
        <TableToolbarEnd>
            {/* On a phone the select folds into the one Filter button. */}
            <Select defaultValue="anyone" items={[{ value: 'anyone', label: 'Any assignee' }]}>
                <SelectTrigger aria-label="Assignee" className={compact.hidden} size="sm">
                    <SelectValue />
                </SelectTrigger>
            </Select>
            <FilterMenu>
                <FilterMenuTrigger />
            </FilterMenu>
        </TableToolbarEnd>
    </TableToolbar>
);

/**
 * The cycle's issues by status, the groups with work left open and the finished ones folded. A
 * cycle holds more than a screen, so the list runs on under the dock, as it does in the app.
 */
const CycleIssues = () => {
    return (
        <Table toolbar={toolbar}>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10 pr-0">
                        <span className="sr-only">Priority</span>
                    </TableHead>
                    <TableHead className={`w-24 ${compact.hidden}`}>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className={`w-24 ${compact.hidden}`}>PR</TableHead>
                    <TableHead className="@max-shell-compact/shell:w-12 w-40">
                        <span className="@max-shell-compact/shell:sr-only">Assignee</span>
                    </TableHead>
                    <TableHead className={`w-16 ${compact.hidden}`} numeric>
                        Est.
                    </TableHead>
                    <TableHead className={`w-20 ${compact.hidden}`}>Due</TableHead>
                    <TableHead className="w-11 px-1">
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map(group => {
                    const open = group.issues.length > 0;
                    const Chevron = open ? ChevronDown : ChevronRight;
                    const StatusIcon = group.icon;
                    return (
                        <Fragment key={group.status}>
                            <TableGroupRow hint={group.count}>
                                <span className="inline-flex items-center gap-2">
                                    <Chevron className="size-4 text-neutral-600" {...icon} />
                                    <StatusIcon className={`size-4 ${group.tone}`} {...icon} />
                                    {group.status}
                                </span>
                            </TableGroupRow>
                            {open &&
                                group.issues.map(issue => (
                                    <IssueRow issue={issue} key={issue.id} />
                                ))}
                        </Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
};

/** The list's views and the page's one primary action, at the panel's foot. */
const dock = (
    <BottomBar floating>
        <Dock aria-label="Views" defaultValue="all">
            <DockItem value="all">
                All issues <DockCount>38</DockCount>
            </DockItem>
            <DockItem value="active">
                Active <DockCount>18</DockCount>
            </DockItem>
            <DockItem value="mine">
                Mine <DockCount>6</DockCount>
            </DockItem>
            <DockItem value="done">
                Done <DockCount>17</DockCount>
            </DockItem>
        </Dock>
        <DockAction>
            <Plus {...icon} />
            New issue
        </DockAction>
    </BottomBar>
);

export const IssuesScreen = () => {
    return (
        <Frame bar={dock} place="issues" trail={['Issues', 'Platform', 'Cycle 24']}>
            {/* The dense column: seven columns of meta beside a title and its labels. A block of its
                own around it, as the app's scrolling page is, so the column takes the room less its
                side padding rather than the flex row's full width plus it. */}
            <div className="@max-shell-compact/shell:min-h-0 @max-shell-compact/shell:flex-1 @max-shell-compact/shell:overflow-y-auto @max-shell-compact/shell:pb-24">
                <PageContent
                    // On a phone, the compact shell's 40 down and 16 a side.
                    className="flex flex-col gap-16 @max-shell-compact/shell:px-4 px-6 @max-shell-compact/shell:pt-10!"
                    style={{ paddingTop: TOP }}
                    width="dense"
                >
                    <PageHead
                        description="Platform team · 9 – 22 November · 6 days left"
                        title="Cycle 24"
                    >
                        <Progress
                            className="@max-shell-compact/shell:mr-0 mr-4 @max-shell-compact/shell:w-full w-56"
                            label="25 of 68 points done"
                            showValue
                            value={37}
                        />
                        <Button className={compact.hidden} variant="secondary">
                            Cycle report
                        </Button>
                    </PageHead>
                    <CycleIssues />
                </PageContent>
            </div>
        </Frame>
    );
};
