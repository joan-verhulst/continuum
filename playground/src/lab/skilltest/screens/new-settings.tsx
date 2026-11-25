import {
    AppPanel,
    AppShell,
    BottomBar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    cn,
    Dock,
    DockItem,
    HeaderBar,
    NavItem,
    Notice,
    PageContent,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Switch,
    useNotice,
} from '@contui/ui';
import { Bird, ChartColumn, FileText, House, Settings, Users } from 'lucide-react';
import { type ReactNode, useState } from 'react';

/*
 * Kestrel's Settings, its Notifications area: a settings page as small as it goes. One card per
 * group of settings, a row per setting with its one control, dependents sharing their parent's
 * space between hairlines and dimmed while it is off, the areas as views in the dock. Every
 * change saves as it is made and says so in a notice under the header bar.
 */

const icon = { strokeWidth: 2 } as const;

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

const areas = ['General', 'Members', 'Notifications', 'Billing', 'Integrations'] as const;

const reminderDays = ['1', '3', '7', '14'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const recipients = [
    { value: 'me', label: 'Only me' },
    { value: 'members', label: 'All members' },
];
// Quiet hours start and end on the half hour, which is as fine as anyone sets them.
const times = Array.from(
    { length: 48 },
    (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);

/** A "Select ›" picker for a setting row: the value and a right chevron, 34 high. */
const Picker = ({
    value,
    onChange,
    items,
}: {
    value: string;
    onChange: (value: string) => void;
    items: { value: string; label: string }[];
}) => (
    <Select items={items} onValueChange={onChange} value={value}>
        <SelectTrigger indicator="right" size="sm">
            <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
            {items.map(item => (
                <SelectItem key={item.value} value={item.value}>
                    {item.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

/**
 * The quiet title over several dependents of one setting, naming what they belong to. It is marked
 * dependent, so the group draws no hairline above it and it stays with its parent.
 */
const Eyebrow = ({ children, dimmed }: { children: ReactNode; dimmed: boolean }) => (
    <p
        className={cn('font-normal text-neutral-600 text-xs', dimmed && 'opacity-50')}
        data-dependent
    >
        {children}
    </p>
);

type Permission = 'default' | 'granted' | 'denied';

export default function NewSettings() {
    const { notice, show } = useNotice();
    const saved = () => show('Saved');

    const [email, setEmail] = useState({
        paid: true,
        overdue: true,
        reminder: true,
        weekly: false,
    });
    const [reminderAfter, setReminderAfter] = useState('3');
    const [weeklyDay, setWeeklyDay] = useState('Monday');
    const [weeklyTo, setWeeklyTo] = useState('me');
    const [slackPaid, setSlackPaid] = useState(true);
    // The browser has not been asked yet: the setting starts as a request for permission.
    const [permission, setPermission] = useState<Permission>('default');
    const [browser, setBrowser] = useState(false);
    const [quiet, setQuiet] = useState(false);
    const [quietFrom, setQuietFrom] = useState('19:00');
    const [quietTo, setQuietTo] = useState('08:00');

    const toggle = (key: keyof typeof email) => (on: boolean) => {
        setEmail(current => ({ ...current, [key]: on }));
        saved();
    };
    const pick = (set: (value: string) => void) => (value: string) => {
        set(value);
        saved();
    };

    const askBrowser = async () => {
        const result: Permission =
            typeof Notification === 'undefined' ? 'denied' : await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
            setBrowser(true);
            saved();
        }
    };

    return (
        <AppShell className="h-dvh min-h-0">
            <Sidebar>
                <SidebarHeader>
                    <SidebarLogo>
                        <Bird {...icon} />
                    </SidebarLogo>
                    <SidebarToggle />
                </SidebarHeader>
                <SidebarGroup aria-label="Main">
                    {places.map(place => (
                        <NavItem active={place.id === 'settings'} icon={place.icon} key={place.id}>
                            {place.label}
                        </NavItem>
                    ))}
                </SidebarGroup>
                <SidebarFooter>
                    <SidebarAccount
                        avatar={
                            <span className="grid size-full place-items-center bg-neutral-950 text-neutral-50 [&_svg]:size-4">
                                <Bird {...icon} />
                            </span>
                        }
                        name="Kestrel Studio"
                        detail="Joan Verhulst"
                    />
                </SidebarFooter>
            </Sidebar>
            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Notifications</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Notice {...notice} />
                </HeaderBar>
                <div className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-10 pb-24" width="narrow">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <h1 className="font-medium text-2xl text-neutral-950">Notifications</h1>
                            <p className="text-neutral-600 text-sm">
                                What Kestrel tells you about, and how.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <Card layout="list">
                                <SettingGroup title="Email">
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.paid}
                                                onCheckedChange={toggle('paid')}
                                            />
                                        }
                                        description="An email when a customer pays an invoice."
                                        title="Invoice paid"
                                    />

                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.overdue}
                                                onCheckedChange={toggle('overdue')}
                                            />
                                        }
                                        description="An email when an invoice passes its due date."
                                        title="Invoice overdue"
                                    />
                                    <Eyebrow dimmed={!email.overdue}>
                                        Reminder to the customer
                                    </Eyebrow>
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.reminder}
                                                onCheckedChange={toggle('reminder')}
                                            />
                                        }
                                        dependent
                                        description="Kestrel emails the customer about the overdue invoice."
                                        disabled={!email.overdue}
                                        title="Automatic reminder"
                                    />
                                    <SettingRow
                                        control={
                                            <Picker
                                                items={reminderDays.map(days => ({
                                                    value: days,
                                                    label:
                                                        days === '1'
                                                            ? 'After 1 day'
                                                            : `After ${days} days`,
                                                }))}
                                                onChange={pick(setReminderAfter)}
                                                value={reminderAfter}
                                            />
                                        }
                                        dependent
                                        description="Counted from the due date."
                                        disabled={!email.overdue || !email.reminder}
                                        title="When to send it"
                                    />

                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.weekly}
                                                onCheckedChange={toggle('weekly')}
                                            />
                                        }
                                        description="One email a week, on the day you pick."
                                        title="Weekly summary"
                                    />
                                    <Eyebrow dimmed={!email.weekly}>The weekly summary</Eyebrow>
                                    <SettingRow
                                        control={
                                            <Picker
                                                items={weekdays.map(day => ({
                                                    value: day,
                                                    label: day,
                                                }))}
                                                onChange={pick(setWeeklyDay)}
                                                value={weeklyDay}
                                            />
                                        }
                                        dependent
                                        disabled={!email.weekly}
                                        title="Day"
                                    />
                                    <SettingRow
                                        control={
                                            <Picker
                                                items={recipients}
                                                onChange={pick(setWeeklyTo)}
                                                value={weeklyTo}
                                            />
                                        }
                                        dependent
                                        disabled={!email.weekly}
                                        title="Sent to"
                                    />
                                </SettingGroup>
                            </Card>

                            <Card layout="list">
                                <SettingGroup title="Slack and browser">
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={slackPaid}
                                                onCheckedChange={on => {
                                                    setSlackPaid(on);
                                                    saved();
                                                }}
                                            />
                                        }
                                        description="Posts to #finance. Slack is connected as kestrel-studio."
                                        title="Invoice paid, in Slack"
                                    />
                                    {permission === 'granted' ? (
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={browser}
                                                    onCheckedChange={on => {
                                                        setBrowser(on);
                                                        saved();
                                                    }}
                                                />
                                            }
                                            description="Shown by this browser, while Kestrel is open or not."
                                            title="Browser notifications"
                                        />
                                    ) : (
                                        <SettingRow
                                            control={
                                                permission === 'default' ? (
                                                    <Button
                                                        onClick={askBrowser}
                                                        variant="secondary"
                                                    >
                                                        Allow
                                                    </Button>
                                                ) : undefined
                                            }
                                            description={
                                                permission === 'default'
                                                    ? 'Off. This browser asks you first, once.'
                                                    : 'Blocked by this browser. Allow them for Kestrel in its site settings.'
                                            }
                                            labelControl={false}
                                            title="Browser notifications"
                                        />
                                    )}
                                </SettingGroup>
                            </Card>

                            <Card layout="list">
                                <SettingGroup title="Schedule">
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={quiet}
                                                onCheckedChange={on => {
                                                    setQuiet(on);
                                                    saved();
                                                }}
                                            />
                                        }
                                        description="No notifications between the hours you set."
                                        title="Quiet hours"
                                    />
                                    <Eyebrow dimmed={!quiet}>Quiet between</Eyebrow>
                                    <SettingRow
                                        control={
                                            <Picker
                                                items={times.map(time => ({
                                                    value: time,
                                                    label: time,
                                                }))}
                                                onChange={pick(setQuietFrom)}
                                                value={quietFrom}
                                            />
                                        }
                                        dependent
                                        disabled={!quiet}
                                        title="From"
                                    />
                                    <SettingRow
                                        control={
                                            <Picker
                                                items={times.map(time => ({
                                                    value: time,
                                                    label: time,
                                                }))}
                                                onChange={pick(setQuietTo)}
                                                value={quietTo}
                                            />
                                        }
                                        dependent
                                        disabled={!quiet}
                                        title="To"
                                    />
                                </SettingGroup>
                            </Card>
                        </div>
                    </PageContent>
                </div>
                {/* The settings areas are sibling pages: views in the dock, with no action beside them. */}
                <BottomBar floating>
                    <Dock aria-label="Settings areas" value="Notifications">
                        {areas.map(area => (
                            <DockItem key={area} value={area}>
                                {area}
                            </DockItem>
                        ))}
                    </Dock>
                </BottomBar>
            </AppPanel>
        </AppShell>
    );
}
