import {
    AssistantAnswer,
    Button,
    Card,
    ChatMessage,
    ChatThread,
    Thinking,
    ThinkingCaret,
    ThinkingRun,
} from 'continuum';
import { useEffect, useRef, useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

/* ---------- Shared: words that come in a few at a time, and steps that follow each other ---------- */

/** The text written out word by word, every `pace` ms, then held for `hold` ms and started again. */
const useStream = (text: string, { pace = 90, hold = 2400, run = true } = {}) => {
    const words = text.split(' ');
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!run) return;
        if (count >= words.length) {
            const timer = window.setTimeout(() => setCount(0), hold);
            return () => window.clearTimeout(timer);
        }
        const timer = window.setTimeout(() => setCount(n => n + 1), count === 0 ? 600 : pace);
        return () => window.clearTimeout(timer);
    }, [count, words.length, pace, hold, run]);

    return { text: words.slice(0, count).join(' '), done: count >= words.length, count };
};

/** One of `items` at a time, moving on every `every` ms, round and round. */
const useCycle = <T,>(items: readonly T[], every: number) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), every);
        return () => window.clearInterval(timer);
    }, [items.length, every]);

    return items[index] as T;
};

/* ---------- Preview: one kind of wait at a time ---------- */

const kind = (values: PreviewProps['knobs']) => values.kind;

const knobs: Knob[] = [
    {
        id: 'kind',
        label: 'Kind',
        options: [o('inline', 'Inline'), o('message', 'Message'), o('run', 'Run')],
        default: 'inline',
    },
    {
        id: 'words',
        label: 'Words',
        options: [
            o('Thinking'),
            o('Searching the docs'),
            o('Reading 3 invoices'),
            o('changing', 'Changing'),
        ],
        default: 'Thinking',
        when: values => kind(values) === 'inline',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 13px'), o('sm', 'sm · 11px')],
        default: 'md',
        when: values => kind(values) === 'inline',
    },
    {
        id: 'step',
        label: 'Steps',
        options: [o('list', 'List'), o('line', 'One line'), o('none', 'None')],
        default: 'list',
        when: values => kind(values) === 'run',
    },
    {
        id: 'elapsed',
        label: 'Elapsed',
        switch: true,
        default: true,
        when: values => kind(values) === 'run',
    },
    {
        id: 'stop',
        label: 'Stop',
        switch: true,
        default: true,
        when: values => kind(values) === 'run',
    },
];

const changingWords = ['Thinking', 'Searching the docs', 'Reading 3 invoices', 'Comparing totals'];

const InlinePreview = ({ words, size }: { words: string; size: 'sm' | 'md' }) => {
    const changing = useCycle(changingWords, 2000);
    return <Thinking size={size}>{words === 'changing' ? changing : words}</Thinking>;
};

const reply =
    'Northwind’s plan renews on 1 December. They moved to Enterprise in March and added 20 seats since, so the renewal quote should start from 120.';

const MessagePreview = () => {
    const { text, done } = useStream(reply);

    return (
        <AssistantAnswer className="w-full max-w-100" pending={!done}>
            <p>
                {text}
                {!done && <ThinkingCaret label={text ? false : 'Writing a reply'} />}
            </p>
        </AssistantAnswer>
    );
};

const runSteps = [
    'Reading 214 invoices from March',
    'Matching payments to invoices',
    'Checking 6 that do not match',
    'Writing the summary',
];

/** The steps with the run on step `at`: the ones before it done, the ones after still to come. */
const stepsAt = (labels: readonly string[], at: number) =>
    labels.map((label, index) => ({
        label,
        state:
            index < at
                ? ('done' as const)
                : index === at
                  ? ('active' as const)
                  : ('waiting' as const),
    }));

const stepIndexes = runSteps.map((_, index) => index);

const RunPreview = ({ values }: { values: PreviewProps['knobs'] }) => {
    const at = useCycle(stepIndexes, 2600);
    const step = runSteps[at];
    // A run that began 47 seconds before the page opened, so the clock shows a minute soon.
    const [startedAt] = useState(() => Date.now() - 47_000);

    return (
        <ThinkingRun
            action={values.stop ? <Button variant="secondary">Stop</Button> : undefined}
            className="w-full max-w-100"
            startedAt={values.elapsed ? startedAt : undefined}
            steps={values.step === 'list' ? stepsAt(runSteps, at) : undefined}
            title="Reconciling March payments"
        >
            {values.step === 'line' ? step : undefined}
        </ThinkingRun>
    );
};

