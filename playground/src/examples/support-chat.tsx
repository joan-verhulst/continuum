import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    ChatAttachment,
    ChatAttachments,
    ChatComposer,
    ChatComposerAttachItem,
    ChatEvent,
    ChatMessage,
    type ChatMessageStatus,
    ChatReference,
    ChatSuggestion,
    ChatSuggestions,
    ChatThread,
    ChatToken,
    DropdownMenuItem,
    useChatTrigger,
} from 'continuum';
import {
    CircleCheck,
    CircleDollarSign,
    FileClock,
    FileText,
    Loader,
    MessageCircleQuestion,
    ReceiptText,
    Sparkles,
    X,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

const invoice = '#inv_1CU2KZuPR5J4329dVo3a7b';

/** A record linked from the "+" menu: what it is, its token, one fact and its state. */
type Linked = {
    name: string;
    token: string;
    fact: string;
    status: { label: string; tone: 'warning' | 'success'; icon: ReactNode };
};

const records = {
    invoice: {
        name: 'Invoice',
        token: invoice,
        fact: 'Amount due: $40',
        status: { label: 'Pending', tone: 'warning', icon: <Loader {...icon} /> },
    },
    application: {
        name: 'Application',
        token: '#app_1CU94h5MjxVVgwapQ3vJxJ',
        fact: 'Creator programme',
        status: { label: 'In review', tone: 'warning', icon: <Loader {...icon} /> },
    },
    audit: {
        name: 'Audit',
        token: '#aud_7QX2mPa91LkR0sTe4bYw',
        fact: 'Payout audit, October',
        status: { label: 'Passed', tone: 'success', icon: <CircleCheck {...icon} /> },
    },
} satisfies Record<string, Linked>;

// The applications "#" offers, newest first.
const applications = [
    { token: '#app_1CU94h5MjxVVgwapQ3vJxJ', creator: 'Joan Verhulst' },
    { token: '#app_3Hk2Pq8WnLzAe7Ud0RfTgY', creator: 'Mara Aydin' },
    { token: '#app_7Rt5Vb2YcXmEq1Lo9NsKdH', creator: 'Liam Ortiz' },
    { token: '#app_9Fd4Gs6JhKwQz3Pi8MuBnC', creator: 'Noor Haddad' },
    { token: '#app_2Wq8Er4TyUiOp6As1DfGhJ', creator: 'Eva Tyrell' },
];

type Waiting = { id: number; file?: string; record?: Linked };

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
    | { kind: 'reference'; id: number; record: Linked }
    | { kind: 'files'; id: number; files: string[] }
    | { kind: 'event'; id: number; text: string };

const tokenPattern = /(#[a-z]+_\w+)/g;

/** The words with every "#app_…" drawn as a token. */
const withTokens = (text: string) =>
    text.split(tokenPattern).map((part, i) =>
        i % 2 === 1 ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one message never reorder
            <ChatToken key={i}>{part}</ChatToken>
        ) : (
            part
        ),
    );

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
    { kind: 'reference', id: 2, record: records.invoice },
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
    // What is attached or linked waits above the composer and goes out with the next message.
    const [waiting, setWaiting] = useState<Waiting[]>([]);
    const [draft, setDraft] = useState('');
    const trigger = useChatTrigger(draft);
    const nextId = useRef(history.length + 1);
    const timers = useRef<number[]>([]);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const toggled = useRef(false);

    useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

    // Closing and opening swap the whole tree, so focus is handed on rather than dropped to the body:
    // to the launcher once the widget closes, to the composer once it opens again.
    useEffect(() => {
        if (!toggled.current) return;
        toggled.current = false;
        (open ? composerRef.current : launcherRef.current)?.focus();
    }, [open]);

    const toggle = (next: boolean) => {
        toggled.current = true;
        setOpen(next);
    };

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
        if (text) {
            add({
                kind: 'own',
                text,
                time: clock(),
                dateTime: new Date().toISOString(),
                status: 'sending',
            });
        }
        const files = waiting.flatMap(item => (item.file ? [item.file] : []));
        if (files.length > 0) add({ kind: 'files', files });
        for (const item of waiting) {
            if (item.record) add({ kind: 'reference', record: item.record });
        }
        setWaiting([]);
        if (!text) return;
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

    const wait = (item: Omit<Waiting, 'id'>) => {
        const id = nextId.current++;
        setWaiting(current =>
            item.record && current.some(other => other.record?.token === item.record?.token)
                ? current
                : [...current, { ...item, id }],
        );
    };

    const query = trigger.query.toLowerCase();
    const matches = applications.filter(
        app => app.token.toLowerCase().includes(query) || app.creator.toLowerCase().includes(query),
    );

    if (!open) {
        return (
            <div className="flex h-180 w-full max-w-110 items-end justify-end">
                <Button onClick={() => toggle(true)} ref={launcherRef} size="lg">
                    <MessageCircleQuestion aria-hidden {...icon} />
                    Support
                </Button>
            </div>
        );
    }

    return (
        <section
            aria-labelledby="support-chat-title"
            className="flex h-180 w-full max-w-110 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
        >
            {/* Header and ticket bar are one block the thread scrolls under, so a single hairline closes it. */}
            <header className="flex shrink-0 flex-col border-neutral-200 border-b">
                <div className="flex h-13 items-center justify-between gap-4 pr-2.75 pl-5">
                    <h2
                        className="min-w-0 truncate font-medium text-neutral-950 text-sm"
                        id="support-chat-title"
                    >
                        Support
                    </h2>
                    {/* No ticket list or ticket page stands behind the demo, so only the close is offered. */}
                    <Button
                        aria-label="Close support"
                        onClick={() => toggle(false)}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <X aria-hidden {...icon} />
                    </Button>
                </div>
                <div className="flex h-12 items-center gap-3 pr-4 pl-5">
                    <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
                        {/* The ID gives way before the subject, which is what the reader scans the bar for. */}
                        <span className="min-w-8 truncate text-neutral-600 tabular-nums">
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
                                        withTokens(entry.text)
                                    )}
                                </ChatMessage>
                            );
                        case 'reference':
                            return (
                                <ChatReference
                                    key={entry.id}
                                    status={
                                        <Badge
                                            icon={entry.record.status.icon}
                                            tone={entry.record.status.tone}
                                        >
                                            {entry.record.status.label}
                                        </Badge>
                                    }
                                    token={entry.record.token}
                                >
                                    {entry.record.fact}
                                </ChatReference>
                            );
                        case 'files':
                            return (
                                <ChatAttachments align="end" key={entry.id}>
                                    {entry.files.map(file => (
                                        <ChatAttachment key={file} name={file} />
                                    ))}
                                </ChatAttachments>
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
                    accept="image/*,.pdf"
                    // What a payout ticket needs is the invoice, the application or the audit: the "+"
                    // links one, and it waits above the box until the message goes.
                    attachMenu={
                        <>
                            <ChatComposerAttachItem />
                            <DropdownMenuItem onClick={() => wait({ record: records.invoice })}>
                                <ReceiptText {...icon} /> Link invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => wait({ record: records.application })}>
                                <FileText {...icon} /> Link application
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => wait({ record: records.audit })}>
                                <FileClock {...icon} /> Link audit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setDraft(current =>
                                        current.startsWith('@Support Bot')
                                            ? current
                                            : `@Support Bot ${current}`,
                                    )
                                }
                            >
                                <Sparkles {...icon} /> Ask the assistant
                            </DropdownMenuItem>
                        </>
                    }
                    attachments={
                        waiting.length > 0 ? (
                            <ChatAttachments>
                                {waiting.map(item => {
                                    const remove = () => {
                                        setWaiting(current =>
                                            current.filter(other => other.id !== item.id),
                                        );
                                        composerRef.current?.focus();
                                    };
                                    return item.record ? (
                                        <ChatAttachment
                                            key={item.id}
                                            name={item.record.name}
                                            onRemove={remove}
                                            removeLabel={`Remove ${item.record.name.toLowerCase()}`}
                                            status={
                                                <Badge
                                                    icon={item.record.status.icon}
                                                    tone={item.record.status.tone}
                                                >
                                                    {item.record.status.label}
                                                </Badge>
                                            }
                                            token={item.record.token}
                                            variant="record"
                                        />
                                    ) : (
                                        <ChatAttachment
                                            key={item.id}
                                            name={item.file ?? ''}
                                            onRemove={remove}
                                        />
                                    );
                                })}
                            </ChatAttachments>
                        ) : undefined
                    }
                    label="Message #payment issue"
                    onAttach={files => {
                        for (const file of files) wait({ file: file.name });
                    }}
                    onSend={send}
                    onSuggestionsClose={trigger.dismiss}
                    onValueChange={setDraft}
                    placeholder="Message #payment issue, # for an application"
                    suggestions={
                        trigger.open ? (
                            <ChatSuggestions
                                empty="No applications match"
                                title="Recent applications"
                            >
                                {matches.map(app => (
                                    <ChatSuggestion
                                        key={app.token}
                                        leading={<FileText {...icon} />}
                                        meta={app.creator}
                                        onSelect={() => setDraft(trigger.insert(app.token))}
                                    >
                                        {app.token}
                                    </ChatSuggestion>
                                ))}
                            </ChatSuggestions>
                        ) : undefined
                    }
                    textareaRef={composerRef}
                    value={draft}
                />
            </div>
        </section>
    );
};
