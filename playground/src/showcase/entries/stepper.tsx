import {
    Button,
    DatePicker,
    DescriptionItem,
    DescriptionList,
    Field,
    FieldLabel,
    Input,
    OptionList,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    Stepper,
    StepperItem,
    type StepperLayout,
    type StepperMarker,
} from 'continuum';
import { ArrowRight, AtSign, CalendarClock, Clock, Eye, FileText, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, o, opts, type PreviewProps } from '../kit';

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

const wizardSteps = [
    { label: 'Details', description: 'Name and sender' },
    { label: 'Audience', description: 'Who gets it' },
    { label: 'Schedule', description: 'Date and time' },
    { label: 'Review', description: 'A last check' },
];

const NewCampaign = () => {
    const [step, setStep] = useState(2);
    const last = step === wizardSteps.length;

    return (
        <div className="flex w-full max-w-3xl flex-col gap-8">
            <Stepper aria-label="New campaign" onValueChange={setStep} value={step}>
                {wizardSteps.map((item, i) => (
                    <StepperItem
                        description={item.description}
                        key={item.label}
                        label={item.label}
                        step={i + 1}
                    />
                ))}
            </Stepper>
            <div className="flex flex-col gap-5">
                {step === 1 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>Campaign name</FieldLabel>
                            <Input defaultValue="Winter webinar follow-up" size="sm" />
                        </Field>
                        <Field>
                            <FieldLabel>Sender</FieldLabel>
                            <Input
                                defaultValue="anna@northwind.io"
                                leadingIcon={<AtSign {...icon} />}
                                size="sm"
                            />
                        </Field>
                    </div>
                )}
                {step === 2 && (
                    <RadioGroup aria-label="Audience" defaultValue="leads">
                        <OptionList>
                            <OptionRow
                                control={<RadioGroupItem value="leads" />}
                                description="1,284 people who signed up for the webinar"
                                label="Webinar leads"
                            />
                            <OptionRow
                                control={<RadioGroupItem value="customers" />}
                                description="3,920 people on a paid plan"
                                label="Customers"
                            />
                        </OptionList>
                    </RadioGroup>
                )}
                {step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>Start date</FieldLabel>
                            <DatePicker defaultValue={new Date(2026, 10, 2)} />
                        </Field>
                        <Field>
                            <FieldLabel>Send at</FieldLabel>
                            <Input
                                defaultValue="09:30"
                                leadingIcon={<Clock {...icon} />}
                                size="sm"
                            />
                        </Field>
                    </div>
                )}
                {last && (
                    <DescriptionList>
                        <DescriptionItem term="Campaign">Winter webinar follow-up</DescriptionItem>
                        <DescriptionItem term="Audience">
                            Webinar leads · 1,284 people
                        </DescriptionItem>
                        <DescriptionItem term="Starts">2 November 2026 at 09:30</DescriptionItem>
                    </DescriptionList>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    disabled={step === 1}
                    onClick={() => setStep(current => current - 1)}
                    variant="secondary"
                >
                    Back
                </Button>
                <Button onClick={() => setStep(current => (last ? 1 : current + 1))}>
                    {last ? 'Start campaign' : 'Continue'}
                    {last ? <Send {...icon} /> : <ArrowRight {...icon} />}
                </Button>
            </div>
        </div>
    );
};

export const inUse: InUse = {
    title: 'New campaign',
    note: 'Four steps over the form; Continue moves on, a done step goes back.',
    render: () => <NewCampaign />,
};
