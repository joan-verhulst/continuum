import {
    Avatar,
    Badge,
    Card,
    ChatComposer,
    ChatEvent,
    ChatMessage,
    type ChatMessageStatus,
    ChatThread,
    ChatToken,
    StatCard,
} from 'continuum';
import { useEffect, useRef, useState } from 'react';
import {
    AppScene,
    type Entry,
    type InUse,
    type Knob,
    o,
    type PreviewProps,
    useSending,
} from '../kit';

/* ---------- Preview: one message, its side, its people and its delivery ---------- */

const own = (values: PreviewProps['knobs']) => values.variant === 'own';

const knobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: [o('other', 'Other'), o('own', 'Own')],
        default: 'other',
    },
    {
        id: 'status',
        label: 'Status',
        options: [
            o('sending', 'Sending'),
            o('sent', 'Sent'),
            o('delivered', 'Delivered'),
            o('read', 'Read'),
            o('failed', 'Failed'),
        ],
        default: 'read',
        when: own,
    },
    {
        id: 'retry',
        label: 'Retry',
        switch: true,
        default: true,
        when: values => own(values) && values.status === 'failed',
    },
    {
        id: 'author',
        label: 'Author',
        options: [o('none', 'None'), o('name', 'Name'), o('badge', 'Name + badge')],
        default: 'badge',
        when: values => !own(values),
    },
    {
        id: 'avatar',
        label: 'Avatar',
        switch: true,
        default: true,
        when: values => !own(values),
    },
    {
        id: 'pending',
        label: 'Pending',
        options: [o('off', 'Off'), o('thinking', 'Thinking'), o('streaming', 'Streaming')],
        default: 'off',
        when: values => !own(values),
    },
    {
        id: 'long',
        label: 'Long content',
        switch: true,
        default: false,
        when: values => own(values) || values.pending !== 'thinking',
    },
    { id: 'event', label: 'System event', switch: true, default: false },
];

// No spaces to break at: the bubble has to wrap it anywhere rather than widen.
const longRun = '😂'.repeat(40);

const ChatMessagePreview = ({ knobs: values }: PreviewProps) => {
    const isOwn = own(values);
    const long = Boolean(values.long);
    const pending = isOwn ? 'off' : String(values.pending);
    const author = String(values.author);

    const words = isOwn ? (
        long ? (
            <>
                Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>. The bank
                says nothing came in on the 14th or since, and the dashboard still shows it as paid
                out. {longRun}
            </>
        ) : (
            <>
                Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
            </>
        )
    ) : pending === 'streaming' ? (
        'The payout left on 14 October and'
    ) : long ? (
        `Here is what I found: ${longRun} ref_1CU2KZuPR5J4329dVo3a7bQx81LmZpT0wYv6`
    ) : (
        'The payout is still processing; it should land within 24 hours.'
    );

    return (
        <div className="flex w-full max-w-120 flex-col gap-3">
            {isOwn ? (
                <ChatMessage
                    onRetry={values.retry ? () => {} : undefined}
                    status={values.status as ChatMessageStatus}
                    time="2:48 PM"
                    variant="own"
                >
                    {words}
                </ChatMessage>
            ) : (
                <ChatMessage
                    author={author === 'none' ? undefined : '@Support Bot'}
                    avatar={
                        values.avatar ? <Avatar fallback="SB" shape="round" size={24} /> : undefined
                    }
                    badge={author === 'badge' ? <Badge tone="primary">AI</Badge> : undefined}
                    pending={pending !== 'off'}
                    time={pending === 'off' ? '2:48 PM' : undefined}
                >
                    {pending === 'thinking' ? undefined : words}
                </ChatMessage>
            )}
            {values.event && <ChatEvent time="2:50 PM">Ticket assigned to Joan</ChatEvent>}
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-message',
    name: 'Chat message',
    category: 'ai',
    description:
        'One message: one’s own on the tint with its delivery tick, others’ as a card with who wrote it.',
    knobs,
    Preview: ChatMessagePreview,
};

/* ---------- In use: the help panel over the invoices, a short exchange with support ---------- */

const bot = {
    author: 'Acme Assistant',
    avatar: <Avatar fallback="AA" shape="round" size={24} />,
    badge: <Badge tone="primary">AI</Badge>,
} as const;

const ines = {
    author: 'Ines Duarte',
    avatar: <Avatar fallback="ID" shape="round" size={24} />,
} as const;

const reply = 'Done: the receipt is on its way to joan@acme.com.';

const HelpPanel = () => {
    // The last message dropped with the connection; Retry sends it, then Ines answers.
    const [status, setStatus] = useState<ChatMessageStatus>('failed');
    const [answer, setAnswer] = useState<'none' | 'writing' | 'done'>('none');
    const { sent, send, retry } = useSending();
    const timers = useRef<number[]>([]);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const resend = () => {
        const steps: [number, () => void][] = [
            [0, () => setStatus('sending')],
            [500, () => setStatus('sent')],
            [1100, () => setStatus('delivered')],
            [1800, () => setStatus('read')],
            [2200, () => setAnswer('writing')],
            [3800, () => setAnswer('done')],
        ];
        for (const [at, step] of steps) timers.current.push(window.setTimeout(step, at));
    };

    return (
        <Card className="absolute right-6 bottom-6 z-10 h-110 w-96 gap-0 p-0 shadow-float">
            <div className="flex h-12 shrink-0 items-center border-neutral-200 border-b px-4 font-medium text-neutral-950 text-xs">
                Billing support
            </div>
            <ChatThread className="flex-1">
                <ChatMessage {...bot} time="9:12 AM">
                    Hi Joan, what can I help you with?
                </ChatMessage>
                <ChatMessage status="read" time="9:13 AM" variant="own">
                    <ChatToken>#inv_1CU2KZuPR5</ChatToken> shows twice on my card statement.
                </ChatMessage>
                <ChatMessage {...ines} time="9:15 AM">
                    Sorry for the scare. The second line is a hold, not a charge; it drops off
                    within five days.
                </ChatMessage>
                <ChatMessage onRetry={resend} status={status} time="9:16 AM" variant="own">
                    Thanks. Could you email me the receipt?
                </ChatMessage>
                {answer === 'writing' && <ChatMessage key="writing" {...ines} pending />}
                {answer === 'done' && (
                    <ChatMessage key="answer" {...ines} time="now">
                        {reply}
                    </ChatMessage>
                )}
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
            <div className="px-3 pb-3">
                <ChatComposer onSend={send} placeholder="Reply to Ines" />
            </div>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Help with an invoice',
    note: 'Support’s panel over the invoices: the bot, an agent and the customer, whose last message did not go; Retry sends it.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                place: 'invoices',
                title: 'Invoices',
                description: 'What Acme billed you, and what is still open.',
                trail: ['Invoices'],
                children: (
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="Open" value="€1,240.00" />
                        <StatCard label="Paid this year" value="€14,880.00" />
                        <StatCard label="Next invoice" value="1 Dec" />
                    </div>
                ),
            }}
        >
            <HelpPanel />
        </AppScene>
    ),
};
