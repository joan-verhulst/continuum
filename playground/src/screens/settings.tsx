import {
    Avatar,
    Badge,
    BottomBar,
    Button,
    Card,
    Dock,
    DockItem,
    Field,
    FieldLabel,
    Input,
    Notice,
    Progress,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
    useNotice,
} from 'continuum';
import { type FormEvent, useState } from 'react';
import { owners, PageHead, Workspace } from './workspace';

type Area = 'General' | 'Members' | 'Notifications' | 'Billing' | 'Integrations';

const areas: { id: Area; description: string }[] = [
    { id: 'General', description: 'How the workspace shows up for the team and for customers.' },
    { id: 'Members', description: 'Who works in the workspace, and what each of them may do.' },
    { id: 'Notifications', description: 'The emails the workspace sends you.' },
    { id: 'Billing', description: 'What the workspace pays for, and how much of it is used.' },
    { id: 'Integrations', description: 'The tools the workspace sends its data to.' },
];

const roles = ['Owner', 'Admin', 'Member'];

/** The workspace's own plan: what Acme pays for this app, not what its customers pay Acme. */
const SEATS = 12;

/**
 * Settings, as small as it goes: each area a view in the dock, its title the area's name, a card
 * per group with a row per setting. Toggles and pickers save as they change and say so in the
 * header bar; the plain values are a form in their card, with its save at the card's foot.
 */
export const Settings = () => {
    const [area, setArea] = useState<Area>('General');
    const { notice, show } = useNotice();
    const saved = () => show('Saved');
    const [alerts, setAlerts] = useState({ signups: true, payments: true, summary: false });
    const set = (key: keyof typeof alerts) => (on: boolean) => {
        setAlerts(current => ({ ...current, [key]: on }));
        saved();
    };
    const [tools, setTools] = useState({ slack: true, stripe: true });
    const description = areas.find(item => item.id === area)?.description;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        saved();
    };

    return (
        <Workspace
            bar={
                <BottomBar floating>
                    <Dock
                        aria-label="Settings areas"
                        onValueChange={value => setArea(value as Area)}
                        value={area}
                    >
                        {areas.map(item => (
                            <DockItem key={item.id} value={item.id}>
                                {item.id}
                            </DockItem>
                        ))}
                    </Dock>
                </BottomBar>
            }
            notice={<Notice {...notice} />}
            place="settings"
            trail={[{ label: 'Settings', to: 'settings' }, area]}
            width="narrow"
        >
            <PageHead description={description} title={area} />

            <div className="flex flex-col gap-6">
                {area === 'General' && (
                    // Plain values are fields, as in a form, so this card saves with its own button.
                    <Card layout="list">
                        <form className="flex flex-col gap-5" onSubmit={submit}>
                            <p className="text-neutral-600 text-xs">Workspace</p>
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input defaultValue="Acme Inc." />
                            </Field>
                            <Field>
                                <FieldLabel>Address</FieldLabel>
                                <Input defaultValue="acme.app/workspace" />
                            </Field>
                            <Field>
                                <FieldLabel>Language</FieldLabel>
                                <Select defaultValue="en">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="nl">Nederlands</SelectItem>
                                        <SelectItem value="de">Deutsch</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <div className="flex justify-end">
                                <Button type="submit">Save changes</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {area === 'Members' && (
                    <Card layout="list">
                        <SettingGroup title="Members">
                            {owners.map((member, i) => (
                                <SettingRow
                                    control={
                                        <Select
                                            defaultValue={
                                                i === 0 ? 'Owner' : i === 1 ? 'Admin' : 'Member'
                                            }
                                            disabled={i === 0}
                                            onValueChange={saved}
                                        >
                                            <SelectTrigger
                                                aria-label={`${member.name}'s role`}
                                                className="w-32"
                                                size="sm"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent align="end">
                                                {roles.map(role => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    }
                                    description={`${member.name.split(' ')[0]?.toLowerCase()}@acme.app`}
                                    key={member.name}
                                    title={
                                        <span className="flex items-center gap-2">
                                            <Avatar
                                                alt={member.name}
                                                fallback={member.initials}
                                                shape="round"
                                                size={24}
                                            />
                                            {member.name}
                                        </span>
                                    }
                                />
                            ))}
                            <SettingRow
                                control={<Button variant="secondary">Invite people</Button>}
                                description={`${owners.length} of ${SEATS} seats taken.`}
                                labelControl={false}
                                title="Invite"
                            />
                        </SettingGroup>
                    </Card>
                )}

                {area === 'Notifications' && (
                    <Card layout="list">
                        <SettingGroup title="Email">
                            <SettingRow
                                control={
                                    <Switch
                                        checked={alerts.signups}
                                        onCheckedChange={set('signups')}
                                    />
                                }
                                description="An email the moment a company starts a trial or a plan."
                                title="New customers"
                            />
                            <SettingRow
                                control={
                                    <Switch
                                        checked={alerts.payments}
                                        onCheckedChange={set('payments')}
                                    />
                                }
                                description="When a card is declined or an invoice runs past due."
                                title="Failed payments"
                            />
                            <SettingRow
                                control={
                                    <Switch
                                        checked={alerts.summary}
                                        onCheckedChange={set('summary')}
                                    />
                                }
                                description="Revenue, new customers and churn, every Monday at nine."
                                title="Weekly summary"
                            />
                        </SettingGroup>
                    </Card>
                )}

                {area === 'Billing' && (
                    <Card layout="list">
                        <SettingGroup title="Plan">
                            {/* The plan in force, a card inside the group's, with the way to change it. */}
                            <Card className="flex-row items-center justify-between gap-4">
                                <div className="flex min-w-0 flex-col gap-1">
                                    <span className="flex items-center gap-2 font-medium text-neutral-950 text-sm">
                                        Pro
                                        <Badge tone="success">Active</Badge>
                                    </span>
                                    <span className="text-neutral-600 text-xs">
                                        {SEATS} seats, billed yearly. Renews on 1 March 2027.
                                    </span>
                                </div>
                                <Button variant="secondary">Change plan</Button>
                            </Card>
                            <Progress
                                caption={`${owners.length} of ${SEATS}`}
                                label="Seats"
                                value={(owners.length / SEATS) * 100}
                            />
                            <SettingRow
                                control={<Button variant="secondary">Add seats</Button>}
                                description="Each seat is added to the next invoice, pro rata."
                                labelControl={false}
                                title="More seats"
                            />
                        </SettingGroup>
                    </Card>
                )}

                {area === 'Integrations' && (
                    <Card layout="list">
                        <SettingGroup title="Connected">
                            <SettingRow
                                control={
                                    <Switch
                                        checked={tools.slack}
                                        onCheckedChange={on => {
                                            setTools(current => ({ ...current, slack: on }));
                                            saved();
                                        }}
                                    />
                                }
                                description="Failed payments and new customers, posted to #revenue."
                                title="Slack"
                            />
                            <SettingRow
                                control={
                                    <Switch
                                        checked={tools.stripe}
                                        onCheckedChange={on => {
                                            setTools(current => ({ ...current, stripe: on }));
                                            saved();
                                        }}
                                    />
                                }
                                description="Payments and invoices, read every hour."
                                title="Stripe"
                            />
                            <SettingRow
                                control={<Button variant="secondary">Connect</Button>}
                                description="Customers and owners, kept in step with the CRM."
                                labelControl={false}
                                title="HubSpot"
                            />
                        </SettingGroup>
                    </Card>
                )}
            </div>
        </Workspace>
    );
};
