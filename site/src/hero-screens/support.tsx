import {
    Avatar,
    Badge,
    Button,
    ChatComposer,
    ChatEvent,
    ChatMessage,
    ChatReference,
    ChatThread,
    ChatToken,
    Chip,
    Meter,
    SheetSection,
} from 'continuum';
import { CircleCheck, Clock, Ellipsis, Mail, MapPin, Paperclip, UserRound, X } from 'lucide-react';
import { Frame, icon, Person } from './shell';

/*
 * Support: one conversation, with the customer's details read beside it. The thread is the page;
 * the details are a sheet (non-modal, the page still usable), drawn in place so the picture holds
 * still. A customer writes about a double charge, the agent finds it, an internal note goes to
 * billing, and a reply is being drafted in the composer.
 */

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-neutral-600 text-xs">{label}</span>
        <span className="truncate font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </div>
);

const history = [
    { token: '#4790', subject: 'SSO for the Lisbon office', status: 'Resolved', tone: 'success' },
    { token: '#4712', subject: 'Export to NetSuite fails', status: 'Resolved', tone: 'success' },
    { token: '#4655', subject: 'Seat pricing question', status: 'Closed', tone: 'neutral' },
] as const;

/** The customer, read beside the thread: who they are, what they pay, what they asked before. */
const CustomerSheet = () => (
    <aside
        aria-label="Customer"
        className="absolute top-4 right-4 bottom-4 flex w-80 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 shadow-sheet"
        data-slot="sheet-content"
    >
        <div className="flex h-bar shrink-0 items-center gap-2 border-neutral-200 border-b pr-1.5 pl-4">
            <UserRound className="size-4 shrink-0 text-neutral-950" {...icon} />
            <h2 className="min-w-0 flex-1 truncate font-medium text-neutral-950 text-sm">
                Customer
            </h2>
            <Button aria-label="Close" className="size-option" size="icon" variant="ghost">
                <X {...icon} />
            </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
            <SheetSection className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Person initials="EB" size={36} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium text-neutral-950 text-xs">
                            Elena Brandt
                        </span>
                        <span className="truncate text-neutral-600 text-xxs">
                            Head of Finance, Umbrella Health
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-neutral-700 text-xs">
                    <span className="flex items-center gap-2">
                        <Mail className="size-4 text-neutral-500" {...icon} />
                        elena@umbrella.health
                    </span>
                    <span className="flex items-center gap-2">
                        <MapPin className="size-4 text-neutral-500" {...icon} />
                        Berlin · 16:42 local time
                    </span>
                </div>
            </SheetSection>
            <SheetSection className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Fact label="Plan" value="Enterprise" />
                <Fact label="MRR" value="€6,200" />
                <Fact label="Customer since" value="March 2023" />
                <Fact
                    label="Health"
                    value={
                        <Badge tone="success" variant="dot">
                            Good
                        </Badge>
                    }
                />
            </SheetSection>
            <SheetSection className="flex flex-col gap-4">
                <Meter caption="48 of 60" label="Seats" max={60} value={48} />
                <Meter caption="81%" label="API quota" max={100} tone="warning" value={81} />
            </SheetSection>
            <SheetSection className="flex flex-col gap-3">
                <span className="text-neutral-600 text-xs">Earlier conversations</span>
                {history.map(item => (
                    <div className="flex min-w-0 items-center gap-2 text-xs" key={item.token}>
                        <ChatToken tone="neutral">{item.token}</ChatToken>
                        <span className="min-w-0 flex-1 truncate text-neutral-900">
                            {item.subject}
                        </span>
                        <Badge tone={item.tone}>{item.status}</Badge>
                    </div>
                ))}
            </SheetSection>
            <SheetSection className="flex flex-wrap gap-2">
                <Chip>billing</Chip>
                <Chip>enterprise</Chip>
                <Chip>priority</Chip>
            </SheetSection>
        </div>
    </aside>
);

const draft =
    "Hi Elena, you're right: the October invoice went through twice on the 1st. I've refunded the second charge of €6,200 just now; it shows on your card in 3–5 working days.";

export const SupportScreen = () => (
    <Frame
        actions={
            <div className="mr-1 flex items-center gap-2 text-neutral-600 text-xs">
                <Clock className="size-4" {...icon} />
                <span className="tabular-nums">First reply due in 42m</span>
            </div>
        }
        place="inbox"
        trail={['Inbox', 'Billing', '#4821']}
    >
        <div className="flex min-h-0 flex-1 flex-col pr-84">
            <div className="mx-auto flex min-h-0 w-full max-w-170 flex-1 flex-col px-6 pt-10">
                <div className="flex items-start justify-between gap-6 pb-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate font-medium text-neutral-950 text-xl">
                                Charged twice for October
                            </h1>
                            <Badge tone="warning" variant="dot">
                                Open
                            </Badge>
                        </div>
                        <p className="truncate text-neutral-600 text-sm">
                            #4821 · Elena Brandt via email · 2 hours ago
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button aria-label="More" size="icon" variant="ghost">
                            <Ellipsis {...icon} />
                        </Button>
                        <Button variant="secondary">Snooze</Button>
                        <Button>
                            Resolve
                            <CircleCheck {...icon} />
                        </Button>
                    </div>
                </div>
                <ChatThread className="-mx-4 flex-1 overflow-hidden">
                    <ChatEvent time="14:02">Elena Brandt opened the conversation</ChatEvent>
                    <ChatMessage
                        author="Elena Brandt"
                        avatar={<Person initials="EB" />}
                        time="14:02"
                    >
                        Hello, our card was charged €6,200 twice for the October invoice, on the 1st
                        and again on the 2nd. Could you look into it and refund the second one? Our
                        month-end close is on Friday.
                    </ChatMessage>
                    <ChatReference
                        status={<Badge tone="error">Paid twice</Badge>}
                        token="INV-2026-1043"
                    >
                        €6,200.00
                    </ChatReference>
                    <ChatEvent time="14:20">Maya Chen assigned it to herself</ChatEvent>
                    <ChatMessage
                        author="Liam Ortiz"
                        avatar={<Person initials="LO" />}
                        badge={<Badge tone="warning">Internal note</Badge>}
                        time="14:31"
                    >
                        The retry job ran after the first charge had settled. Refund approved on our
                        side, <ChatToken>RF-88213</ChatToken> is queued.
                    </ChatMessage>
                    <ChatMessage status="read" time="14:34" variant="own">
                        Thanks Elena, I can see both charges. Billing is on it; I'll confirm as soon
                        as the refund is out.
                    </ChatMessage>
                </ChatThread>
                <div className="flex flex-col gap-2 pt-2 pb-4">
                    <ChatComposer
                        defaultValue={draft}
                        label="Reply"
                        start={
                            <Button aria-label="Attach a file" size="icon" variant="ghost">
                                <Paperclip {...icon} />
                            </Button>
                        }
                    />
                    <div className="flex items-center gap-2 px-1 text-neutral-500 text-xxs">
                        <Avatar fallback="MC" shape="round" size={24} />
                        <span>Replying as Maya Chen · Enter to send</span>
                    </div>
                </div>
            </div>
        </div>
        <CustomerSheet />
    </Frame>
);