const ThinkingPreview = ({ knobs: values }: PreviewProps) => {
    if (values.kind === 'message') return <MessagePreview />;
    if (values.kind === 'run') return <RunPreview values={values} />;
    return (
        <InlinePreview
            size={values.size === 'sm' ? 'sm' : 'md'}
            words={String(values.words ?? 'Thinking')}
        />
    );
};

export const entry: Entry = {
    id: 'thinking',
    name: 'Thinking',
    category: 'ai',
    description:
        'What shows while an assistant works: a line beside the words, a square at the end of a reply still coming, a card for a long run.',
    knobs,
    Preview: ThinkingPreview,
};

/* ---------- In use: the agent thinks, works through a run, then writes its answer out ---------- */

type Phase =
    | { at: 'thinking'; words: string }
    | { at: 'run'; step: string }
    | { at: 'writing' }
    | { at: 'done' };

// What the agent is doing, in ms after the question; it loops, so the page keeps showing each wait.
const beats: [number, Phase][] = [
    [0, { at: 'thinking', words: 'Thinking' }],
    [1400, { at: 'thinking', words: 'Looking up overdue invoices' }],
    [3000, { at: 'run', step: 'Drafting a reminder to Northwind' }],
    [4800, { at: 'run', step: 'Drafting a reminder to Globex' }],
    [6600, { at: 'run', step: 'Checking past payments' }],
    [8400, { at: 'writing' }],
];
const loop = 17000;

const answer =
    'Sent three reminders, €2,280.00 in all. Northwind has paid late twice before, both times within a week of a reminder; Globex and Initech have not.';

const usePhases = () => {
    const [phase, setPhase] = useState<Phase>({ at: 'thinking', words: 'Thinking' });
    const [startedAt, setStartedAt] = useState(() => Date.now());
    const started = useRef(false);

    useEffect(() => {
        let timers: number[] = [];
        const run = () => {
            timers = beats.map(([at, next]) =>
                window.setTimeout(() => {
                    if (next.at === 'run' && !started.current) {
                        started.current = true;
                        setStartedAt(Date.now());
                    }
                    if (next.at !== 'run') started.current = false;
                    setPhase(next);
                }, at),
            );
            timers.push(window.setTimeout(run, loop));
        };
        run();
        return () => timers.forEach(clearTimeout);
    }, []);

    return { phase, startedAt };
};

const AgentPage = () => {
    const { phase, startedAt } = usePhases();

    return (
        <AppWindow
            description="Ask about customers, invoices and reports; it answers from your workspace."
            place="agent"
            title="Agent"
            trail={['Agent']}
            width="narrow"
        >
            <Card className="gap-0 p-0">
                <ChatThread className="h-96 w-full">
                    <ChatMessage status="read" time="10:02 AM" variant="own">
                        Remind the three overdue customers, and tell me who has paid late before.
                    </ChatMessage>
                    {phase.at === 'thinking' && (
                        <AssistantAnswer
                            key="thinking"
                            pending
                            work={<Thinking>{phase.words}</Thinking>}
                        />
                    )}
                    {phase.at === 'run' && (
                        <ThinkingRun
                            action={<Button variant="secondary">Stop</Button>}
                            key="run"
                            startedAt={startedAt}
                            title="Sending 3 reminders"
                        >
                            {phase.step}
                        </ThinkingRun>
                    )}
                    {phase.at === 'writing' && <Answer key="answer" />}
                </ChatThread>
            </Card>
        </AppWindow>
    );
};

// Its own stream, so it starts from the first word each time the agent comes round to writing.
const Answer = () => {
    const { text, done } = useStream(answer, { pace: 70, hold: 60_000 });

    return (
        <AssistantAnswer pending={!done}>
            <p>
                {text}
                {!done && <ThinkingCaret label={text ? false : 'Writing a reply'} />}
            </p>
        </AssistantAnswer>
    );
};

export const inUse: InUse = {
    title: 'Agent at work',
    note: 'The agent thinks in a line, works through a run with a clock and a Stop, then writes its answer out with a square at the end of the words.',
    app: true,
    render: () => <AgentPage />,
};
