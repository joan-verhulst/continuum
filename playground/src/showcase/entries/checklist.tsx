import { Button, Checklist, ChecklistItem } from 'continuum';
import { useEffect, useState } from 'react';
import { type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

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
    const [done, setDone] = useState(1);

    useEffect(() => setDone(Number(knobs.done)), [knobs.done]);

    return (
        <Checklist
            action={done === setupSteps.length && <Button variant="ghost">Dismiss</Button>}
            className="w-[380px]"
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
    name: 'Setup checklist',
    category: 'status',
    description: 'Onboarding steps that tick off, with overall progress.',
    hero: 'min-h-[480px]',
    knobs: checklistKnobs,
    // Taller than a tile, so the tile keeps the top in view and lets the rest run off.
    stageClassName: 'items-start',
    Preview: ChecklistPreview,
};

const onboarding = [
    { title: 'Create your workspace', description: '', action: '' },
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
    {
        title: 'Schedule a weekly digest',
        description: 'Every Monday at nine, the week in one email.',
        action: 'Schedule it',
    },
];

const GetStarted = () => {
    const [done, setDone] = useState(2);
    const finished = done === onboarding.length;

    return (
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
            className="w-full max-w-md"
            completed={done}
            title={finished ? 'You’re all set' : 'Get started with Continuum'}
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
    );
};

export const inUse: InUse = {
    title: 'Get started',
    note: 'Five steps, two done, the next one open with its action.',
    canvas: true,
    render: () => <GetStarted />,
};
