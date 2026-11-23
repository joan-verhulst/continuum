import {
    AssistantAnswer,
    AssistantAnswerAction,
    AssistantAnswerCopy,
    AssistantAnswerStep,
    ChatMessage,
    ChatThread,
    StatCard,
    Thinking,
    ThinkingCaret,
} from 'continuum';
import { BookOpen, RotateCcw, Search, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

/* ---------- Shared: the answer's words and what can be done with it ---------- */

const words =
    'Northwind’s plan renews on 1 December. They moved to Enterprise in March and added 20 seats since, so the renewal quote should start from 120.';

/** Good and bad, one at a time; pressing the one that is on turns it off. */
const Actions = ({ text, retry = true }: { text: string; retry?: boolean }) => {
    const [verdict, setVerdict] = useState<'good' | 'bad' | null>(null);
    const toggle = (next: 'good' | 'bad') =>
        setVerdict(current => (current === next ? null : next));

    return (
        <>
            <AssistantAnswerCopy text={text} />
            {retry && <AssistantAnswerAction icon={<RotateCcw {...icon} />} label="Try again" />}
            <AssistantAnswerAction
                icon={<ThumbsUp {...icon} />}
                label="Good answer"
                onClick={() => toggle('good')}
                pressed={verdict === 'good'}
            />
            <AssistantAnswerAction
                icon={<ThumbsDown {...icon} />}
                label="Bad answer"
                onClick={() => toggle('bad')}
                pressed={verdict === 'bad'}
            />
        </>
    );
};

/** The words written out one at a time, every `pace` ms, while `run`; whole once done. */
const useStream = (text: string, run: boolean, pace = 70) => {
    const all = text.split(' ');
    const [count, setCount] = useState(run ? 0 : all.length);

    useEffect(() => {
        if (!run) {
            setCount(all.length);
            return;
        }
        setCount(0);
    }, [run, all.length]);

    useEffect(() => {
        if (count >= all.length) return;
        const timer = window.setTimeout(() => setCount(n => n + 1), pace);
        return () => window.clearTimeout(timer);
    }, [count, all.length, pace]);

    return { text: all.slice(0, count).join(' '), done: count >= all.length };
};

/* ---------- Preview: one answer, from working to done ---------- */

const knobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [o('working', 'Working'), o('writing', 'Writing'), o('done', 'Done')],
        default: 'done',
    },
    {
        id: 'blocks',
        label: 'Content',
        options: [o('text', 'Text'), o('figures', 'Text + figures')],
        default: 'text',
        when: values => values.state !== 'working',
    },
    {
        id: 'actions',
        label: 'Actions',
        switch: true,
        default: true,
        when: values => values.state === 'done',
    },
];

const AssistantAnswerPreview = ({ knobs: values }: PreviewProps) => {
    const state = String(values.state);
    const { text, done } = useStream(words, state === 'writing');
    const writing = state === 'writing' && !done;

    return (
        <AssistantAnswer
            actions={values.actions ? <Actions text={words} /> : undefined}
            className="w-full max-w-120"
            pending={state !== 'done'}
            work={
                state === 'working' ? (
                    <Thinking>Reading Northwind’s plan</Thinking>
                ) : (
                    <AssistantAnswerStep icon={<BookOpen {...icon} />} onClick={() => {}}>
                        4 sources used
                    </AssistantAnswerStep>
                )
            }
        >
            {state !== 'working' && (
                <p>
                    {state === 'writing' ? text : words}
                    {writing && <ThinkingCaret />}
                </p>
            )}
            {state === 'done' && values.blocks === 'figures' && (
                <div className="grid grid-cols-2 gap-3">
                    <StatCard delta="+20" label="Seats" value="120" />
                    <StatCard label="Renews" value="1 Dec" />
                </div>
            )}
        </AssistantAnswer>
    );
};

export const entry: Entry = {
    id: 'assistant-answer',
    name: 'Assistant answer',
    category: 'ai',
    description:
        'An assistant’s answer: open in the column, not a bubble, with what it did above it and what can be done with it below.',
    knobs,
    Preview: AssistantAnswerPreview,
};

/* ---------- In use: asking why bounce rate climbed, answered with the product's own figures ---------- */

const AskPage = () => (
    <AppWindow place="agent" trail={['Agent', 'Bounce rate this week']} width="narrow">
        <ChatThread className="h-130 w-full p-0">
            <ChatMessage variant="own">Why has bounce rate been climbing this week?</ChatMessage>
            <AssistantAnswer
                actions={<Actions text="Bounce rate has risen for 7 days." />}
                work={
                    <>
                        <AssistantAnswerStep icon={<Search {...icon} />}>
                            Read bounce rate by page and source
                        </AssistantAnswerStep>
                        <AssistantAnswerStep icon={<BookOpen {...icon} />} onClick={() => {}}>
                            12 sources used
                        </AssistantAnswerStep>
                    </>
                }
            >
                <p>
                    Bounce rate has risen for 7 days, mostly from new mobile visitors landing on
                    /pricing. The sharpest jump came on Tuesday afternoon, after a spike from Hacker
                    News.
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <StatCard delta="+12%" label="Visitors" value="12,840" />
                    <StatCard delta="-4%" label="Sessions" value="9,210" />
                    <StatCard delta="+18%" label="Bounce rate" trend="down" value="41%" />
                </div>
                <p>No single cause stands out. What adds most:</p>
                <ul>
                    <li>colder social traffic</li>
                    <li>weaker engagement on mobile</li>
                    <li>a slower /pricing on Safari</li>
                </ul>
            </AssistantAnswer>
        </ChatThread>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Ask about the site',
    note: 'A question on the tint, and the answer open under it: what it read, the reason in a few lines, the figures as the product draws them, then copy, again, good and bad.',
    app: true,
    render: () => <AskPage />,
};
