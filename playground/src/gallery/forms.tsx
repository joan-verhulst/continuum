import {
    AtSign,
    Building2,
    CalendarDays,
    FileText,
    Globe,
    Languages,
    Mail,
    PieChart,
    Search,
    Table2,
} from 'lucide-react';
import {
    Checkbox,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    Kbd,
    OptionList,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
    Switch,
    Textarea,
} from 'continuum';
import { type ReactNode, useState } from 'react';
import { ComponentSet, Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

export const InputSection = () => (
    <>
        <Specimen stageClassName="grid gap-8 sm:grid-cols-2" title="Input">
            <ComponentSet className="items-stretch">
                <Variant className="items-stretch" label="sm · 34px">
                    <Input placeholder="Search reports" size="sm" />
                </Variant>
                <Variant className="items-stretch" label="md · 38px">
                    <Input placeholder="Search reports" />
                </Variant>
                <Variant className="items-stretch" label="leading icon · trailing kbd">
                    <Input
                        leadingIcon={<Search {...icon} />}
                        placeholder="Search"
                        trailing={<Kbd>⌘K</Kbd>}
                    />
                </Variant>
            </ComponentSet>
            <ComponentSet className="items-stretch">
                <Variant className="items-stretch" label="filled">
                    <Input defaultValue="Northwind quarterly review" />
                </Variant>
                <Variant className="items-stretch" label="invalid">
                    <Input
                        aria-invalid
                        defaultValue="ana@northwind"
                        leadingIcon={<AtSign {...icon} />}
                    />
                </Variant>
                <Variant className="items-stretch" label="disabled">
                    <Input disabled placeholder="Workspace URL" />
                </Variant>
            </ComponentSet>
        </Specimen>
        <Specimen
            note="Label, control and helper are wired up by the Field"
            stageClassName="grid gap-8 sm:grid-cols-3"
            title="Field and textarea"
        >
            <Field>
                <FieldLabel>Work email</FieldLabel>
                <Input leadingIcon={<Mail {...icon} />} placeholder="name@company.com" />
                <FieldHelper>We send the report here every Monday.</FieldHelper>
            </Field>
            <Field invalid>
                <FieldLabel>Invoice number</FieldLabel>
                <Input defaultValue="INV-2025-" />
                <FieldHelper>This number is already in use.</FieldHelper>
            </Field>
            <Field>
                <FieldLabel>Notes</FieldLabel>
                <Textarea placeholder="Add a note for the client" />
            </Field>
        </Specimen>
    </>
);

export const SelectSection = () => {
    const [range, setRange] = useState('30d');

    return (
        <Specimen note="Open one: the panel is portalled and re-themed" title="Select">
            <Variant label={`sm · value: ${range}`}>
                <Select onValueChange={setRange} value={range}>
                    <SelectTrigger
                        className="w-44"
                        leadingIcon={<CalendarDays {...icon} />}
                        size="sm"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="3m">Last 3 months</SelectItem>
                        <SelectItem value="12m">Last 12 months</SelectItem>
                    </SelectContent>
                </Select>
            </Variant>
            <Variant label="md · groups · placeholder">
                <Select>
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder="Choose a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Suggested</SelectLabel>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="nl">Dutch</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>All languages</SelectLabel>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem disabled value="ja">
                                Japanese
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Variant>
            <Variant label="in a field · invalid">
                <Field className="w-52" invalid>
                    <FieldLabel>Region</FieldLabel>
                    <Select>
                        <SelectTrigger leadingIcon={<Globe {...icon} />}>
                            <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eu">Europe</SelectItem>
                            <SelectItem value="us">North America</SelectItem>
                        </SelectContent>
                    </Select>
                    <FieldHelper>Pick where the data is stored.</FieldHelper>
                </Field>
            </Variant>
            <Variant label="disabled">
                <Select defaultValue="en" disabled>
                    <SelectTrigger className="w-44" leadingIcon={<Languages {...icon} />}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                </Select>
            </Variant>
        </Specimen>
    );
};

const Labelled = ({ children, label }: { children: ReactNode; label: string }) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child
    <label className="flex cursor-pointer items-center gap-2.5 text-neutral-950 text-xs">
        {children}
        {label}
    </label>
);

