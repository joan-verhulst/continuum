import {
    AvatarStack,
    Badge,
    BottomBar,
    Button,
    Dock,
    DockAction,
    DockItem,
    Progress,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
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
    Circle,
    CircleCheck,
    CircleDot,
    CircleDotDashed,
    Ellipsis,
    type LucideIcon,
    Minus,
    Plus,
    SignalHigh,
    SignalLow,
    SignalMedium,
    TriangleAlert,
} from 'lucide-react';
import { Fragment } from 'react';
import { Column, Frame, icon, PageHead, Person } from './shell';

/*
 * Issues: the platform team's current cycle as a table grouped by status. Each row reads left to
 * right as a team reads it: how urgent, which one, what it is and what it touches, who has it,
 * how big, and when it is due. The views are in the dock, the one primary beside them.
 */

type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
type Label = { name: string; tone: 'error' | 'primary' | 'success' | 'warning' | 'neutral' };

const priorityIcon: Record<Priority, { icon: LucideIcon; label: string; className: string }> = {
    urgent: { icon: TriangleAlert, label: 'Urgent', className: 'text-error-600' },
    high: { icon: SignalHigh, label: 'High', className: 'text-neutral-950' },
    medium: { icon: SignalMedium, label: 'Medium', className: 'text-neutral-700' },
    low: { icon: SignalLow, label: 'Low', className: 'text-neutral-500' },
    none: { icon: Minus, label: 'No priority', className: 'text-neutral-400' },
};

const bug: Label = { name: 'Bug', tone: 'error' };
const feature: Label = { name: 'Feature', tone: 'primary' };
const improvement: Label = { name: 'Improvement', tone: 'success' };
const perf: Label = { name: 'Performance', tone: 'warning' };
const debt: Label = { name: 'Tech debt', tone: 'neutral' };

type Issue = {
    id: string;
    title: string;
    priority: Priority;
    labels: Label[];
    project: string;
    assignee: string;
    estimate: number;
    due?: string;
    overdue?: boolean;
};

type Group = {
    status: string;
    icon: LucideIcon;
    className: string;
    total: number;
    issues: Issue[];
};

const groups: Group[] = [
    {
        status: 'In progress',
        icon: CircleDotDashed,
        className: 'text-warning-600',
        total: 6,
        issues: [
            {
                id: 'PLT-1284',
                title: 'Retry job charges a settled invoice a second time',
                priority: 'urgent',
                labels: [bug],
                project: 'Billing v2',
                assignee: 'LO',
                estimate: 3,
                due: 'Today',
                overdue: true,
            },
            {
                id: 'PLT-1279',
                title: 'Usage-based pricing: metered line items on invoices',
                priority: 'high',
                labels: [feature],
                project: 'Billing v2',
                assignee: 'MC',
                estimate: 8,
                due: 'Nov 14',
            },
            {
                id: 'PLT-1262',
                title: 'Cold start of the reports service over 4s',
                priority: 'high',
                labels: [perf],
                project: 'Reports',
                assignee: 'SK',
                estimate: 5,
                due: 'Nov 12',
            },
            {
                id: 'PLT-1251',
                title: 'Move webhooks to the new event bus',
                priority: 'medium',
                labels: [debt],
                project: 'Platform',
                assignee: 'NP',
                estimate: 5,
            },
        ],
    },
    {
        status: 'In review',
        icon: CircleDot,
        className: 'text-primary-600',
        total: 4,
        issues: [
            {
                id: 'PLT-1270',
                title: 'SAML: map groups to workspace roles',
                priority: 'high',
                labels: [feature],
                project: 'Identity',
                assignee: 'AR',
                estimate: 3,
                due: 'Nov 10',
            },
            {
                id: 'PLT-1266',
                title: 'Table export keeps the applied filters',
                priority: 'medium',
                labels: [improvement],
                project: 'Reports',
                assignee: 'SK',
                estimate: 2,
            },
            {
                id: 'PLT-1240',
                title: 'Audit log drops events over 64 KB',
                priority: 'low',
                labels: [bug],
                project: 'Platform',
                assignee: 'LO',
                estimate: 1,
            },
        ],
    },
    {
        status: 'Todo',
        icon: Circle,
        className: 'text-neutral-500',
        total: 9,
        issues: [
            {
                id: 'PLT-1290',
                title: 'Dunning emails in the customer’s language',
                priority: 'medium',
                labels: [feature, improvement],
                project: 'Billing v2',
                assignee: 'MC',
                estimate: 3,
                due: 'Nov 15',
            },
            {
                id: 'PLT-1288',
                title: 'Rate-limit headers on every public endpoint',
                priority: 'low',
                labels: [improvement],
                project: 'Platform',
                assignee: 'NP',
                estimate: 2,
            },
            {
                id: 'PLT-1287',
                title: 'Remove the legacy CSV importer',
                priority: 'none',
                labels: [debt],
                project: 'Platform',
                assignee: 'AR',
                estimate: 1,
            },
        ],
    },
    {
        status: 'Done',
        icon: CircleCheck,
        className: 'text-success-600',
        total: 26,
        issues: [
            {
                id: 'PLT-1231',
                title: 'Proration when a plan changes mid-cycle',
                priority: 'high',
                labels: [feature],
                project: 'Billing v2',
                assignee: 'MC',
                estimate: 5,
            },
        ],
    },
];

