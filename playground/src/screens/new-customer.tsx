import {
    Badge,
    Button,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingRow,
    Switch,
    Textarea,
} from 'continuum';
import { Building2, Rocket, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useScreenNav } from './shared';
import { owners, PageHead, plans, SectionHead, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

const planIcons = {
    Starter: <Rocket {...icon} />,
    Pro: <Sparkles {...icon} />,
    Enterprise: <Building2 {...icon} />,
};

/** A form: four short sections, each its title then its fields, and one action at the end. */
export const NewCustomer = () => {
    const nav = useScreenNav();
    const [plan, setPlan] = useState('Pro');
    const [welcome, setWelcome] = useState(true);

    return (
        <Workspace
            place="customers"
            trail={[{ label: 'Customers', to: 'list' }, 'New customer']}
            width="narrow"
        >
            <PageHead
                description="Add a company, pick its plan and who looks after it."
                title="New customer"
            />

            <section className="flex flex-col gap-5">
                <SectionHead title="Company" />
                <div className="flex flex-col gap-5">
                    <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input defaultValue="Wonka Industries" />
                    </Field>
                    <Field>
                        <FieldLabel>Website</FieldLabel>
                        <Input placeholder="company.com" />
                    </Field>
                    <Field>
                        <FieldLabel>Industry</FieldLabel>
                        <Select defaultValue="retail">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="logistics">Logistics</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <FieldLabel>Size</FieldLabel>
                        <Select defaultValue="50">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">1 to 10 people</SelectItem>
                                <SelectItem value="50">11 to 50 people</SelectItem>
                                <SelectItem value="250">51 to 250 people</SelectItem>
                                <SelectItem value="more">More than 250</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <FieldLabel>Owner</FieldLabel>
                        <Select defaultValue="Maya Chen">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {owners.map(owner => (
                                    <SelectItem key={owner.name} value={owner.name}>
                                        {owner.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldHelper>Who looks after the account from here.</FieldHelper>
                    </Field>
                    <Field>
                        <FieldLabel>Notes</FieldLabel>
                        <Textarea placeholder="Anything the team should know" rows={3} />
                    </Field>
                </div>
            </section>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="It can change at any time; the difference is charged pro rata."
                    title="Plan"
                />
                <RadioGroup aria-label="Plan" onValueChange={setPlan} value={plan}>
                    {plans.map(item => (
                        <OptionRow
                            control={<RadioGroupItem value={item.id} />}
                            description={`${item.price}, ${item.terms}`}
                            icon={planIcons[item.id]}
                            key={item.id}
                            label={
                                item.id === 'Pro' ? (
                                    <span className="flex items-center gap-2">
                                        Pro
                                        <Badge tone="primary">Most picked</Badge>
                                    </span>
                                ) : (
                                    item.id
                                )
                            }
                        />
                    ))}
                </RadioGroup>
            </section>

            <section className="flex flex-col gap-5">
                <SectionHead title="Billing" />
                <div className="flex flex-col gap-5">
                    <Field>
                        <FieldLabel>Billing email</FieldLabel>
                        <Input placeholder="finance@company.com" type="email" />
                    </Field>
                    <Field>
                        <FieldLabel>Country</FieldLabel>
                        <Select defaultValue="nl">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nl">Netherlands</SelectItem>
                                <SelectItem value="de">Germany</SelectItem>
                                <SelectItem value="gb">United Kingdom</SelectItem>
                                <SelectItem value="us">United States</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <FieldLabel>VAT number</FieldLabel>
                        <Input placeholder="NL000000000B01" />
                        <FieldHelper>Leave it empty for a company outside the EU.</FieldHelper>
                    </Field>
                </div>
            </section>

            {/* The first person to sign in, and the email that lets them: a section of its own, not billing's. */}
            <section className="flex flex-col gap-5">
                <SectionHead
                    description="The person at the company who signs in first and invites the rest."
                    title="First user"
                />
                <div className="flex flex-col gap-5">
                    <Field>
                        <FieldLabel>Their email</FieldLabel>
                        <Input placeholder="name@company.com" type="email" />
                    </Field>
                    <SettingRow
                        control={<Switch checked={welcome} onCheckedChange={setWelcome} />}
                        description="Sent to the address above, with a link to sign in and set a password."
                        title="Send a welcome email"
                    />
                </div>
            </section>

            <div className="flex justify-end gap-2">
                <Button onClick={() => nav.open('list')} variant="secondary">
                    Cancel
                </Button>
                <Button onClick={() => nav.open('list')}>Create customer</Button>
            </div>
        </Workspace>
    );
};
