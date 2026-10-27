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
import { PageHead, SectionHead, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

/** A form: three short sections, each its title then its fields, and one action at the end. */
export const NewCustomer = () => {
    const [plan, setPlan] = useState('pro');
    const [welcome, setWelcome] = useState(true);

    return (
        <Workspace place="customers" trail={['Customers', 'New customer']} width="narrow">
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
                    <OptionRow
                        control={<RadioGroupItem value="starter" />}
                        description="€29 a month, for a team of up to five"
                        icon={<Rocket {...icon} />}
                        label="Starter"
                    />
                    <OptionRow
                        control={<RadioGroupItem value="pro" />}
                        description="€99 a month, with reports and an API"
                        icon={<Sparkles {...icon} />}
                        label={
                            <span className="flex items-center gap-2">
                                Pro
                                <Badge tone="primary">Most picked</Badge>
                            </span>
                        }
                    />
                    <OptionRow
                        control={<RadioGroupItem value="enterprise" />}
                        description="A price per seat, single sign-on and a contract"
                        icon={<Building2 {...icon} />}
                        label="Enterprise"
                    />
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
                <SettingRow
                    control={<Switch checked={welcome} onCheckedChange={setWelcome} />}
                    description="A short email with a link to sign in and set a password."
                    title="Send a welcome email"
                />
            </section>

            <div className="flex justify-end gap-2">
                <Button variant="secondary">Cancel</Button>
                <Button>Create customer</Button>
            </div>
        </Workspace>
    );
};