const IssueRow = ({ issue, group }: { issue: Issue; group: Group }) => {
    const priority = priorityIcon[issue.priority];
    const PriorityIcon = priority.icon;
    const StatusIcon = group.icon;

    // The avatar and the menu button sit inside the row's 41 rather than padding it out.
    return (
        <TableRow className="[&>td]:py-0">
            <TableCell className="w-10 pr-0">
                <PriorityIcon
                    aria-label={priority.label}
                    className={`size-4 ${priority.className}`}
                    {...icon}
                />
            </TableCell>
            <TableCell className="w-24 font-normal text-neutral-600 tabular-nums">
                {issue.id}
            </TableCell>
            <TableCell className="max-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <StatusIcon
                        aria-label={group.status}
                        className={`size-4 shrink-0 ${group.className}`}
                        {...icon}
                    />
                    <span className="min-w-0 truncate">{issue.title}</span>
                    {issue.labels.map(label => (
                        <Badge key={label.name} tone={label.tone} variant="dot">
                            {label.name}
                        </Badge>
                    ))}
                </div>
            </TableCell>
            <TableCell className="w-28 font-normal text-neutral-700">{issue.project}</TableCell>
            <TableCell className="w-12">
                <Person initials={issue.assignee} />
            </TableCell>
            <TableCell className="w-14 font-normal text-neutral-700" numeric>
                {issue.estimate}
            </TableCell>
            <TableCell
                className={`w-20 font-normal tabular-nums ${issue.overdue ? 'text-error-600' : 'text-neutral-700'}`}
                numeric
            >
                {issue.due ?? '—'}
            </TableCell>
            <TableCell className="w-11 px-1">
                <Button aria-label="Issue actions" size="icon-sm" variant="ghost">
                    <Ellipsis {...icon} />
                </Button>
            </TableCell>
        </TableRow>
    );
};

export const IssuesScreen = () => (
    <Frame
        bar={
            <BottomBar floating>
                <Dock aria-label="Views" defaultValue="cycle">
                    <DockItem value="cycle">
                        Current cycle{' '}
                        <span className="font-normal tabular-nums opacity-70">45</span>
                    </DockItem>
                    <DockItem value="mine">
                        Mine <span className="font-normal tabular-nums opacity-70">7</span>
                    </DockItem>
                    <DockItem value="backlog">
                        Backlog <span className="font-normal tabular-nums opacity-70">132</span>
                    </DockItem>
                    <DockItem value="triage">
                        Triage <span className="font-normal tabular-nums opacity-70">5</span>
                    </DockItem>
                </Dock>
                <DockAction>
                    <Plus {...icon} />
                    New issue
                </DockAction>
            </BottomBar>
        }
        place="issues"
        trail={['Issues', 'Platform', 'Cycle 24']}
    >
        <Column className="gap-4" width="wide">
            <PageHead
                badge={
                    <Badge tone="success" variant="dot">
                        Active
                    </Badge>
                }
                description="Platform team · 2 – 15 November · 6 days left · 42 of 68 points done"
                title="Cycle 24"
            >
                <AvatarStack className="mr-2">
                    <Person initials="MC" />
                    <Person initials="LO" />
                    <Person initials="SK" />
                    <Person initials="NP" />
                    <Person initials="AR" />
                </AvatarStack>
                <div className="w-44">
                    <Progress label="Progress" showValue value={62} />
                </div>
            </PageHead>
            <Table
                toolbar={
                    <TableToolbar>
                        <TableSearch aria-label="Search issues" placeholder="Search issues" />
                        <TableToolbarEnd>
                            <Select defaultValue="status">
                                <SelectTrigger aria-label="Group by" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="status">Group by status</SelectItem>
                                    <SelectItem value="assignee">Group by assignee</SelectItem>
                                    <SelectItem value="project">Group by project</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="any">
                                <SelectTrigger aria-label="Priority" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any priority</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableToolbarEnd>
                    </TableToolbar>
                }
            >
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 pr-0">
                            <span className="sr-only">Priority</span>
                        </TableHead>
                        <TableHead className="w-24">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-28">Project</TableHead>
                        <TableHead className="w-12">
                            <span className="sr-only">Assignee</span>
                        </TableHead>
                        <TableHead className="w-14" numeric>
                            Points
                        </TableHead>
                        <TableHead className="w-20" numeric>
                            Due
                        </TableHead>
                        <TableHead className="w-11 px-1">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map(group => (
                        <Fragment key={group.status}>
                            <TableGroupRow hint={group.total}>{group.status}</TableGroupRow>
                            {group.issues.map(issue => (
                                <IssueRow group={group} issue={issue} key={issue.id} />
                            ))}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </Column>
    </Frame>
);
