import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    ChatComposer,
    ChatEvent,
    ChatMessage,
    type ChatMessageStatus,
    ChatReference,
    ChatThread,
    ChatToken,
} from 'continuum';
import {
    ArrowLeft,
    CircleCheck,
    CircleDollarSign,
    ExternalLink,
    Loader,
    MessageCircleQuestion,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

const invoice = '#inv_1CU2KZuPR5J4329dVo3a7b';

type Entry =
    | {
          kind: 'own';
          id: number;
          text: string;
          time: string;
          dateTime: string;
          status: ChatMessageStatus;
      }
    | { kind: 'bot'; id: number; text: string; time: string }
    | { kind: 'agent'; id: number; text: string; time: string; dateTime: string }
    | { kind: 'reference'; id: number }
    | { kind: 'event'; id: number; text: string };

// Omit on a union would keep only the shared keys; mapping each member keeps them apart.
type NewEntry = Entry extends infer E ? (E extends Entry ? Omit<E, 'id'> : never) : never;

// The ticket as the design leaves it: answered by the bot, picked up by Joan and closed.
const history: Entry[] = [
    {
        kind: 'own',
        id: 1,
        text: 'invoice',
        time: '2:48 PM',
        dateTime: '2026-10-26T14:48',
        status: 'read',
    },
    { kind: 'reference', id: 2 },
    {
        kind: 'bot',
        id: 3,
        time: '2:48 PM',
        text: 'Hello, I’ve checked the system. The payout for invoice #1CU2KZuPR5J4329dVo3a7b is still processing. Estimated completion is within 24 hours. You will be notified once it’s complete.',
    },
    { kind: 'event', id: 4, text: 'System: Ticket assigned to @Joan' },
    {
        kind: 'agent',
        id: 5,
        time: '2:48 PM',
        dateTime: '2026-10-26T14:48',
        text: 'Hi! Thanks for the info. I see that payment is still processing on our side. I’ll follow up if there are any delays.',
    },
    {
        kind: 'own',
        id: 6,
        text: 'Got it, thanks!',
        time: '2:48 PM',
        dateTime: '2026-10-26T14:48',
        status: 'read',
    },
    { kind: 'event', id: 7, text: 'Joan has closed the ticket' },
];

const clock = () =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());

// Joan's answers, picked by what the message mentions, so the demo reads like a conversation.
const reply = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('payout') || lower.includes('paid') || lower.includes('money'))
        return 'I’ve asked our payments team to push it through. You should see the $40 within the hour.';
    if (lower.includes('thank'))
        return 'You’re welcome! I’ll leave the ticket open until the payout has landed.';
    return 'Thanks, I’ve added that to the ticket. Give me a few minutes to look into it.';
};

const joan = <Avatar alt="Joan" fallback="JV" shape="round" size={24} />;

/** The support widget from the payouts dashboard: one ticket's thread with a composer that reopens it. */
export const supportChatExample = () => <SupportChat />;

