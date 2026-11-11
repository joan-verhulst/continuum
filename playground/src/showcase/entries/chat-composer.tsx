import {
    Badge,
    BarList,
    BarListItem,
    Button,
    Card,
    ChatAttachment,
    ChatAttachments,
    ChatComposer,
    ChatComposerAttachItem,
    ChatMessage,
    ChatSuggestion,
    ChatSuggestions,
    ChatThread,
    ChatToken,
    DropdownMenuItem,
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    StatCard,
    useChatTrigger,
} from 'continuum';
import { FileClock, FileText, ReceiptText, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    sampleImage,
} from '../kit';

type Attached = {
    id: number;
    name: string;
    src?: string;
    /** A linked record rather than a file. */
    token?: string;
    status?: { label: string; tone: 'warning' | 'success' | 'neutral' };
};

// The records the menu links and the "#" suggestions offer.
const records = {
    invoice: {
        name: 'Invoice',
        token: '#inv_1CU2KZuPR5',
        status: { label: 'Pending', tone: 'warning' },
    },
    application: {
        name: 'Application',
        token: '#app_1CU94h5MjxVV',
        status: { label: 'In review', tone: 'warning' },
    },
    audit: {
        name: 'Audit',
        token: '#aud_7QX2mPa91Lk',
        status: { label: 'Passed', tone: 'success' },
    },
} satisfies Record<string, Omit<Attached, 'id'>>;

const applications = [
    { token: '#app_1CU94h5MjxVV', creator: 'Maya Chen' },
    { token: '#app_3Hk2Pq8WnLzA', creator: 'Liam Ortiz' },
    { token: '#app_7Rt5Vb2YcXmE', creator: 'Noor Haddad' },
    { token: '#app_9Fd4Gs6JhKwQ', creator: 'Eva Tyrell' },
];

const presets: Record<string, Omit<Attached, 'id'>[]> = {
    none: [],
    file: [{ name: 'Application.pdf' }],
    both: [{ name: 'Application.pdf' }, { name: 'Bank statement.png', src: sampleImage }],
    record: [records.application],
};

const knobs: Knob[] = [
    {
        id: 'plus',
        label: 'Plus',
        options: [o('picker', 'File picker'), o('menu', 'Menu')],
        default: 'menu',
    },
    {
        id: 'attachments',
        label: 'Picked',
        options: [
            o('none', 'None'),
            o('file', 'File'),
            o('both', 'File + image'),
            o('record', 'Record'),
        ],
        default: 'none',
    },
    {
        id: 'suggestions',
        label: 'Suggestions',
        options: [o('off', 'Off'), o('live', '“#” live')],
        default: 'off',
    },
];

const isImage = (file: File) => file.type.startsWith('image/');

const tokenPattern = /(#[a-z]+_\w+)/g;

/** The sent words with every "#app_…" drawn as a token. */
const withTokens = (text: string) =>
    text.split(tokenPattern).map((part, i) =>
        i % 2 === 1 ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one message never reorder
            <ChatToken key={i}>{part}</ChatToken>
        ) : (
            part
        ),
    );

const Picked = ({ file, onRemove }: { file: Attached; onRemove?: () => void }) =>
    file.token ? (
        <ChatAttachment
            name={file.name}
            onRemove={onRemove}
            removeLabel={`Remove ${file.name} ${file.token}`}
            status={file.status && <Badge tone={file.status.tone}>{file.status.label}</Badge>}
            token={file.token}
            variant="record"
        />
    ) : (
        <ChatAttachment
            name={file.name}
            onRemove={onRemove}
            src={file.src}
            variant={file.src ? 'image' : 'file'}
        />
    );

/**
 * Attach from the "+" (the picker or its menu), link records, reference an application by "#",
 * remove, send: what waited goes under the sent message.
 */
