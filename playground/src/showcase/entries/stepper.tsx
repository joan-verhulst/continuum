import {
    Button,
    cn,
    DescriptionItem,
    DescriptionList,
    IconTile,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Stepper,
    StepperItem,
    type StepperLayout,
    type StepperMarker,
} from 'continuum';
import { ArrowRight, CalendarClock, Eye, FileSpreadsheet, FileText, Users } from 'lucide-react';
import { useState } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
} from '../kit';

const campaignSteps = [
    { label: 'Details', description: 'Name and sender', Icon: FileText },
    { label: 'Audience', description: 'Who gets it', Icon: Users },
    { label: 'Schedule', description: 'Date and time', Icon: CalendarClock },
    { label: 'Review', description: 'A last check', Icon: Eye },
];

/*
 * The orientation and the row's layout are one choice, so no option is left without an effect:
 * a column has no layout of its own. A line marker draws its bar under the label either way.
 */
const stepperKnobs: Knob[] = [
    {
        id: 'layout',
        label: 'Layout',
        options: [
            o('inline', 'Row · text beside'),
            o('centered', 'Row · text under'),
            o('vertical', 'Column'),
        ],
        default: 'inline',
    },
    {
        id: 'marker',
        label: 'Marker',
        options: opts('number', 'dot', 'icon', 'line'),
        default: 'number',
    },
    {
        id: 'step',
        label: 'Current step',
        options: campaignSteps.map((step, i) => o(String(i + 1), `${i + 1} · ${step.label}`)),
        default: '2',
    },
    {
        id: 'width',
        label: 'Width',
        options: [o('wide', 'Wide'), o('narrow', 'Narrow')],
        default: 'wide',
    },
    { id: 'descriptions', label: 'Descriptions', switch: true, default: true },
    { id: 'invalid', label: 'First step needs fixing', switch: true, default: false },
    { id: 'content', label: 'The current step’s fields', switch: true, default: false },
    { id: 'back', label: 'Done steps go back', switch: true, default: true },
];

// A row over the form, a column beside it: wide and narrow for each.
const stepperWidths = {
    row: { wide: 'w-135', narrow: 'w-80' },
    column: { wide: 'w-80', narrow: 'w-60' },
};

const StepperDemo = ({ knobs }: PreviewProps) => {
    // The knob sets the step; a click on a done step, or Continue, moves from there.
    const [current, setCurrent] = useState(Number(knobs.step));
    const vertical = knobs.layout === 'vertical';
    const width =
        stepperWidths[vertical ? 'column' : 'row'][knobs.width === 'narrow' ? 'narrow' : 'wide'];

    // The current step's fields: inside the step in a column, under the whole row in a row.
    const fields = (step: (typeof campaignSteps)[number] | undefined) =>
        step && (
            <div className="flex flex-col gap-3">
                <Input
                    aria-label={step.label}
                    defaultValue={step === campaignSteps[0] ? 'Winter follow-up' : 'Webinar leads'}
                    key={step.label}
                    size="sm"
                />
                <Button
                    className="self-start"
                    onClick={() => setCurrent(n => Math.min(n + 1, campaignSteps.length))}
                >
                    Continue
                </Button>
            </div>
        );

    const stepper = (
        <Stepper
            aria-label="New campaign"
            className={vertical ? width : 'w-full'}
            layout={vertical ? undefined : (knobs.layout as StepperLayout)}
            marker={knobs.marker as StepperMarker}
            onValueChange={knobs.back ? setCurrent : undefined}
            orientation={vertical ? 'vertical' : 'horizontal'}
            value={current}
        >
            {campaignSteps.map((step, i) => {
                const invalid = Boolean(knobs.invalid) && i === 0;

                return (
                    <StepperItem
                        description={
                            invalid
                                ? 'Sender is missing'
                                : knobs.descriptions
                                  ? step.description
                                  : undefined
                        }
                        icon={<step.Icon {...icon} />}
                        invalid={invalid}
                        key={step.label}
                        label={step.label}
                        step={i + 1}
                    >
                        {vertical && knobs.content && i + 1 === current && fields(step)}
                    </StepperItem>
                );
            })}
        </Stepper>
    );

    if (vertical) return stepper;

    return (
        <div className={cn('flex flex-col gap-6', width)}>
            {stepper}
            {knobs.content && fields(campaignSteps[current - 1])}
        </div>
    );
};

