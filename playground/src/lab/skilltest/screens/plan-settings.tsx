/*
 * Plan
 * - Purpose: Joan, who runs Kestrel Studio's invoicing, decides what Kestrel tells them about, and how.
 * - Rank: lead, the notification settings themselves (paid, overdue, weekly summary, Slack, browser,
 *   quiet hours); supporting, what hangs off them (the customer reminder's delay, the summary's day and
 *   readers, the quiet hours' times); look-up, the Slack workspace it posts to; action, "Allow" for the
 *   browser (a secondary: it does one thing); no primary, since changes save as they are made.
 * - Kind: settings, narrow 640; the five settings areas are views in the floating dock, with no dock
 *   action; the breadcrumb reads Settings › Notifications; the save state is a notice in the header bar.
 * - Order: the page head (Notifications, one line), then one list card per channel, by how often it
 *   speaks: Email, Slack, Browser, then Quiet hours, which holds all of them back.
 */
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
import { Bird, ChartColumn, House, Receipt, Settings, Users } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

type Area = 'General' | 'Members' | 'Notifications' | 'Billing' | 'Integrations';
const areas: Area[] = ['General', 'Members', 'Notifications', 'Billing', 'Integrations'];

/* The reminder's delay is one picker: "Don't remind" is its off, so the setting needs no switch of its own. */
const reminderDelays = [
    { value: 'off', label: "Don't remind" },
    { value: '1', label: 'After 1 day' },
    { value: '3', label: 'After 3 days' },
    { value: '7', label: 'After 7 days' },
    { value: '14', label: 'After 14 days' },
];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const recipients = [
    { value: 'me', label: 'Only me' },
    { value: 'members', label: 'All members' },
];

/* Quiet hours start and end on the hour. */
const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

/** A "Value ›" picker for a setting row: a small select that opens its list below. */
const Picker = ({
    value,
    onChange,
    options,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
}) => (
    <Select onValueChange={onChange} value={value}>
        <SelectTrigger aria-label={label} indicator="right" size="sm">
            <SelectValue />
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

/** The quiet title over several dependent rows, naming the setting they belong to. */
const Eyebrow = ({ children, disabled }: { children: ReactNode; disabled?: boolean }) => (
    // Dimmed with the rows it names while their parent is off.
    <p className={cn('text-neutral-600 text-xs', disabled && 'opacity-50')} data-dependent="">
        {children}
    </p>
);

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
                <NavItem
                    active={place.id === 'settings'}
                    aria-current={place.id === 'settings' ? 'page' : undefined}
                    icon={place.icon}
                    key={place.id}
                >
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={
                    <span className="grid size-full place-items-center bg-neutral-950 font-medium text-neutral-50 text-xs">
                        JV
                    </span>
                }
                name="Joan Verhulst"
                detail="Kestrel Studio"
            />
        </SidebarFooter>
    </Sidebar>
);

