import {
    BottomBar,
    Button,
    Card,
    Dock,
    DockItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
} from 'continuum';
import { Bell, CreditCard, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const settingRowKnobs: Knob[] = [
    {
        id: 'control',
        label: 'Control',
        options: [o('switch', 'Switch'), o('picker', 'Picker'), o('button', 'Button')],
        default: 'switch',
    },
    { id: 'description', label: 'Descriptions', switch: true, default: true },
    { id: 'title', label: 'Group title', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

/** One control per setting: a switch turns a thing on, a picker sets a value, a button does a thing. */
const settingControl = (kind: unknown) =>
    kind === 'picker' ? (
        <Select defaultValue="monday">
            <SelectTrigger className="w-32" indicator="right" size="sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
        </Select>
    ) : kind === 'button' ? (
        <Button variant="secondary">Send a test</Button>
    ) : (
        <Switch defaultChecked />
    );

const settingText = {
    switch: { title: 'Weekly digest', description: 'A seven-day overview' },
    picker: { title: 'Digest day', description: 'When the overview is sent' },
    button: { title: 'Test digest', description: 'A sample, to check it arrives' },
};

const SettingRowPreview = ({ knobs }: PreviewProps) => {
    const [alerts, setAlerts] = useState(true);
    const kind =
        knobs.control === 'picker' || knobs.control === 'button' ? knobs.control : 'switch';

    return (
        <SettingGroup
            aria-label={knobs.title ? undefined : 'Notifications'}
            className="w-full max-w-80"
            disabled={Boolean(knobs.disabled)}
            title={knobs.title ? 'Notifications' : undefined}
        >
            <SettingRow
                control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                description={knobs.description ? 'Email when something is flagged' : undefined}
                title="Anomaly alerts"
            />
            <SettingRow
                control={settingControl(kind)}
                description={knobs.description ? settingText[kind].description : undefined}
                // An action button keeps its own text as its name.
                labelControl={kind !== 'button'}
                title={settingText[kind].title}
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
    knobs: settingRowKnobs,
    Preview: SettingRowPreview,
};

const NotificationSettings = () => {
    const [alerts, setAlerts] = useState(true);
    const [area, setArea] = useState('notifications');

    return (
        <AppWindow
            description="When a number moves more than it should, and what is sent on a schedule."
            nav="rail"
            // The settings areas are views in the floating dock, not tabs over the page.
            overlay={
                <BottomBar floating>
                    <Dock aria-label="Settings" onValueChange={setArea} value={area}>
                        <DockItem value="general">
                            <Settings {...icon} /> General
                        </DockItem>
                        <DockItem value="members">
                            <Users {...icon} /> Members
                        </DockItem>
                        <DockItem value="notifications">
                            <Bell {...icon} /> Notifications
                        </DockItem>
                        <DockItem value="billing">
                            <CreditCard {...icon} /> Billing
                        </DockItem>
                    </Dock>
                </BottomBar>
            }
            place="settings"
            title="Notifications"
            width="narrow"
        >
            <Card layout="list">
                <SettingGroup title="Alerts">
                    <SettingRow
                        control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                        description="An email when revenue, churn or sign-ups move out of their usual range."
                        title="Anomaly alerts"
                    />
                    {/* Two rows depend on the switch above: an eyebrow names it, and no hairline parts them. */}
                    <p className="font-normal text-neutral-600 text-xs" data-dependent>
                        For anomaly alerts
                    </p>
                    <SettingRow
                        control={
                            <Select defaultValue="medium">
                                <SelectTrigger className="w-32" indicator="right" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        }
                        dependent
                        description="How far a number moves before it counts as an anomaly."
                        disabled={!alerts}
                        title="Sensitivity"
                    />
                    <SettingRow
                        control={<Button variant="secondary">Send a test</Button>}
                        dependent
                        description="A sample alert to every channel, to check it arrives."
                        disabled={!alerts}
                        labelControl={false}
                        title="Test alerts"
                    />
                </SettingGroup>
            </Card>
            <Card layout="list">
                <SettingGroup title="Digests">
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
            </Card>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Notification settings',
    note: 'Setting rows in a card per group: switches, a picker and an action, one switch disabling the two that depend on it; the areas in the dock.',
    app: true,
    render: () => <NotificationSettings />,
};
