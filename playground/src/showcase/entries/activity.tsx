import { ActivityItem, ActivityList, Badge, Button, Card, CardHeader, CardTitle } from 'continuum';
import { CircleAlert, CircleCheck, Clock, FileText } from 'lucide-react';
import { type Entry, type InUse, icon, previewIcon } from '../kit';

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

const ActivityFeed = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <Button variant="ghost">View all</Button>
        </CardHeader>
        <ActivityList>
            <ActivityItem
                action={<Badge tone="success">Paid</Badge>}
                icon={<CircleCheck {...icon} />}
                time="Today, 09:12"
                title="Payment received from Acme"
                tone="success"
            />
            <ActivityItem
                action={<Badge tone="warning">Reminder</Badge>}
                icon={<Clock {...icon} />}
                time="2 days ago"
                title="Reminder sent to Lumen Labs"
                tone="warning"
            />
            <ActivityItem
                action={<Badge tone="error">Failed</Badge>}
                icon={<CircleAlert {...icon} />}
                time="3 days ago"
                title="Payout to Tideline Travel bounced"
                tone="error"
            />
            <ActivityItem
                icon={<FileText {...icon} />}
                time="5 days ago"
                title="INV-0142 created by Jane"
            />
        </ActivityList>
    </Card>
);

export const inUse: InUse = {
    title: 'Activity feed',
    note: 'What happened, when, in a tone, with the status beside it.',
    canvas: true,
    render: () => <ActivityFeed />,
};
