import { Avatar, Badge, Card, ChatMessage, ChatReference, ChatThread, ChatToken } from 'continuum';
import { AppWindow, type Entry, type InUse, type Knob, o, opts, type PreviewProps } from '../kit';

/* ---------- Preview: a token in the words, and the record it names dropped in under them ---------- */

const knobs: Knob[] = [
    { id: 'tone', label: 'Token tone', options: opts('primary', 'neutral'), default: 'primary' },
    { id: 'fact', label: 'Fact', switch: true, default: true },
    {
        id: 'status',
        label: 'Status',
        options: [o('none', 'None'), o('pending', 'Pending'), o('paid', 'Paid')],
        default: 'pending',
    },
];

const ChatReferencePreview = ({ knobs: values }: PreviewProps) => {
    const tone = values.tone as 'primary' | 'neutral';
    const status =
        values.status === 'pending' ? (
            <Badge tone="warning">Pending</Badge>
        ) : values.status === 'paid' ? (
            <Badge tone="success">Paid</Badge>
        ) : undefined;

    return (
        <div className="flex w-full max-w-100 flex-col gap-3">
            <ChatMessage status="read" time="2:48 PM" variant="own">
                Hey, I didn’t receive my payout for{' '}
                <ChatToken tone={tone}>#inv_1CU2KZuPR5</ChatToken>
            </ChatMessage>
            <ChatReference status={status} token="#inv_1CU2KZuPR5">
                {values.fact ? 'Payout of €340.00' : undefined}
            </ChatReference>
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-reference',
    name: 'Chat reference',
    category: 'ai',
    description:
        'An id as a mono chip in the words, and the record it names dropped into the thread with a fact and its status.',
    knobs,
    Preview: ChatReferencePreview,
};

/* ---------- In use: the agent answers with the records it found, each one opening ---------- */

const assistant = {
    author: 'Agent',
    avatar: <Avatar fallback="AG" shape="round" size={24} />,
    badge: <Badge tone="primary">AI</Badge>,
} as const;

const overdue = [
    { token: '#inv_7QX2mPa91L', fact: '€1,600.00', days: '12 days late' },
    { token: '#inv_3Hk2Pq8WnZ', fact: '€420.00', days: '5 days late' },
    { token: '#inv_9Fd4Gs6JhK', fact: '€260.00', days: '2 days late' },
];

const AgentPage = () => (
    <AppWindow
        description="Ask about customers, invoices and reports; it answers from your workspace."
        place="agent"
        title="Agent"
        trail={['Agent']}
        width="narrow"
    >
        <Card className="gap-0 p-0">
            <ChatThread className="w-full">
                <ChatMessage status="read" time="10:02 AM" variant="own">
                    Which invoices are overdue?
                </ChatMessage>
                <ChatMessage {...assistant} time="10:02 AM">
                    Three, €2,280.00 in all. Northwind’s <ChatToken>#inv_7QX2mPa91L</ChatToken> is
                    the oldest.
                </ChatMessage>
                {overdue.map(invoice => (
                    <ChatReference
                        key={invoice.token}
                        // biome-ignore lint/a11y/useAnchorContent: the reference fills the link with its token, fact and status.
                        render={<a href="#invoices" />}
                        status={<Badge tone="error">{invoice.days}</Badge>}
                        token={invoice.token}
                    >
                        {invoice.fact}
                    </ChatReference>
                ))}
                <ChatMessage {...assistant} time="10:02 AM">
                    Shall I send each customer a reminder?
                </ChatMessage>
            </ChatThread>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Overdue invoices',
    note: 'The agent names the invoices in its answer and drops each in as a reference that opens it.',
    app: true,
    render: () => <AgentPage />,
};