export default function PlanSettings() {
    const [area, setArea] = useState<Area>('Notifications');
    const { notice, show } = useNotice();
    const saved = () => show('Saved');

    const [paid, setPaid] = useState(true);
    const [overdue, setOverdue] = useState(true);
    const [reminder, setReminder] = useState('3');
    const [summary, setSummary] = useState(false);
    const [summaryDay, setSummaryDay] = useState('Monday');
    const [summaryTo, setSummaryTo] = useState('me');
    const [slack, setSlack] = useState(true);
    // The browser has not been asked yet: Kestrel can only switch it on once the browser allows it.
    const [browserAllowed, setBrowserAllowed] = useState(false);
    const [browser, setBrowser] = useState(false);
    const [quiet, setQuiet] = useState(false);
    const [quietFrom, setQuietFrom] = useState('19:00');
    const [quietUntil, setQuietUntil] = useState('08:00');

    /* Every change saves at once and says so in the header bar. */
    const change =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            set(value);
            saved();
        };

    return (
        <AppShell className="h-dvh min-h-0">
            <KestrelSidebar />
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
                                <BreadcrumbPage>{area}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Notice {...notice} />
                </HeaderBar>

                <div className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-10 pb-24" width="narrow">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <h1 className="font-medium text-2xl text-neutral-950">{area}</h1>
                            {area === 'Notifications' && (
                                <p className="text-neutral-600 text-sm">
                                    What Kestrel tells you about, and where.
                                </p>
                            )}
                        </div>

                        {area === 'Notifications' && (
                            <div className="flex flex-col gap-6">
                                <Card layout="list">
                                    <SettingGroup title="Email">
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={paid}
                                                    onCheckedChange={change(setPaid)}
                                                />
                                            }
                                            description="An email the moment a customer pays."
                                            title="Invoice paid"
                                        />
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={overdue}
                                                    onCheckedChange={change(setOverdue)}
                                                />
                                            }
                                            description="An email the day an invoice runs past its due date."
                                            title="Invoice overdue"
                                        />
                                        <SettingRow
                                            control={
                                                <Picker
                                                    onChange={change(setReminder)}
                                                    options={reminderDelays}
                                                    value={reminder}
                                                />
                                            }
                                            dependent
                                            description="An automatic reminder to the customer, while it stays unpaid."
                                            disabled={!overdue}
                                            title="Remind the customer"
                                        />
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={summary}
                                                    onCheckedChange={change(setSummary)}
                                                />
                                            }
                                            description="One email a week with the week's invoices."
                                            title="Weekly summary"
                                        />
                                        <Eyebrow disabled={!summary}>The summary</Eyebrow>
                                        <SettingRow
                                            control={
                                                <Picker
                                                    onChange={change(setSummaryDay)}
                                                    options={weekdays.map(day => ({
                                                        value: day,
                                                        label: day,
                                                    }))}
                                                    value={summaryDay}
                                                />
                                            }
                                            dependent
                                            disabled={!summary}
                                            title="Day"
                                        />
                                        <SettingRow
                                            control={
                                                <Picker
                                                    onChange={change(setSummaryTo)}
                                                    options={recipients}
                                                    value={summaryTo}
                                                />
                                            }
                                            dependent
                                            disabled={!summary}
                                            title="Send to"
                                        />
                                    </SettingGroup>
                                </Card>

                                <Card layout="list">
                                    <SettingGroup title="Slack">
                                        <SettingRow
                                            control={
                                                <Switch
                                                    checked={slack}
                                                    onCheckedChange={change(setSlack)}
                                                />
                                            }
                                            description="Posted to #finance in kestrel-studio."
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
                                                        onCheckedChange={change(setBrowser)}
                                                    />
                                                }
                                                description="Shown on this computer while Kestrel is open."
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
                                                description="Your browser asks you first, once."
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
                                                    onCheckedChange={change(setQuiet)}
                                                />
                                            }
                                            description="Kestrel holds its notifications between two times."
                                            title="Pause notifications"
                                        />
                                        <Eyebrow disabled={!quiet}>Between</Eyebrow>
                                        <SettingRow
                                            control={
                                                <Picker
                                                    onChange={change(setQuietFrom)}
                                                    options={hours.map(h => ({
                                                        value: h,
                                                        label: h,
                                                    }))}
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
                                                    onChange={change(setQuietUntil)}
                                                    options={hours.map(h => ({
                                                        value: h,
                                                        label: h,
                                                    }))}
                                                    value={quietUntil}
                                                />
                                            }
                                            dependent
                                            disabled={!quiet}
                                            title="Until"
                                        />
                                    </SettingGroup>
                                </Card>
                            </div>
                        )}
                    </PageContent>
                </div>

                <BottomBar floating>
                    <Dock
                        aria-label="Settings areas"
                        onValueChange={value => setArea(value as Area)}
                        value={area}
                    >
                        {areas.map(item => (
                            <DockItem key={item} value={item}>
                                {item}
                            </DockItem>
                        ))}
                    </Dock>
                </BottomBar>
            </AppPanel>
        </AppShell>
    );
}
