import {
    Input,
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
import { PageHead, SectionHead, Workspace } from './workspace';

/**
 * Settings, the General tab: a row per setting with its control at the end, in sections headed
 * as a form's are. What the workspace pays for lives under Billing, not here.
 */
export const Settings = () => {
    const [alerts, setAlerts] = useState({ signups: true, payments: true, summary: false });
    const set = (key: keyof typeof alerts) => (on: boolean) =>
        setAlerts(current => ({ ...current, [key]: on }));

    return (
        <Workspace place="settings" trail={['Settings', 'General']} width="default">
            <PageHead description="The workspace, its members and how it bills." title="Settings" />

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>
            </Tabs>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="How the workspace shows up for the team and for customers."
                    title="Workspace"
                />
                <SettingGroup aria-label="Workspace">
                    <SettingRow
                        control={
                            <Input
                                aria-label="Workspace name"
                                className="w-64"
                                defaultValue="Acme Inc."
                                size="sm"
                            />
                        }
                        description="Shown on invoices and in every email to customers."
                        title="Name"
                    />
                    <SettingRow
                        control={
                            <Input
                                aria-label="Workspace address"
                                className="w-64"
                                defaultValue="acme.app/workspace"
                                size="sm"
                            />
                        }
                        description="The address the team signs in at."
                        title="Address"
                    />
                    <SettingRow
                        control={
                            <Select defaultValue="en">
                                <SelectTrigger aria-label="Language" className="w-64" size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="nl">Nederlands</SelectItem>
                                    <SelectItem value="de">Deutsch</SelectItem>
                                </SelectContent>
                            </Select>
                        }
                        description="For dates, numbers and the emails the workspace sends."
                        title="Language"
                    />
                </SettingGroup>
            </section>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="The emails the workspace sends you."
                    title="Notifications"
                />
                <SettingGroup aria-label="Notifications">
                    <SettingRow
                        control={
                            <Switch checked={alerts.signups} onCheckedChange={set('signups')} />
                        }
                        description="An email the moment a company starts a trial or a plan."
                        title="New customers"
                    />
                    <SettingRow
                        control={
                            <Switch checked={alerts.payments} onCheckedChange={set('payments')} />
                        }
                        description="When a card is declined or an invoice runs past due."
                        title="Failed payments"
                    />
                    <SettingRow
                        control={
                            <Switch checked={alerts.summary} onCheckedChange={set('summary')} />
                        }
                        description="Revenue, new customers and churn, every Monday at nine."
                        title="Weekly summary"
                    />
                </SettingGroup>
            </section>
        </Workspace>
    );
};