const SupportChat = () => {
    const [open, setOpen] = useState(true);
    const [closed, setClosed] = useState(true);
    const [entries, setEntries] = useState<Entry[]>(history);
    const nextId = useRef(history.length + 1);
    const timers = useRef<number[]>([]);

    useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

    const later = (ms: number, run: () => void) => {
        timers.current.push(window.setTimeout(run, ms));
    };

    // The id is taken outside the updater, which Strict Mode runs twice.
    const add = (entry: NewEntry) => {
        const id = nextId.current++;
        setEntries(current => [...current, { ...entry, id } as Entry]);
    };

    const setStatus = (id: number, status: ChatMessageStatus) =>
        setEntries(current =>
            current.map(entry =>
                entry.id === id && entry.kind === 'own' ? { ...entry, status } : entry,
            ),
        );

    const send = (text: string) => {
        // Writing into a closed ticket reopens it, the way a reply to a resolved email thread does.
        if (closed) {
            setClosed(false);
            add({ kind: 'event', text: 'You reopened the ticket' });
        }

        const id = nextId.current;
        add({
            kind: 'own',
            text,
            time: clock(),
            dateTime: new Date().toISOString(),
            status: 'sending',
        });
        // Walk the tick through its states, then let Joan answer.
        later(500, () => setStatus(id, 'delivered'));
        later(1400, () => setStatus(id, 'read'));
        later(2400, () =>
            add({
                kind: 'agent',
                text: reply(text),
                time: clock(),
                dateTime: new Date().toISOString(),
            }),
        );
    };

    if (!open) {
        return (
            <div className="flex h-[720px] w-full max-w-[440px] items-end justify-end">
                <Button onClick={() => setOpen(true)} size="lg">
                    <MessageCircleQuestion aria-hidden {...icon} />
                    Support
                </Button>
            </div>
        );
    }

    return (
        <section
            aria-labelledby="support-chat-title"
            className="flex h-[720px] w-full max-w-[440px] flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
        >
            {/* Header and ticket bar are one block the thread scrolls under, so a single hairline closes it. */}
            <header className="flex shrink-0 flex-col border-neutral-200 border-b">
                <div className="flex h-[52px] items-center justify-between gap-4 pr-[11px] pl-5">
                    <h2
                        className="min-w-0 truncate font-medium text-neutral-950 text-sm"
                        id="support-chat-title"
                    >
                        Support
                    </h2>
                    <div className="flex items-center gap-1">
                        <Button
                            aria-label="Open ticket in a new tab"
                            render={
                                // biome-ignore lint/a11y/useAnchorContent: the Button fills it with the icon and label.
                                <a
                                    href="#support/ID_0102_payment"
                                    rel="noreferrer"
                                    target="_blank"
                                />
                            }
                            size="icon-sm"
                            variant="ghost"
                        >
                            <ExternalLink aria-hidden {...icon} />
                        </Button>
                        <Button
                            aria-label="Close support"
                            onClick={() => setOpen(false)}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <X aria-hidden {...icon} />
                        </Button>
                    </div>
                </div>
                <div className="flex h-[48px] items-center gap-3 pr-4 pl-3">
                    <Button aria-label="Back to tickets" size="icon-sm" variant="ghost">
                        <ArrowLeft aria-hidden {...icon} />
                    </Button>
                    <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
                        {/* The ID gives way before the subject, which is what the reader scans the bar for. */}
                        <span className="min-w-8 truncate text-neutral-500 tabular-nums">
                            ID_0102_payment
                        </span>
                        <span aria-hidden className="text-neutral-500">
                            ·
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-medium text-neutral-950">
                            Payment issue
                        </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {closed ? (
                            <Badge icon={<CircleCheck {...icon} />} tone="neutral">
                                Closed
                            </Badge>
                        ) : (
                            <Badge icon={<Loader {...icon} />} tone="success">
                                Open
                            </Badge>
                        )}
                        <Badge icon={<CircleDollarSign {...icon} />} tone="neutral">
                            Payments
                        </Badge>
                    </div>
                    <AvatarStack aria-label="People on this ticket" className="shrink-0">
                        <Avatar alt="Mara Aydin" fallback="MA" shape="round" size={24} />
                        {joan}
                    </AvatarStack>
                </div>
            </header>

            <ChatThread
                className="flex-1"
                empty="No messages yet. Ask anything about your payouts."
            >
                {entries.map(entry => {
                    switch (entry.kind) {
                        case 'own':
                            return (
                                <ChatMessage
                                    dateTime={entry.dateTime}
                                    key={entry.id}
                                    status={entry.status}
                                    time={entry.time}
                                    variant="own"
                                >
                                    {entry.id === 1 ? (
                                        <>
                                            Hey, I didn’t receive my payout for{' '}
                                            <ChatToken>{invoice}</ChatToken>
                                        </>
                                    ) : (
                                        entry.text
                                    )}
                                </ChatMessage>
                            );
                        case 'reference':
                            return (
                                <ChatReference
                                    key={entry.id}
                                    status={
                                        <Badge icon={<Loader {...icon} />} tone="warning">
                                            Pending
                                        </Badge>
                                    }
                                    token={invoice}
                                >
                                    Amount due: $40
                                </ChatReference>
                            );
                        case 'bot':
                            return (
                                <ChatMessage
                                    author="@Support Bot"
                                    badge={<Badge tone="primary">AI</Badge>}
                                    key={entry.id}
                                    time={entry.time}
                                >
                                    {entry.text}
                                </ChatMessage>
                            );
                        case 'agent':
                            return (
                                <ChatMessage
                                    author="@Joan"
                                    avatar={joan}
                                    badge={<Badge tone="warning">Admin</Badge>}
                                    dateTime={entry.dateTime}
                                    key={entry.id}
                                    time={entry.time}
                                >
                                    {entry.text}
                                </ChatMessage>
                            );
                        default:
                            return <ChatEvent key={entry.id}>{entry.text}</ChatEvent>;
                    }
                })}
            </ChatThread>

            <div className="shrink-0 px-3 pb-3">
                <ChatComposer
                    label="Message #payment issue"
                    // What a payout ticket needs attaching is the invoice, so add drops its record in.
                    onAdd={() => add({ kind: 'reference' })}
                    onSend={send}
                    placeholder="Message #payment issue"
                />
            </div>
        </section>
    );
};
