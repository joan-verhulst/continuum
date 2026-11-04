import {
    Avatar,
    Button,
    DescriptionItem,
    DescriptionList,
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import {
    ArrowRight,
    CalendarClock,
    Eye,
    FileSpreadsheet,
    FileText,
    Plus,
    Upload,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import { customers, formatEuro } from '../../screens/workspace';
import {
    AppScene,
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

const stepperKnobs: Knob[] = [
    {
        id: 'orientation',
        label: 'Orientation',
        options: opts('horizontal', 'vertical'),
        default: 'horizontal',
    },
    {
        id: 'marker',
        label: 'Marker',
        options: opts('number', 'dot', 'icon', 'line'),
        default: 'number',
    },
    {
        id: 'layout',
        label: 'Layout in a row',
        options: opts('inline', 'centered'),
        default: 'inline',
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
        options: [o('wide', 'Wide · 540px'), o('narrow', 'Narrow · 320px')],
        default: 'wide',
    },
    { id: 'descriptions', label: 'Descriptions', switch: true, default: true },
    { id: 'invalid', label: 'First step needs fixing', switch: true, default: false },
    { id: 'content', label: 'Fields under the current step', switch: true, default: false },
    { id: 'back', label: 'Done steps go back', switch: true, default: true },
];

const StepperPreview = ({ knobs }: PreviewProps) => {
    const [current, setCurrent] = useState(2);
    const vertical = knobs.orientation === 'vertical';

    // The knob sets the step; a click on a done step still goes back to it.
    useEffect(() => setCurrent(Number(knobs.step)), [knobs.step]);

    return (
        <Stepper
            aria-label="New campaign"
            className={vertical ? 'w-64' : knobs.width === 'narrow' ? 'w-80' : 'w-[540px]'}
            layout={knobs.layout as StepperLayout}
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
                        {knobs.content && i + 1 === current && (
                            <div className="flex flex-col gap-3">
                                <Input
                                    aria-label={step.label}
                                    defaultValue={i === 0 ? 'Winter follow-up' : 'Webinar leads'}
                                    size="sm"
                                />
                                <Button
                                    className="self-start"
                                    onClick={() =>
                                        setCurrent(n => Math.min(n + 1, campaignSteps.length))
                                    }
                                >
                                    Continue
                                </Button>
                            </div>
                        )}
                    </StepperItem>
                );
            })}
        </Stepper>
    );
};

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

const ImportSteps = () => {
    const stage = useStageContainer();
    const [step, setStep] = useState(2);
    const last = step === importSteps.length;

    return (
        <Dialog modal={false} open>
            <DialogContent
                container={stage}
                finalFocus={false}
                initialFocus={false}
                style={{ width: 'min(600px, calc(100% - 32px))' }}
            >
                <DialogHeader>
                    <DialogTitle>Import customers</DialogTitle>
                </DialogHeader>
                <DialogBody className="gap-6 pt-5 pb-6">
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
                                <span className="text-neutral-500 text-xxs">312 rows · 48 KB</span>
                            </span>
                            <Button variant="ghost">Replace</Button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="flex flex-col gap-2">
                            <p className="flex justify-between pb-1 text-neutral-500 text-xxs">
                                <span>Column in the file</span>
                                <span className="w-48">Customer field</span>
                            </p>
                            {columnMatches.map(match => (
                                <div className="flex items-center gap-3" key={match.column}>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="font-medium text-neutral-950 text-xs">
                                            {match.column}
                                        </span>
                                        <span className="truncate text-neutral-500 text-xxs">
                                            {match.sample}
                                        </span>
                                    </span>
                                    <ArrowRight
                                        {...icon}
                                        className="size-4 shrink-0 text-neutral-500"
                                    />
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
                </DialogBody>
                <DialogFooter>
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CustomerRows = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">MRR</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {customers.slice(0, 6).map(customer => (
                <TableRow key={customer.id}>
                    <TableCell>
                        <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                            <Avatar fallback={customer.initials} size={24} />
                            {customer.name}
                        </span>
                    </TableCell>
                    <TableCell className="text-neutral-600">{customer.plan}</TableCell>
                    <TableCell className="text-neutral-600">{customer.owner}</TableCell>
                    <TableCell className="text-right text-neutral-950 tabular-nums">
                        {formatEuro(customer.mrr)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const ImportOverCustomers = () => (
    <AppScene
        page={{
            nav: 'sidebar',
            place: 'customers',
            trail: ['Customers'],
            title: 'Customers',
            description: '10 customers, 7 of them active.',
            actions: (
                <>
                    <Button variant="secondary">
                        <Upload {...icon} /> Import
                    </Button>
                    <Button>
                        <Plus {...icon} /> Add customer
                    </Button>
                </>
            ),
            children: <CustomerRows />,
        }}
    >
        <ImportSteps />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Import customers',
    note: 'Three steps in the import dialog; Continue moves on, a done step goes back.',
    bare: true,
    render: () => <ImportOverCustomers />,
};
