import {
    Avatar,
    Badge,
    Button,
    Card,
    ChatAttachment,
    ChatAttachments,
    ChatComposer,
    ChatEvent,
    ChatMessage,
    ChatReference,
    ChatThread,
    ChatToken,
    ChatTyping,
    ChatUnreadDivider,
} from 'continuum';
import { Check, UserRound } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    sampleImage,
    useSending,
} from '../kit';

/* ---------- Preview: the thread's own states; how one message looks is Chat message's ---------- */

const knobs: Knob[] = [
    {
        id: 'state',
        label: 'Thread',
        options: [o('live', 'Loaded'), o('loading', 'Loading'), o('earlier', 'Loading earlier')],
        default: 'live',
    },
    {
        id: 'divider',
        label: 'Unread divider',
        switch: true,
        default: false,
        when: values => values.state !== 'loading',
    },
    {
        id: 'jump',
        label: 'Jump to latest',
        switch: true,
        default: false,
        when: values => values.state === 'live',
    },
    {
        id: 'writing',
        label: 'Assistant writing',
        switch: true,
        default: false,
        when: values => values.state !== 'loading',
    },
];

const bot = {
    author: '@Support Bot',
    avatar: <Avatar fallback="SB" shape="round" size={24} />,
    badge: <Badge tone="primary">AI</Badge>,
} as const;

// Two older messages that scrolling to the top fetches, once.
const earlier = [
    <ChatMessage key="e1" status="read" time="2:41 PM" variant="own">
        Hi, is this the right place for payout questions?
    </ChatMessage>,
    <ChatMessage key="e2" {...bot} time="2:41 PM">
        It is. Tell me the invoice and I will look it up.
    </ChatMessage>,
];

// What arrives while the reader is scrolled back, for the jump button to count.
const arriving = [
    'I checked with finance: the bank held it for a routine check.',
    'It is released now and lands tomorrow morning.',
];

