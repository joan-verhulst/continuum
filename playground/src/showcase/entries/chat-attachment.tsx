import {
    Avatar,
    Badge,
    Card,
    ChatAttachment,
    ChatAttachments,
    ChatComposer,
    ChatMessage,
    ChatThread,
} from 'continuum';
import { useRef, useState } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    type Knob,
    o,
    type PreviewProps,
    sampleImage,
} from '../kit';

/* ---------- Preview: one attachment, as it waits above the composer ---------- */

const knobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: [o('file', 'File'), o('image', 'Image'), o('record', 'Record')],
        default: 'file',
    },
    {
        id: 'type',
        label: 'File type',
        options: [o('pdf', 'PDF'), o('other', 'Other')],
        default: 'pdf',
        when: values => values.variant === 'file',
    },
    {
        id: 'status',
        label: 'Status',
        options: [o('none', 'None'), o('review', 'In review'), o('passed', 'Passed')],
        default: 'review',
        when: values => values.variant === 'record',
    },
    { id: 'removable', label: 'Removable', switch: true, default: true },
];

const ChatAttachmentPreview = ({ knobs: values }: PreviewProps) => {
    const onRemove = values.removable ? () => {} : undefined;
    const variant = String(values.variant);

    return (
        <ChatAttachments className="w-full max-w-100 justify-center">
            {variant === 'record' ? (
                <ChatAttachment
                    name="Application"
                    onRemove={onRemove}
                    status={
                        values.status === 'review' ? (
                            <Badge tone="warning">In review</Badge>
                        ) : values.status === 'passed' ? (
                            <Badge tone="success">Passed</Badge>
                        ) : undefined
                    }
                    token="#app_1CU94h5MjxVV"
                    variant="record"
                />
            ) : variant === 'image' ? (
                <ChatAttachment
                    name="Bank statement.png"
                    onRemove={onRemove}
                    src={sampleImage}
                    variant="image"
                />
            ) : (
                <ChatAttachment
                    name={values.type === 'pdf' ? 'Application.pdf' : 'Payouts October.csv'}
                    onRemove={onRemove}
                />
            )}
        </ChatAttachments>
    );
};

export const entry: Entry = {
    id: 'chat-attachment',
    name: 'Chat attachment',
    category: 'ai',
    description:
        'A file, image or linked record going with a message: waiting above the composer, then under what was sent.',
    knobs,
    Preview: ChatAttachmentPreview,
};

/* ---------- In use: proof for a refund, picked and then sent ---------- */

type Item = { id: number; name: string; src?: string; record?: boolean };

const picked: Item[] = [
    { id: 1, name: 'Invoice', record: true },
    { id: 2, name: 'Card statement.pdf' },
    { id: 3, name: 'Screenshot.png', src: sampleImage },
];

const Attachment = ({ item, onRemove }: { item: Item; onRemove?: () => void }) =>
    item.record ? (
        <ChatAttachment
            name={item.name}
            onRemove={onRemove}
            status={<Badge tone="warning">Disputed</Badge>}
            token="#inv_1CU2KZuPR5"
            variant="record"
        />
    ) : (
        <ChatAttachment
            name={item.name}
            onRemove={onRemove}
            src={item.src}
            variant={item.src ? 'image' : 'file'}
        />
    );

const RefundThread = () => {
    const [waiting, setWaiting] = useState<Item[]>(picked);
    const [sent, setSent] = useState<{ id: number; text: string; items: Item[] }[]>([]);
    const next = useRef(10);
    const textRef = useRef<HTMLTextAreaElement>(null);

    return (
        <Card className="gap-0 p-0">
            <ChatThread className="h-52 w-full">
                <ChatMessage
                    author="Ines Duarte"
                    avatar={<Avatar fallback="ID" shape="round" size={24} />}
                    time="11:20 AM"
                >
                    Could you send the statement that shows the second charge?
                </ChatMessage>
                <ChatMessage status="read" time="11:24 AM" variant="own">
                    Here is last month’s, the charge is on page 2.
                </ChatMessage>
                <ChatAttachments variant="own">
                    <ChatAttachment name="Card statement October.pdf" />
                </ChatAttachments>
                {sent.flatMap(message => [
                    message.text ? (
                        <ChatMessage key={message.id} status="sent" time="now" variant="own">
                            {message.text}
                        </ChatMessage>
                    ) : null,
                    message.items.length > 0 ? (
                        <ChatAttachments key={`${message.id}-items`} variant="own">
                            {message.items.map(item => (
                                <Attachment item={item} key={item.id} />
                            ))}
                        </ChatAttachments>
                    ) : null,
                ])}
            </ChatThread>
            <div className="px-3 pb-3">
                <ChatComposer
                    attachments={
                        waiting.length > 0 ? (
                            <ChatAttachments>
                                {waiting.map(item => (
                                    <Attachment
                                        item={item}
                                        key={item.id}
                                        onRemove={() => {
                                            setWaiting(current =>
                                                current.filter(other => other.id !== item.id),
                                            );
                                            textRef.current?.focus();
                                        }}
                                    />
                                ))}
                            </ChatAttachments>
                        ) : undefined
                    }
                    defaultValue="And November’s, with the invoice it was for."
                    onAttach={files =>
                        setWaiting(current => [
                            ...current,
                            ...files.map(file => {
                                next.current += 1;
                                return {
                                    id: next.current,
                                    name: file.name,
                                    src: file.type.startsWith('image/')
                                        ? URL.createObjectURL(file)
                                        : undefined,
                                };
                            }),
                        ])
                    }
                    onSend={text => {
                        next.current += 1;
                        const id = next.current;
                        setSent(current => [...current, { id, text, items: waiting }]);
                        setWaiting([]);
                    }}
                    placeholder="Reply to Ines"
                    textareaRef={textRef}
                />
            </div>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Proof for a refund',
    note: 'What was sent hangs under its message; the invoice, a statement and a screenshot wait above the box until Enter sends them.',
    app: true,
    render: () => (
        <AppWindow
            description="Card charged twice for one invoice, opened by Joan Verhulst."
            place="inbox"
            title="Refund request"
            trail={['Inbox', '#4830']}
            width="default"
        >
            <RefundThread />
        </AppWindow>
    ),
};