const Composer = ({ plus, preset, live }: { plus: string; preset: string; live: boolean }) => {
    const next = useRef(0);
    const make = (file: Omit<Attached, 'id'>): Attached => {
        next.current += 1;
        return { ...file, id: next.current };
    };
    const [waiting, setWaiting] = useState<Attached[]>(() => (presets[preset] ?? []).map(make));
    const [sent, setSent] = useState<{ id: number; text: string; files: Attached[] }[]>([]);
    const [draft, setDraft] = useState(live ? 'Also, I noticed #a' : '');
    const trigger = useChatTrigger(draft);
    const textRef = useRef<HTMLTextAreaElement>(null);

    // Object URLs for picked images are let go once the preview closes.
    const urls = useRef<string[]>([]);
    useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

    const attach = (files: File[]) =>
        setWaiting(current => [
            ...current,
            ...files.map(file => {
                const src = isImage(file) ? URL.createObjectURL(file) : undefined;
                if (src) urls.current.push(src);
                return make({ name: file.name, src });
            }),
        ]);

    const link = (record: Omit<Attached, 'id'>) =>
        setWaiting(current =>
            current.some(other => other.token === record.token)
                ? current
                : [...current, make(record)],
        );

    const query = trigger.query.toLowerCase();
    const matches = applications.filter(
        app => app.token.toLowerCase().includes(query) || app.creator.toLowerCase().includes(query),
    );

    return (
        <div className="flex w-full max-w-120 flex-col gap-3">
            {sent.length > 0 && (
                <ChatThread className="max-h-72 w-full p-0">
                    {sent.flatMap(message => [
                        message.text ? (
                            <ChatMessage key={message.id} status="sent" time="now" variant="own">
                                {withTokens(message.text)}
                            </ChatMessage>
                        ) : null,
                        message.files.length > 0 ? (
                            <ChatAttachments align="end" key={`${message.id}-files`}>
                                {message.files.map(file => (
                                    <Picked file={file} key={file.id} />
                                ))}
                            </ChatAttachments>
                        ) : null,
                    ])}
                </ChatThread>
            )}
            <ChatComposer
                accept="image/*,.pdf,.csv,.xlsx,.docx,.txt"
                attachMenu={
                    plus === 'menu' ? (
                        <>
                            <ChatComposerAttachItem />
                            <DropdownMenuItem onClick={() => link(records.invoice)}>
                                <ReceiptText {...icon} /> Link invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => link(records.application)}>
                                <FileText {...icon} /> Link application
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => link(records.audit)}>
                                <FileClock {...icon} /> Link audit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setDraft(current =>
                                        current.startsWith('@Assistant')
                                            ? current
                                            : `@Assistant ${current}`,
                                    )
                                }
                            >
                                <Sparkles {...icon} /> Ask the assistant
                            </DropdownMenuItem>
                        </>
                    ) : undefined
                }
                attachments={
                    waiting.length > 0 ? (
                        <ChatAttachments>
                            {waiting.map(file => (
                                <Picked
                                    file={file}
                                    key={file.id}
                                    onRemove={() => {
                                        setWaiting(current =>
                                            current.filter(other => other.id !== file.id),
                                        );
                                        textRef.current?.focus();
                                    }}
                                />
                            ))}
                        </ChatAttachments>
                    ) : undefined
                }
                onAttach={attach}
                onSend={text => {
                    next.current += 1;
                    const id = next.current;
                    setSent(current => [...current, { id, text, files: waiting }]);
                    setWaiting([]);
                }}
                onSuggestionsClose={trigger.dismiss}
                onValueChange={setDraft}
                placeholder="Message #payment issue"
                suggestions={
                    trigger.open ? (
                        <ChatSuggestions empty="No applications match" title="Recent applications">
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
                textareaRef={textRef}
                value={draft}
            />
        </div>
    );
};

const ChatComposerPreview = ({ knobs: values }: PreviewProps) => {
    const plus = String(values.plus);
    const preset = String(values.attachments);
    const live = values.suggestions === 'live';
    // A new setting starts the demo over with its files waiting.
    return <Composer key={`${plus}-${preset}-${live}`} live={live} plus={plus} preset={preset} />;
};

export const entry: Entry = {
    id: 'chat-composer',
    name: 'Chat composer',
    category: 'ai',
    description:
        'A box that grows with the draft; the “+” opens a menu, what is picked waits above it, “#” suggests records.',
    knobs,
    Preview: ChatComposerPreview,
};

// The assistant's answer to whatever is asked: the demo has one, written after a short think.
const answer =
    'Most of the rise came from the new pricing page: its visitors left 9 points more often than the rest of the site.';

type Turn = { id: number; own: boolean; text: string; files?: Attached[] };

