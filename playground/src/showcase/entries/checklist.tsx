import { Button, Checklist, ChecklistItem } from 'continuum';
import { useEffect, useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

const setupSteps = [
    {
        title: 'Create your workspace',
        description: 'A name and an address for your team.',
        action: 'Name it',
    },
    {
        title: 'Invite your team',
        description: 'Reports are better with the people who read them.',
        action: 'Invite teammates',
    },
    {
        title: 'Connect a data source',
        description: 'Analytics, your CRM or a spreadsheet; numbers refresh every hour.',
        action: 'Connect a source',
    },
    {
        title: 'Send your first report',
        description: 'Pick a template and send it to yourself first.',
        action: 'Send a report',
    },
];

const checklistKnobs: Knob[] = [
    {
        id: 'done',
        label: 'Done',
        options: setupSteps
            .map((_, i) => o(String(i), `${i} of ${setupSteps.length}`))
            .concat(o(String(setupSteps.length), 'All of them')),
        default: '1',
    },
];

const ChecklistPreview = ({ knobs }: PreviewProps) => {
    const [done, setDone] = useState(Number(knobs.done));

    useEffect(() => setDone(Number(knobs.done)), [knobs.done]);

    return (
        <Checklist
            action={done === setupSteps.length && <Button variant="ghost">Dismiss</Button>}
            className="w-95"
            completed={done}
            title="Get started"
            total={setupSteps.length}
        >
            {setupSteps.map((step, i) => (
                <ChecklistItem
                    action={
                        <Button onClick={() => setDone(n => n + 1)} variant="secondary">
                            {step.action}
                        </Button>
                    }
                    current={i === done}
                    description={step.description}
                    done={i < done}
                    key={step.title}
                    title={step.title}
                />
            ))}
        </Checklist>
    );
};

export const entry: Entry = {
    id: 'checklist',
    name: 'Checklist',
    category: 'status',
    description: 'Onboarding steps that tick off, with overall progress.',
    hero: 'min-h-120',
    knobs: checklistKnobs,
    // Taller than a tile, so the tile keeps the top in view and lets the rest run off.
    stageClassName: 'items-start',
    Preview: ChecklistPreview,
};

const onboarding = [
    { title: 'Create your workspace', description: '', action: '' },
    {
        title: 'Add your company details',
        description: 'Your address and VAT number, printed on every invoice.',
        action: 'Add details',
    },
    {
        title: 'Connect your bank',
        description: 'Invoices are marked paid as the money lands.',
        action: 'Connect a bank',
    },
    {
        title: 'Send your first invoice',
        description: 'Pick a customer and send it to yourself first, to see what they see.',
        action: 'New invoice',
    },
    {
        title: 'Invite your team',
        description: 'Finance and sales, so nobody has to ask what was paid.',
        action: 'Invite people',
    },
];

const GetStarted = () => {
    const [done, setDone] = useState(2);
    const finished = done === onboarding.length;

    return (
        <AppWindow
            className="mx-auto w-full max-w-180 px-0"
            description="A few steps and your first invoice is on its way."
            nav="top"
            place="overview"
            title="Welcome to Acme, Maya"
        >
            <Checklist
                action={
                    finished ? (
                        <Button onClick={() => setDone(1)} variant="ghost">
                            Start over
                        </Button>
                    ) : (
                        <Button variant="ghost">Skip for now</Button>
                    )
                }
                completed={done}
                title={finished ? 'You’re all set' : 'Set up your workspace'}
                total={onboarding.length}
            >
                {onboarding.map((step, i) => (
                    <ChecklistItem
                        action={
                            <>
                                <Button onClick={() => setDone(n => n + 1)}>{step.action}</Button>
                                <Button onClick={() => setDone(n => n + 1)} variant="ghost">
                                    Skip
                                </Button>
                            </>
                        }
                        current={i === done}
                        description={step.description}
                        done={i < done}
                        key={step.title}
                        title={step.title}
                    />
                ))}
            </Checklist>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Get started',
    note: 'The first page of a new workspace: five steps, two done, the next one open with its action.',
    app: true,
    render: () => <GetStarted />,
};
