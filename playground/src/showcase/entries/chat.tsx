import {
    Avatar,
    Badge,
    Card,
    ChatEvent,
    ChatMessage,
    ChatReference,
    ChatThread,
    ChatToken,
} from 'continuum';
import type { Entry, InUse } from '../kit';

const ChatPreview = () => (
    <ChatThread className="h-64 w-full p-0">
        <ChatMessage status="read" time="2:48 PM" variant="own">
            Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
        </ChatMessage>
        <ChatMessage author="@Support Bot" badge={<Badge tone="primary">AI</Badge>} time="2:48 PM">
            The payout is still processing; it should land within 24 hours.
        </ChatMessage>
        <ChatEvent>System: Ticket assigned to @Joan</ChatEvent>
    </ChatThread>
);

export const entry: Entry = {
    id: 'chat',
    name: 'Chat thread',
    category: 'ai',
    description: 'Messages, system events and tokens in a support thread.',
    span: 2,
    stageClassName: 'items-stretch',
    Preview: ChatPreview,
};

const SupportThread = () => (
    <Card className="w-full max-w-lg gap-0 p-0">
        <ChatThread className="h-[340px] w-full px-4 pt-4">
            <ChatMessage status="read" time="2:48 PM" variant="own">
                Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
            </ChatMessage>
            <ChatReference status={<Badge tone="warning">Pending</Badge>} token="#inv_1CU2KZuPR5">
                Payout of €340.00
            </ChatReference>
            <ChatMessage
                author="@Support Bot"
                avatar={<Avatar fallback="SB" shape="round" size={24} />}
                badge={<Badge tone="primary">AI</Badge>}
                time="2:49 PM"
            >
                The payout left on 14 October and usually lands within three working days. I have
                flagged it for the finance team as well.
            </ChatMessage>
            <ChatEvent>Ticket assigned to Lena</ChatEvent>
            <ChatMessage status="delivered" time="2:51 PM" variant="own">
                Thanks, I’ll wait for Lena.
            </ChatMessage>
        </ChatThread>
    </Card>
);

export const inUse: InUse = {
    title: 'Support thread',
    note: 'Own and other messages, a referenced record and a system event.',
    canvas: true,
    render: () => <SupportThread />,
};
