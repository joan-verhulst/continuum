import {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
    Tabs,
    TabsList,
    TabsTrigger,
} from 'continuum';
import { useState } from 'react';
import { SectionHead } from '../../screens/workspace';
import { AppWindow, type Entry, type InUse } from '../kit';

const SettingRowPreview = () => {
    const [alerts, setAlerts] = useState(true);

    return (
        <SettingGroup className="w-full max-w-80" title="Notifications">
            <SettingRow
                control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                description="Email when something is flagged"
                title="Anomaly alerts"
            />
            <SettingRow
                control={<Switch defaultChecked />}
                description="A seven-day overview every Monday"
                disabled={!alerts}
                title="Weekly digest"
            />
        </SettingGroup>
    );
};

export const entry: Entry = {
    id: 'setting-row',
    name: 'Setting row',
    category: 'forms',
    description: 'A setting with its switch, picker or button on the right.',
    stageClassName: 'items-stretch',
    Preview: SettingRowPreview,
};

const NotificationSettings = () => {
    const [alerts, setAlerts] = useState(true);

    return (
        <AppWindow
            description="The workspace, its members and how it keeps you posted."
            nav="rail"
            place="settings"
            title="Settings"
            width="default"
        >
            <Tabs defaultValue="notifications">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
            </Tabs>
            <section className="flex flex-col gap-5">
                <SectionHead
                    description="When a number on the overview moves more than it should."
                    title="Alerts"
                />
                <SettingGroup aria-label="Alerts">
                    <SettingRow
                        control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                        description="An email when revenue, churn or sign-ups move out of their usual range."
                        title="Anomaly alerts"
                    />
                    <SettingRow
                        control={
                            <Select defaultValue="medium">
                                <SelectTrigger className="w-40" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        }
                        description="How far a number moves before it counts as an anomaly."
                        disabled={!alerts}
                        title="Sensitivity"
                    />
                    <SettingRow
                        control={<Button variant="secondary">Send a test</Button>}
                        description="A sample alert to every channel, to check it arrives."
                        disabled={!alerts}
                        labelControl={false}
                        title="Test alerts"
                    />
                </SettingGroup>
            </section>
            <section className="flex flex-col gap-5">
                <SectionHead description="Summaries sent on a schedule." title="Digests" />
                <SettingGroup aria-label="Digests">
                    <SettingRow
                        control={<Switch defaultChecked />}
                        description="Revenue, new customers and churn, every Monday at nine."
                        title="Weekly digest"
                    />
                    <SettingRow
                        control={<Switch />}
                        description="The month’s invoices and what is still outstanding."
                        title="Monthly statement"
                    />
                </SettingGroup>
            </section>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Notification settings',
    note: 'Setting rows on the settings page: switches, a picker and an action, one switch disabling the next two.',
    app: true,
    render: () => <NotificationSettings />,
};
