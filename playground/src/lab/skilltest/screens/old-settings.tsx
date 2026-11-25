import {
    AppPanel,
    AppShell,
    Avatar,
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
import { Bird, ChartColumn, House, Receipt, Settings, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

/*
 * Kestrel, Settings › Notifications. A settings page, as small as it goes: a 640 column, one card
 * per channel, a row per setting with its one control, the settings areas in the dock. Everything
 * saves as it changes, and the header bar's notice says so.
 */

const icon = { strokeWidth: 2 } as const;

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
];

const areas = ['General', 'Members', 'Notifications', 'Billing', 'Integrations'];

const reminderDays = [1, 3, 7, 14];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** The hours of the day, the steps quiet hours start and end on. */
const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

/** The sidebar: Kestrel's places, settings apart in the workspace's group, and who is signed in. */
const KestrelSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Bird {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(place => (
                <NavItem icon={place.icon} key={place.id}>
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <NavItem active aria-current="page" icon={<Settings {...icon} />}>
                Settings
            </NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar alt="Joan Verhulst" fallback="JV" />}
                name="Kestrel Studio"
                detail="Joan Verhulst"
            />
        </SidebarFooter>
    </Sidebar>
);

/** Home › Settings › Notifications. */
const Trail = () => (
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink aria-label="Home" href="#">
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
);

/**
 * A quiet line naming what the dependent rows under it belong to, kept with its parent row (no
 * hairline between) and dimmed with them while the parent is off: closeness alone never groups.
 */
const Dependents = ({
    label,
    off,
    children,
}: {
    label: string;
    off: boolean;
    children: ReactNode;
}) => (
    <div className="flex flex-col gap-3" data-dependent>
        <p className={off ? 'text-neutral-600 text-xs opacity-50' : 'text-neutral-600 text-xs'}>
            {label}
        </p>
        <div className="flex flex-col gap-4">{children}</div>
    </div>
);

/** A "Value ›" picker for a setting row: a small select with its chevron at the right. */
const Picker = ({
    value,
    onChange,
    options,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label: string;
}) => (
    <Select onValueChange={next => onChange(String(next))} value={value}>
        <SelectTrigger aria-label={label} indicator="right" size="sm">
            <SelectValue>
                {(current: string) => options.find(option => option.value === current)?.label}
            </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
            {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

export default function OldSettings() {
    const { notice, show } = useNotice();
    const saved = () => show('Saved');

    const [email, setEmail] = useState({
        paid: true,
        overdue: true,
        reminder: true,
        summary: false,
    });
    const [reminderAfter, setReminderAfter] = useState('3');
    const [summaryDay, setSummaryDay] = useState('Monday');
    const [summaryTo, setSummaryTo] = useState('me');
    const [slackPaid, setSlackPaid] = useState(true);
    // The browser has not been asked yet: until it allows them, the row offers to ask.
    const [browserAllowed, setBrowserAllowed] = useState(false);
    const [browser, setBrowser] = useState(false);
    const [quiet, setQuiet] = useState(false);
    const [quietFrom, setQuietFrom] = useState('19:00');
    const [quietUntil, setQuietUntil] = useState('08:00');

    const toggle = (key: keyof typeof email) => (on: boolean) => {
        setEmail(current => ({ ...current, [key]: on }));
        saved();
    };
    const pick = (set: (value: string) => void) => (value: string) => {
        set(value);
        saved();
    };

    return (
        <AppShell className="h-dvh min-h-0">
            <KestrelSidebar />
            <AppPanel>
                <HeaderBar>
                    <Trail />
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
                                        description="An email the moment a customer pays an invoice."
                                        title="Invoice paid"
                                    />
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.overdue}
                                                onCheckedChange={toggle('overdue')}
                                            />
                                        }
                                        description="An email when an invoice passes its due date unpaid."
                                        title="Invoice overdue"
                                    />
                                    <Dependents
                                        label="When an invoice is overdue"
                                        off={!email.overdue}
                                    >
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={email.reminder}
                                                    onCheckedChange={toggle('reminder')}
                                                />
                                            }
                                            dependent
                                            description="Kestrel sends the customer a reminder by itself."
                                            disabled={!email.overdue}
                                            title="Remind the customer"
                                        />
                                        <SettingRow
                                            control={
                                                <Picker
                                                    label="Send the reminder"
                                                    onChange={pick(setReminderAfter)}
                                                    options={reminderDays.map(days => ({
                                                        value: String(days),
                                                        label: `After ${days} ${days === 1 ? 'day' : 'days'}`,
                                                    }))}
                                                    value={reminderAfter}
                                                />
                                            }
                                            dependent
                                            description="Counted from the day the invoice became overdue."
                                            disabled={!(email.overdue && email.reminder)}
                                            title="Send the reminder"
                                        />
                                    </Dependents>
                                    <SettingRow
                                        control={
                                            <Switch
                                                checked={email.summary}
                                                onCheckedChange={toggle('summary')}
                                            />
                                        }
                                        description="The week's invoices, payments and overdue amounts in one email."
                                        title="Weekly summary"
                                    />
                                    <Dependents
                                        label="When the weekly summary is on"
                                        off={!email.summary}
                                    >
                                        <SettingRow
                                            control={
                                                <Picker
                                                    label="Day"
                                                    onChange={pick(setSummaryDay)}
                                                    options={weekdays.map(day => ({
                                                        value: day,
                                                        label: day,
                                                    }))}
                                                    value={summaryDay}
                                                />
                                            }
                                            dependent
                                            description="The day the summary goes out."
                                            disabled={!email.summary}
                                            title="Day"
                                        />
                                        <SettingRow
                                            control={
                                                <Picker
                                                    label="Send to"
                                                    onChange={pick(setSummaryTo)}
                                                    options={[
                                                        { value: 'me', label: 'Only me' },
                                                        { value: 'all', label: 'All members' },
                                                    ]}
                                                    value={summaryTo}
                                                />
                                            }
                                            dependent
                                            description="Who in Kestrel Studio receives it."
                                            disabled={!email.summary}
                                            title="Send to"
                                        />
                                    </Dependents>
                                </SettingGroup>
                            </Card>

                            <Card layout="list">
                                <SettingGroup title="Slack">
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
                                        description="Posted to #finance in kestrel-studio, the connected workspace."
                                        title="Invoice paid"
                                    />
                                </SettingGroup>
                            </Card>

                            <Card layout="list">
                                <SettingGroup title="Browser">
                                    {browserAllowed ? (
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
                                            description="Notifications on this computer while Kestrel is open."
                                            title="Browser notifications"
                                        />
                                    ) : (
                                        <SettingRow
                                            control={
                                                <Button
                                                    onClick={() => {
                                                        setBrowserAllowed(true);
                                                        setBrowser(true);
                                                        saved();
                                                    }}
                                                    variant="secondary"
                                                >
                                                    Allow
                                                </Button>
                                            }
                                            description="This browser has not been asked yet."
                                            labelControl={false}
                                            title="Browser notifications"
                                        />
                                    )}
                                </SettingGroup>
                            </Card>

                            <Card layout="list">
                                <SettingGroup title="Quiet hours">
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
                                        description="Kestrel holds its notifications between the hours below."
                                        title="Pause notifications"
                                    />
                                    <Dependents label="When quiet hours are on" off={!quiet}>
                                        <SettingRow
                                            control={
                                                <Picker
                                                    label="From"
                                                    onChange={pick(setQuietFrom)}
                                                    options={hours.map(hour => ({
                                                        value: hour,
                                                        label: hour,
                                                    }))}
                                                    value={quietFrom}
                                                />
                                            }
                                            dependent
                                            description="When the quiet starts, each evening."
                                            disabled={!quiet}
                                            title="From"
                                        />
                                        <SettingRow
                                            control={
                                                <Picker
                                                    label="Until"
                                                    onChange={pick(setQuietUntil)}
                                                    options={hours.map(hour => ({
                                                        value: hour,
                                                        label: hour,
                                                    }))}
                                                    value={quietUntil}
                                                />
                                            }
                                            dependent
                                            description="When notifications start again."
                                            disabled={!quiet}
                                            title="Until"
                                        />
                                    </Dependents>
                                </SettingGroup>
                            </Card>
                        </div>
                    </PageContent>
                </div>
                <BottomBar floating>
                    {/* The settings areas are siblings: views in the dock, this page's selected. */}
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