// A change of any knob starts the stepper afresh from what the knobs say.
const StepperPreview = ({ knobs }: PreviewProps) => (
    <StepperDemo key={JSON.stringify(knobs)} knobs={knobs} />
);

export const entry: Entry = {
    id: 'stepper',
    name: 'Stepper',
    category: 'navigation',
    description: 'The steps of a long form: what is done, where you are, what is left.',
    span: 2,
    knobs: stepperKnobs,
    Preview: StepperPreview,
};

const importSteps = [
    { label: 'Upload', description: 'A CSV file' },
    { label: 'Match columns', description: 'To customer fields' },
    { label: 'Review', description: 'What changes' },
];

const columnMatches = [
    { column: 'Company', sample: 'Northwind Traders', field: 'name' },
    { column: 'Website', sample: 'northwind.com', field: 'domain' },
    { column: 'Tier', sample: 'Enterprise', field: 'plan' },
    { column: 'Account manager', sample: 'Maya Chen', field: 'owner' },
];

const customerFields = [
    { value: 'name', label: 'Name' },
    { value: 'domain', label: 'Domain' },
    { value: 'plan', label: 'Plan' },
    { value: 'owner', label: 'Owner' },
    { value: 'skip', label: 'Don’t import' },
];

const ImportCustomers = () => {
    const [step, setStep] = useState(2);
    const last = step === importSteps.length;

    return (
        // A long form is a page of its own: the stepper over it, Back and Continue at its end.
        <AppWindow
            description="From a CSV file; existing customers are matched on their domain."
            place="customers"
            title="Import customers"
            trail={['Customers', 'Import']}
            width="narrow"
        >
            <Stepper aria-label="Import customers" onValueChange={setStep} value={step}>
                {importSteps.map((item, i) => (
                    <StepperItem
                        description={item.description}
                        key={item.label}
                        label={item.label}
                        step={i + 1}
                    />
                ))}
            </Stepper>
            {step === 1 && (
                <div className="flex items-center gap-3 rounded-card border border-neutral-200 p-3">
                    <IconTile>
                        <FileSpreadsheet {...icon} />
                    </IconTile>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-neutral-950 text-xs">
                            customers-october.csv
                        </span>
                        <span className="text-neutral-600 text-xxs">312 rows · 48 KB</span>
                    </span>
                    <Button variant="ghost">Replace</Button>
                </div>
            )}
            {step === 2 && (
                <div className="flex flex-col gap-2">
                    <p className="flex justify-between pb-1 text-neutral-600 text-xxs">
                        <span>Column in the file</span>
                        <span className="w-48">Customer field</span>
                    </p>
                    {columnMatches.map(match => (
                        <div className="flex items-center gap-3" key={match.column}>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-medium text-neutral-950 text-xs">
                                    {match.column}
                                </span>
                                <span className="truncate text-neutral-600 text-xxs">
                                    {match.sample}
                                </span>
                            </span>
                            <ArrowRight {...icon} className="size-4 shrink-0 text-neutral-500" />
                            <Select defaultValue={match.field}>
                                <SelectTrigger
                                    aria-label={`Field for ${match.column}`}
                                    className="w-48"
                                    size="sm"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {customerFields.map(field => (
                                        <SelectItem key={field.value} value={field.value}>
                                            {field.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            )}
            {last && (
                <DescriptionList>
                    <DescriptionItem term="File">customers-october.csv</DescriptionItem>
                    <DescriptionItem term="New customers">296</DescriptionItem>
                    <DescriptionItem term="Updated">16, matched on domain</DescriptionItem>
                    <DescriptionItem term="Skipped">None</DescriptionItem>
                </DescriptionList>
            )}
            <div className="flex justify-end gap-2">
                <Button
                    disabled={step === 1}
                    onClick={() => setStep(current => current - 1)}
                    variant="secondary"
                >
                    Back
                </Button>
                <Button onClick={() => setStep(current => (last ? 1 : current + 1))}>
                    {last ? 'Import 312 customers' : 'Continue'}
                </Button>
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Import customers',
    note: 'The import as a page of three steps, the stepper over it; Continue moves on, a done step goes back.',
    app: true,
    render: () => <ImportCustomers />,
};
