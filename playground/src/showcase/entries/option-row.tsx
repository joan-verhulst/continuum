import { Checkbox, OptionList, OptionRow, RadioGroup, RadioGroupItem } from 'continuum';
import { FileText, PieChart, PieChart as PieIcon, Table2 } from 'lucide-react';
import { useState } from 'react';
import {
    DialogActions,
    type Entry,
    type InUse,
    icon,
    OpenDialog,
    previewIcon,
    scene,
} from '../kit';

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

const ExportReport = () => {
    const [picked, setPicked] = useState(['summary', 'charts']);
    const [audience, setAudience] = useState('client');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={`Export ${picked.length} parts`}
                    disabled={picked.length === 0}
                />
            }
            title="Export report"
            width={480}
        >
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
            <RadioGroup
                aria-label="Audience"
                onValueChange={value => setAudience(String(value))}
                value={audience}
            >
                <OptionList>
                    <OptionRow
                        control={<RadioGroupItem value="client" />}
                        description="Numbers only, no notes"
                        label="For the client"
                    />
                    <OptionRow
                        control={<RadioGroupItem value="team" />}
                        description="With notes and next steps"
                        label="For the team"
                    />
                </OptionList>
            </RadioGroup>
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Export report',
    note: 'Parts to include as checkbox rows, the audience as radio rows.',
    bare: true,
    render: scene(<ExportReport />, 'min-h-[480px]'),
};