const ChatThreadPreview = ({ knobs: values }: PreviewProps) => {
    const { sent, send, retry } = useSending();
    const [history, setHistory] = useState<ReactNode[]>([]);
    const [fetching, setFetching] = useState(false);
    const [arrived, setArrived] = useState(0);
    const threadRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number>(undefined);
    const state = values.state as string;
    const jump = state === 'live' && Boolean(values.jump);

    useEffect(() => () => clearTimeout(timer.current), []);

    // Jump to latest: the reader scrolls back to read, then two replies arrive below them.
    useEffect(() => {
        if (!jump) {
            setArrived(0);
            return;
        }
        // The earlier history goes in first, so there is something to scroll back to.
        setHistory(earlier);
        const timers = [
            window.setTimeout(() => {
                if (threadRef.current) threadRef.current.scrollTop = 0;
            }, 150),
            ...arriving.map((_, i) => window.setTimeout(() => setArrived(i + 1), 700 + i * 600)),
        ];
        return () => timers.forEach(clearTimeout);
    }, [jump]);

    const loadEarlier = () => {
        if (history.length > 0 || jump) return;
        setFetching(true);
        timer.current = window.setTimeout(() => {
            setHistory(earlier);
            setFetching(false);
        }, 1200);
    };

    // Loading earlier shows the head of the thread, where its row is: the last exchange under it.
    const latest = [
        <ChatMessage key="m1" status="read" time="2:48 PM" variant="own">
            Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
        </ChatMessage>,
        <ChatAttachments key="m1-files" variant="own">
            <ChatAttachment name="Application.pdf" />
            <ChatAttachment name="Bank statement.png" src={sampleImage} variant="image" />
        </ChatAttachments>,
        values.divider ? <ChatUnreadDivider key="divider" /> : null,
        <ChatMessage key="m2" {...bot} time="2:48 PM">
            The payout is still processing; it should land within 24 hours.
        </ChatMessage>,
        state === 'earlier' ? null : (
            <ChatEvent key="event">System: Ticket assigned to @Joan</ChatEvent>
        ),
    ];

    return (
        <div className="flex w-full max-w-120 flex-col gap-3">
            <ChatThread
                className="h-64 w-full p-0"
                loading={state === 'loading'}
                loadingEarlier={state === 'earlier' || fetching}
                onReachStart={loadEarlier}
                ref={threadRef}
            >
                {history}
                {latest}
                {arriving.slice(0, arrived).map(text => (
                    <ChatMessage key={text} {...bot} time="2:52 PM">
                        {text}
                    </ChatMessage>
                ))}
                {sent.map(message => (
                    <ChatMessage
                        key={message.id}
                        onRetry={() => retry(message.id)}
                        status={message.status}
                        time="now"
                        variant="own"
                    >
                        {message.text}
                    </ChatMessage>
                ))}
                {values.writing && <ChatMessage key="writing" {...bot} pending />}
            </ChatThread>
            <ChatComposer
                disabled={state === 'loading'}
                onSend={send}
                placeholder="Write a message, Enter sends"
            />
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-thread',
    name: 'Chat thread',
    category: 'ai',
    description:
        'The scrolling column of a conversation: it loads, fetches earlier messages and follows new ones.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs,
    Preview: ChatThreadPreview,
};

/* ---------- In use: a live support ticket, the customer typing ---------- */

const eva = {
    author: 'Eva Tyrell',
    avatar: <Avatar fallback="ET" shape="round" size={24} />,
} as const;

// What Eva does after the page opens, in ms: types, sends, types again, sends.
const script: [number, string][] = [
    [1200, 'type'],
    [4200, 'Thanks! Will it show as Acme or as Tyrell & Co on my statement?'],
    [6200, 'type'],
    [9000, 'And could you send me the reference, for my bank?'],
];

// Read by the agent the ticket is assigned to, so their replies are the thread's own.
const SupportThread = () => {
    const [typing, setTyping] = useState(false);
    const [incoming, setIncoming] = useState<string[]>([]);
    const { sent, send, retry } = useSending();

    useEffect(() => {
        const timers = script.map(([at, step]) =>
            window.setTimeout(() => {
                if (step === 'type') return setTyping(true);
                setTyping(false);
                setIncoming(current => [...current, step]);
            }, at),
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <Card className="gap-0 p-0">
            <ChatThread className="h-80 w-full">
                <ChatMessage {...eva} time="2:48 PM">
                    Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
                </ChatMessage>
                <ChatReference
                    status={<Badge tone="warning">Pending</Badge>}
                    token="#inv_1CU2KZuPR5"
                >
                    Payout of €340.00
                </ChatReference>
                <ChatMessage
                    author="Support Bot"
                    avatar={<Avatar fallback="SB" shape="round" size={24} />}
                    badge={<Badge tone="primary">AI</Badge>}
                    time="2:49 PM"
                >
                    The payout left on 14 October; it usually lands within three working days.
                </ChatMessage>
                <ChatEvent time="2:50 PM">Ticket assigned to you</ChatEvent>
                <ChatMessage status="read" time="2:56 PM" variant="own">
                    Hi Eva, finance found it: the bank held it for a check. It lands tomorrow
                    morning.
                </ChatMessage>
                {incoming.map(text => (
                    <ChatMessage {...eva} key={text} time="now">
                        {text}
                    </ChatMessage>
                ))}
                {sent.map(message => (
                    <ChatMessage
                        key={message.id}
                        onRetry={() => retry(message.id)}
                        status={message.status}
                        time="now"
                        variant="own"
                    >
                        {message.text}
                    </ChatMessage>
                ))}
            </ChatThread>
            {/* The agent's reply box at the card's foot; Eva typing shows just above it. */}
            <div className="px-3 pb-3">
                <ChatComposer
                    onSend={send}
                    placeholder="Reply to Eva"
                    typing={<ChatTyping avatars names={typing ? ['Eva Tyrell'] : []} />}
                />
            </div>
        </Card>
    );
};

const TicketPage = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <UserRound {...icon} /> Reassign
                </Button>
                <Button>
                    <Check {...icon} /> Resolve
                </Button>
            </>
        }
        description={
            <span className="inline-flex items-center gap-2">
                Eva Tyrell at Tyrell & Co, opened today at 2:47 PM
                <Badge tone="warning">Waiting on finance</Badge>
            </span>
        }
        place="inbox"
        title="Payout not received"
        trail={['Inbox', '#4821']}
    >
        <SupportThread />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'A support ticket',
    note: 'The ticket’s live thread: the customer types and writes in, the agent replies below.',
    app: true,
    render: () => <TicketPage />,
};
