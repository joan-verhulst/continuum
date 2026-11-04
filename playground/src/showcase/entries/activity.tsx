import {
    ActivityItem,
    ActivityList,
    Avatar,
    Badge,
    Button,
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
} from 'continuum';
import { ArrowUpRight, CircleAlert, CircleCheck, Clock, FileText, Mail, Plus } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon, previewIcon } from '../kit';

const ActivityPreview = () => (
    <ActivityList className="w-full max-w-80">
        <ActivityItem
            action={<Badge tone="success">Paid</Badge>}
            icon={<CircleCheck {...previewIcon} />}
            time="Today, 09:12"
            title="Payment received"
            tone="success"
        />
        <ActivityItem
            action={<Badge tone="warning">Reminder</Badge>}
            icon={<Clock {...previewIcon} />}
            time="2 days ago"
            title="Reminder sent"
            tone="warning"
        />
    </ActivityList>
);

export const entry: Entry = {
    id: 'activity',
    name: 'Activity list',
    category: 'content',
    description: 'History, newest first, toned by what happened.',
    Preview: ActivityPreview,
};

const lumenActivity = [
    {
        tone: 'success',
        icon: <CircleCheck {...icon} />,
        title: 'Payment of €760.00 received for INV-0139',
        time: 'Today, 09:12',
        status: <Badge tone="success">Paid</Badge>,
    },
    {
        tone: 'warning',
        icon: <Clock {...icon} />,
        title: 'Second reminder sent to finance@lumenlabs.io',
        time: '2 days ago',
        status: <Badge tone="warning">Reminder</Badge>,
    },
    {
        tone: 'error',
        icon: <CircleAlert {...icon} />,
        title: 'Card payment for INV-0139 declined',
        time: '5 days ago',
        status: <Badge tone="error">Failed</Badge>,
    },
    {
        tone: 'neutral',
        icon: <ArrowUpRight {...icon} />,
        title: 'Moved from Starter to the Pro plan by Maya Chen',
        time: '12 October',
    },
    {
        tone: 'neutral',
        icon: <FileText {...icon} />,
        title: 'INV-0139 created and sent by Maya Chen',
        time: '1 October',
    },
] as const;

const CustomerActivity = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Mail {...icon} /> Email
                </Button>
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            </>
        }
        description="Pro plan · a customer since March 2024"
        nav="top"
        place="customers"
        title={
            <span className="flex items-center gap-3">
                <Avatar fallback="LL" size={32} />
                Lumen Labs
            </span>
        }
    >
        <Tabs defaultValue="activity">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoices">
                    Invoices <TabsCount>12</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent className="pt-4" value="activity">
                <ActivityList>
                    {lumenActivity.map(item => (
                        <ActivityItem
                            action={'status' in item ? item.status : undefined}
                            icon={item.icon}
                            key={item.title}
                            time={item.time}
                            title={item.title}
                            tone={item.tone}
                        />
                    ))}
                </ActivityList>
            </TabsContent>
        </Tabs>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'A customer’s activity',
    note: 'The Activity tab of a customer, newest first, each event in its tone with its status beside it.',
    app: true,
    render: () => <CustomerActivity />,
};