export const SelectionSection = () => {
    const [items, setItems] = useState({ pdf: true, csv: false, xlsx: true });
    const all = Object.values(items).every(Boolean);
    const some = Object.values(items).some(Boolean);

    return (
        <>
            <Specimen stageClassName="gap-10" title="Checkbox">
                <ComponentSet>
                    <Variant label="unchecked">
                        <Checkbox aria-label="Unchecked" />
                    </Variant>
                    <Variant label="checked">
                        <Checkbox aria-label="Checked" defaultChecked />
                    </Variant>
                    <Variant label="indeterminate">
                        <Checkbox aria-label="Indeterminate" checked="indeterminate" />
                    </Variant>
                    <Variant label="disabled">
                        <Checkbox aria-label="Disabled" disabled />
                    </Variant>
                </ComponentSet>
                <Variant label="parent follows its children">
                    <div className="flex flex-col gap-3">
                        <Labelled label="All formats">
                            <Checkbox
                                checked={all ? true : some ? 'indeterminate' : false}
                                onCheckedChange={checked =>
                                    setItems({
                                        pdf: checked === true,
                                        csv: checked === true,
                                        xlsx: checked === true,
                                    })
                                }
                            />
                        </Labelled>
                        <div className="flex flex-col gap-3 pl-8">
                            {(['pdf', 'csv', 'xlsx'] as const).map(key => (
                                <Labelled key={key} label={key.toUpperCase()}>
                                    <Checkbox
                                        checked={items[key]}
                                        onCheckedChange={checked =>
                                            setItems(current => ({
                                                ...current,
                                                [key]: checked === true,
                                            }))
                                        }
                                    />
                                </Labelled>
                            ))}
                        </div>
                    </div>
                </Variant>
            </Specimen>
            <Specimen stageClassName="gap-10" title="Radio and switch">
                <Variant label="radio group">
                    <RadioGroup aria-label="Frequency" defaultValue="weekly">
                        <Labelled label="Daily">
                            <RadioGroupItem value="daily" />
                        </Labelled>
                        <Labelled label="Weekly">
                            <RadioGroupItem value="weekly" />
                        </Labelled>
                        <Labelled label="Monthly (disabled)">
                            <RadioGroupItem disabled value="monthly" />
                        </Labelled>
                    </RadioGroup>
                </Variant>
                <ComponentSet>
                    <Variant label="off">
                        <Switch aria-label="Off" />
                    </Variant>
                    <Variant label="on">
                        <Switch aria-label="On" defaultChecked />
                    </Variant>
                    <Variant label="disabled">
                        <Switch aria-label="Disabled" disabled />
                    </Variant>
                </ComponentSet>
                <Variant label="with a label">
                    <div className="flex flex-col gap-3">
                        <Labelled label="Email me when a report is ready">
                            <Switch defaultChecked />
                        </Labelled>
                        <Labelled label="Share with the workspace">
                            <Switch />
                        </Labelled>
                    </div>
                </Variant>
            </Specimen>
        </>
    );
};

const sections = [
    {
        id: 'summary',
        icon: <FileText {...icon} />,
        label: 'Executive summary',
        description: 'One page, written for the board',
    },
    {
        id: 'charts',
        icon: <PieChart {...icon} />,
        label: 'Charts',
        description: 'Reach, engagement and growth',
    },
    {
        id: 'table',
        icon: <Table2 {...icon} />,
        label: 'Post table',
        description: 'Every post with its numbers',
    },
];

export const OptionSection = () => {
    const [picked, setPicked] = useState<string[]>(['summary', 'charts']);
    const [audience, setAudience] = useState('client');

    return (
        <Specimen
            note="The whole row is the hit area"
            stageClassName="grid gap-8 md:grid-cols-2"
            title="Option rows"
        >
            <Variant className="items-stretch" label={`checkbox rows · ${picked.length} picked`}>
                <OptionList>
                    {sections.map(section => (
                        <OptionRow
                            control={
                                <Checkbox
                                    checked={picked.includes(section.id)}
                                    onCheckedChange={checked =>
                                        setPicked(current =>
                                            checked === true
                                                ? [...current, section.id]
                                                : current.filter(id => id !== section.id),
                                        )
                                    }
                                />
                            }
                            description={section.description}
                            icon={section.icon}
                            key={section.id}
                            label={section.label}
                        />
                    ))}
                </OptionList>
            </Variant>
            <Variant className="items-stretch" label="radio rows · no icon · disabled">
                <RadioGroup aria-label="Audience" onValueChange={setAudience} value={audience}>
                    <OptionRow
                        control={<RadioGroupItem value="client" />}
                        description="Plain language, no internal notes"
                        label="For the client"
                    />
                    <OptionRow
                        control={<RadioGroupItem value="team" />}
                        description="Includes raw numbers and comments"
                        label="For the team"
                    />
                    <OptionRow
                        control={<RadioGroupItem disabled value="public" />}
                        description="Needs an approved workspace"
                        icon={<Building2 {...icon} />}
                        label="Public"
                    />
                </RadioGroup>
            </Variant>
        </Specimen>
    );
};
