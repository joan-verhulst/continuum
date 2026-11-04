import {
    Button,
    Card,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
} from 'continuum';
import { useState } from 'react';
import type { Entry, InUse } from '../kit';

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
        <Card className="w-full max-w-md">
            <SettingGroup title="Notifications">
                <SettingRow
                    control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                    description="Email when something is flagged for attention"
                    title="Anomaly alerts"
                />
                <SettingRow
                    control={
                        <Select defaultValue="medium">
                            <SelectTrigger indicator="right" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                    description="Threshold for flagging anomalies"
                    disabled={!alerts}
                    title="Alert sensitivity"
                />
                <SettingRow
                    control={<Switch defaultChecked />}
                    description="A seven-day overview every Monday"
                    title="Weekly digest"
                />
                <SettingRow
                    control={<Button variant="secondary">Send a test</Button>}
                    description="A sample alert to every channel"
                    labelControl={false}
                    title="Test alerts"
                />
            </SettingGroup>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Notification settings',
    note: 'Setting rows with a switch, a picker and an action, one disabling the next.',
    canvas: true,
    render: () => <NotificationSettings />,
};