const AskSheet = () => {
    const stage = useStageContainer();
    const [turns, setTurns] = useState<Turn[]>([]);
    const [thinking, setThinking] = useState(false);
    // What the "+" picked waits in the draft, above the box, until the question is sent.
    const [waiting, setWaiting] = useState<Attached[]>([]);
    const timer = useRef<number>(undefined);
    const next = useRef(0);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const urls = useRef<string[]>([]);

    useEffect(
        () => () => {
            clearTimeout(timer.current);
            urls.current.forEach(URL.revokeObjectURL);
        },
        [],
    );

    const add = (own: boolean, text: string, files?: Attached[]) => {
        next.current += 1;
        const id = next.current;
        setTurns(current => [...current, { id, own, text, files }]);
    };

    const attach = (files: File[]) =>
        setWaiting(current => [
            ...current,
            ...files.map(file => {
                next.current += 1;
                const src = isImage(file) ? URL.createObjectURL(file) : undefined;
                if (src) urls.current.push(src);
                return { id: next.current, name: file.name, src };
            }),
        ]);

    const ask = (text: string) => {
        add(true, text, waiting);
        setWaiting([]);
        setThinking(true);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            setThinking(false);
            add(false, answer);
        }, 1800);
    };

    return (
        <Sheet open>
            <SheetContent
                className="w-[min(400px,calc(100%-32px))]"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <SheetHeader icon={<Sparkles />}>
                    <SheetTitle>Ask about Q3 review</SheetTitle>
                </SheetHeader>
                <ChatThread className="flex-1 px-5 pt-5">
                    <ChatMessage
                        author="Assistant"
                        badge={<Badge tone="primary">AI</Badge>}
                        time="3:02 PM"
                    >
                        I have read the report and its four charts. Ask what changed in Q3, why, or
                        what to look at next.
                    </ChatMessage>
                    <ChatMessage status="read" time="3:03 PM" variant="own">
                        Which customers grew the most?
                    </ChatMessage>
                    <ChatMessage
                        author="Assistant"
                        badge={<Badge tone="primary">AI</Badge>}
                        time="3:03 PM"
                    >
                        Northwind Traders, up €1,600 a month after moving to Enterprise, then
                        Umbrella Health and Soylent Labs.
                    </ChatMessage>
                    {turns.flatMap(turn =>
                        turn.own ? (
                            [
                                turn.text ? (
                                    <ChatMessage
                                        key={turn.id}
                                        status="read"
                                        time="now"
                                        variant="own"
                                    >
                                        {turn.text}
                                    </ChatMessage>
                                ) : null,
                                turn.files?.length ? (
                                    <ChatAttachments align="end" key={`${turn.id}-files`}>
                                        {turn.files.map(file => (
                                            <Picked file={file} key={file.id} />
                                        ))}
                                    </ChatAttachments>
                                ) : null,
                            ]
                        ) : (
                            <ChatMessage
                                author="Assistant"
                                badge={<Badge tone="primary">AI</Badge>}
                                key={turn.id}
                                time="now"
                            >
                                {turn.text}
                            </ChatMessage>
                        ),
                    )}
                    {thinking && (
                        <ChatMessage
                            author="Assistant"
                            badge={<Badge tone="primary">AI</Badge>}
                            key="thinking"
                            pending
                        />
                    )}
                </ChatThread>
                {/* The composer's own row at the foot, ruled off the thread edge to edge. */}
                <div className="shrink-0 border-neutral-200 border-t p-3">
                    <ChatComposer
                        accept="image/*,.pdf,.csv,.xlsx,.docx,.txt"
                        attachments={
                            waiting.length > 0 ? (
                                <ChatAttachments>
                                    {waiting.map(file => (
                                        <Picked
                                            file={file}
                                            key={file.id}
                                            onRemove={() => {
                                                setWaiting(current =>
                                                    current.filter(other => other.id !== file.id),
                                                );
                                                textRef.current?.focus();
                                            }}
                                        />
                                    ))}
                                </ChatAttachments>
                            ) : undefined
                        }
                        defaultValue="Why did the bounce rate rise in August?"
                        onAttach={attach}
                        onSend={ask}
                        placeholder="Ask about this report"
                        textareaRef={textRef}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export const inUse: InUse = {
    title: 'Ask about a report',
    note: 'The composer at the foot of the assistant’s sheet, with a question drafted; the answer is written after a pending reply.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'rail',
                place: 'reports',
                title: 'Q3 review',
                description: 'Shared by Maya Chen, 1 July to 30 September.',
                actions: (
                    <Button variant="secondary">
                        <Sparkles {...icon} /> Ask
                    </Button>
                ),
                // The report keeps to the left of the open sheet, as it would beside it.
                className: 'pr-109',
                children: (
                    <>
                        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                            <StatCard delta="+17.1%" label="Recurring revenue" value="€48,260" />
                            <StatCard
                                delta="+0.6 pt"
                                label="Bounce rate"
                                trend="down"
                                value="41.8%"
                            />
                        </div>
                        <Card layout="list">
                            <BarList title="Growth by customer" valueLabel="A month">
                                <BarListItem displayValue="+€1,600" value={1600}>
                                    Northwind Traders
                                </BarListItem>
                                <BarListItem displayValue="+€900" value={900}>
                                    Umbrella Health
                                </BarListItem>
                                <BarListItem displayValue="+€420" value={420}>
                                    Soylent Labs
                                </BarListItem>
                                <BarListItem displayValue="+€260" value={260}>
                                    Globex
                                </BarListItem>
                            </BarList>
                        </Card>
                    </>
                ),
            }}
        >
            <AskSheet />
        </AppScene>
    ),
};
