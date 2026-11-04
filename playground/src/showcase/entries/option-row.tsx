import { Button, Checkbox, OptionList, OptionRow, RadioGroup, RadioGroupItem } from 'continuum';
import { FileText, PieChart, PieChart as PieIcon, Table2 } from 'lucide-react';
import { useState } from 'react';
import { SectionHead } from '../../screens/workspace';
import { AppWindow, type Entry, type InUse, icon, previewIcon } from '../kit';

const reportSections = [
    {
        id: 'summary',
        icon: <FileText {...previewIcon} />,
        label: 'Executive summary',
        description: 'One page, written for the board',
    },
    {
        id: 'charts',
        icon: <PieChart {...previewIcon} />,
        label: 'Charts',
        description: 'Reach, engagement and growth',
    },
    {
        id: 'table',
        icon: <Table2 {...previewIcon} />,
        label: 'Post table',
        description: 'Every post with its numbers',
    },
];

const OptionRowPreview = () => {
    const [picked, setPicked] = useState(['summary']);

    return (
        <OptionList className="w-full max-w-80">
            {reportSections.slice(0, 2).map(section => (
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
    );
};

export const entry: Entry = {
    id: 'option-row',
    name: 'Option row',
    category: 'forms',
    description: 'A bordered row that toggles the control it holds.',
    Preview: OptionRowPreview,
};

const exportParts = [
    {
        id: 'summary',
        icon: <FileText {...icon} />,
        label: 'Executive summary',
        description: 'One page, written for the board',
    },
    {
        id: 'charts',
        icon: <PieIcon {...icon} />,
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

const NewReport = () => {
    const [picked, setPicked] = useState(['summary', 'charts']);
    const [audience, setAudience] = useState('client');

    return (
        <AppWindow
            actions={<Button disabled={picked.length === 0}>Create report</Button>}
            className="mx-auto w-full max-w-content-narrow"
            description="Northwind Traders, 1 July to 30 September."
            nav="top"
            place="reports"
            title="New report"
        >
            <section className="flex flex-col gap-4">
                <SectionHead
                    description="Pick the parts the report is made of; you can reorder them after."
                    title="What to include"
                />
                <OptionList>
                    {exportParts.map(part => (
                        <OptionRow
                            control={
                                <Checkbox
                                    checked={picked.includes(part.id)}
                                    onCheckedChange={checked =>
                                        setPicked(current =>
                                            checked === true
                                                ? [...current, part.id]
                                                : current.filter(id => id !== part.id),
                                        )
                                    }
                                />
                            }
                            description={part.description}
                            icon={part.icon}
                            key={part.id}
                            label={part.label}
                        />
                    ))}
                </OptionList>
            </section>
            <section className="flex flex-col gap-4">
                <SectionHead title="Who it’s for" />
                <RadioGroup
                    aria-label="Audience"
                    onValueChange={value => setAudience(String(value))}
                    value={audience}
                >
                    <OptionList className="grid grid-cols-2">
                        <OptionRow
                            control={<RadioGroupItem value="client" />}
                            description="Numbers only, no notes"
                            label="The client"
                        />
                        <OptionRow
                            control={<RadioGroupItem value="team" />}
                            description="With notes and next steps"
                            label="The team"
                        />
                    </OptionList>
                </RadioGroup>
            </section>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'New report',
    note: 'The parts of a new report as checkbox rows, its audience as radio rows.',
    app: true,
    render: () => <NewReport />,
};
