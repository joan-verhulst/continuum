import {
    Avatar,
    Badge,
    Button,
    Card,
    ChatEvent,
    ChatMessage,
    ChatReference,
    ChatThread,
    ChatToken,
} from 'continuum';
import { Check, UserRound } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

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

// Read by the agent the ticket is assigned to, so their replies are the thread's own.
const SupportThread = () => (
    <Card className="gap-0 p-0">
        <ChatThread className="w-full">
            <ChatMessage
                author="Eva Tyrell"
                avatar={<Avatar fallback="ET" shape="round" size={24} />}
                time="2:48 PM"
            >
                Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
            </ChatMessage>
            <ChatReference status={<Badge tone="warning">Pending</Badge>} token="#inv_1CU2KZuPR5">
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
                Hi Eva, finance found it: the bank held it for a check. It lands tomorrow morning.
            </ChatMessage>
        </ChatThread>
    </Card>
);

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
    note: 'The ticket’s thread: the customer, the bot, a referenced payout and a system event.',
    app: true,
    render: () => <TicketPage />,
};
