'use client';

import {
    Badge,
    Button,
    ChatAttachment,
    ChatAttachments,
    ChatEvent,
    ChatMessage,
    ChatMessageStat,
    ChatReference,
    ChatThread,
    ChatToken,
    ChatTyping,
    ChatUnreadDivider,
    Chip,
    cn,
    MessageComposer,
    SheetBody,
    SheetSection,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@contui/ui';
import {
    CircleCheck,
    Clock,
    FileText,
    Gauge,
    Mail,
    MapPin,
    PanelRight,
    Phone,
    ReceiptEuro,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { compact, Frame, icon, Person, useRoom } from './shell';

/*
 * Inbox, one conversation. Elena Brandt, who runs finance at Umbrella Health, was charged twice for
 * October. The assistant answers her first, as one more author in the chat: the AI badge and its
 * stats (how sure it is, the files it read, her account), the invoice linked under it. Then it is
 * Maya's: Liam approves the refund in an internal note (the retry bug, PLT-1284, stays internal),
 * and Maya's reply waits in the composer with the refund linked, while Elena types again. The customer is read beside the thread in a
 * sheet (non-modal, the page still usable), drawn in place so the picture holds still: who she is,
 * her account's facts, the invoices the question is about and what she asked before.
 *
 * Drawn at its least room (722 under the header bar) every message and section is whole; a taller
 * window shows more of the history and more of the account, rather than empty room.
 */

/** The assistant's face in the thread: its mark on the selected wash, round as a person's. */
const AssistantMark = () => (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tint text-tint-fg">
        <Sparkles className="size-3.5" {...icon} />
    </span>
);

/** One fact of the grid: the label over its value, 6 apart (the detail page's facts). */
const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-neutral-600 text-xs">{label}</span>
        <span className="truncate font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </div>
);

/** A sheet section's quiet title, as a list card's: 13 regular, the rows 16 under it. */
const SectionLabel = ({ children, end }: { children: ReactNode; end?: ReactNode }) => (
    <div className="flex items-center justify-between gap-3">
        <h3 className="truncate font-normal text-neutral-600 text-xs">{children}</h3>
        {end}
    </div>
);

const invoices = [
    {
        id: 'INV-2026-1043',
        date: '1 Oct',
        amount: '€4,800.00',
        status: 'Paid twice',
        tone: 'error',
    },
    { id: 'INV-2026-0977', date: '1 Sep', amount: '€4,800.00', status: 'Paid', tone: 'success' },
    { id: 'INV-2026-0912', date: '1 Aug', amount: '€4,800.00', status: 'Paid', tone: 'success' },
    { id: 'INV-2026-0851', date: '1 Jul', amount: '€4,480.00', status: 'Paid', tone: 'success' },
    { id: 'INV-2026-0790', date: '1 Jun', amount: '€4,480.00', status: 'Paid', tone: 'success' },
] as const;

const earlier = [
    { token: '#4790', subject: 'SSO for the Lisbon office', when: '3 Oct', status: 'Resolved' },
    { token: '#4712', subject: 'Export to NetSuite fails', when: '18 Sep', status: 'Resolved' },
    { token: '#4655', subject: 'Seat pricing for 40 more', when: '27 Aug', status: 'Resolved' },
] as const;

/** The customer, read beside the thread: the sheet's anatomy, drawn without its portal. */
const CustomerSheet = () => {
    const room = useRoom();
    // At the least room the account ends at its invoices, whole; a taller sheet adds a row of facts,
    // then more invoices, then what she asked before.
    const shownInvoices = invoices.slice(0, room >= 960 ? 5 : 4);
    const shownEarlier = earlier.slice(0, room >= 920 ? 3 : 2);
    return (
        <aside
            aria-label="Customer"
            // On a phone the conversation is the page: the sheet read beside it is not drawn.
            className={cn(
                'absolute top-4 right-4 bottom-4 flex w-sheet flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 shadow-sheet',
                compact.hidden,
            )}
            data-slot="sheet-content"
        >
            {/* SheetHeader's close is a Dialog part, which needs the open sheet: its anatomy, drawn here. */}
            <div className="flex h-bar shrink-0 items-center gap-2 border-neutral-200 border-b pr-1.5 pl-4">
                <UserRound className="size-4 shrink-0 text-neutral-950" {...icon} />
                <h2 className="min-w-0 flex-1 truncate font-medium text-neutral-950 text-sm">
                    Customer
                </h2>
                <Button aria-label="Close" className="size-option" size="icon" variant="ghost">
                    <X {...icon} />
                </Button>
            </div>
            <SheetBody className="overflow-hidden">
                <SheetSection className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <Person initials="EB" size={36} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate font-medium text-neutral-950 text-xs">
                                Elena Brandt
                            </span>
                            <span className="truncate text-neutral-600 text-xs">
                                Head of Finance, Umbrella Health
                            </span>
                        </div>
                        <Badge tone="success" variant="dot">
                            Healthy
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-neutral-700 text-xs [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600">
                        <span className="flex items-center gap-2">
                            <Mail {...icon} />
                            elena@umbrella.health
                        </span>
                        <span className="flex items-center gap-2 tabular-nums">
                            <Phone {...icon} />
                            +49 30 5557 1204
                        </span>
                        <span className="flex items-center gap-2 tabular-nums">
                            <MapPin {...icon} />
                            Berlin · 15:38 there
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Chip>Enterprise</Chip>
                        <Chip>EU data residency</Chip>
                        <Chip>Finance contact</Chip>
                        <Chip>Renewal Q4</Chip>
                    </div>
                </SheetSection>
                <SheetSection className="grid grid-cols-3 gap-x-6 gap-y-5">
                    <Fact label="Plan" value="Enterprise, annual" />
                    <Fact label="MRR" value="€4,800" />
                    <Fact label="Customer since" value="March 2023" />
                    <Fact label="Account owner" value="Maya Chen" />
                    <Fact label="Renews" value="1 Dec 2026" />
                    <Fact label="Seats" value="112 of 120" />
                    {room >= 780 && (
                        <>
                            <Fact label="Pays by" value="Visa ···· 4417" />
                            <Fact label="Lifetime value" value="€131,200" />
                            <Fact label="Open tickets" value="1 of 14" />
                        </>
                    )}
                </SheetSection>
                <SheetSection className="flex flex-col gap-4">
                    <SectionLabel>Invoices</SectionLabel>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Issued</TableHead>
                                <TableHead numeric>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shownInvoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell className="text-neutral-700">
                                        {invoice.date}
                                    </TableCell>
                                    <TableCell numeric>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge tone={invoice.tone}>{invoice.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SheetSection>
                {room >= 880 && (
                    <SheetSection className="flex flex-col gap-4">
                        <SectionLabel>Earlier conversations</SectionLabel>
                        <div className="flex flex-col gap-3">
                            {shownEarlier.map(item => (
                                <div
                                    className="flex h-6 min-w-0 items-center gap-3 text-xs"
                                    key={item.token}
                                >
                                    <ChatToken tone="neutral">{item.token}</ChatToken>
                                    <span className="min-w-0 flex-1 truncate text-neutral-900">
                                        {item.subject}
                                    </span>
                                    <span className="shrink-0 text-neutral-600 tabular-nums">
                                        {item.when}
                                    </span>
                                    <Badge tone="success">{item.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </SheetSection>
                )}
            </SheetBody>
        </aside>
    );
};

/**
 * The thread, its messages resting on the composer as a chat's do. The whole history is drawn and
 * the thread opens at the latest, as the app's does: in a short window the oldest messages sit above
 * the fold and the picture reads as a conversation scrolled to its end, never as an emptied one.
 * The thread is its own scroll region, the formula's block gap (40) under the head; its top edge
 * fades over 24, so what is above the fold slips softly out under that gap and never touches the
 * title. The history reaches back to an earlier, resolved exchange, so the thread overflows its room
 * at every spacing a theme picks: tighter spacing never leaves the leftover room as a gap under the
 * head.
 */
const Thread = () => (
    <ChatThread className="-mx-4 min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_--spacing(6))] *:first:mt-auto">
        <ChatEvent time="2 Sep">Elena Brandt wrote in by email</ChatEvent>
        <ChatMessage author="Elena Brandt" avatar={<Person initials="EB" />} time="2 Sep">
            Could the invoices go to our new finance address from October on?
        </ChatMessage>
        <ChatMessage status="read" time="2 Sep" variant="own">
            Done: from October they go to finance@umbrella.health.
        </ChatMessage>
        <ChatEvent time="2 Sep">Maya Chen resolved the conversation</ChatEvent>
        <ChatEvent time="14:02">Elena Brandt wrote in by email</ChatEvent>
        <ChatMessage
            attached={
                <ChatAttachments variant="other">
                    <ChatAttachment name="Card statement October.pdf" />
                    <ChatAttachment name="Charges 1–2 Oct.png" />
                </ChatAttachments>
            }
            author="Elena Brandt"
            avatar={<Person initials="EB" />}
            time="14:02"
        >
            Hi, we were charged €4,800 twice for October. Could you refund the second?
        </ChatMessage>
        <ChatMessage
            attached={
                <ChatReference
                    status={<Badge tone="error">Paid twice</Badge>}
                    token="INV-2026-1043"
                >
                    €4,800.00 × 2
                </ChatReference>
            }
            author="Assistant"
            avatar={<AssistantMark />}
            badge={<Badge tone="primary">AI</Badge>}
            // What the answer drew on: how sure it is, Elena's two files, and her account.
            stats={
                <>
                    <ChatMessageStat icon={<Gauge {...icon} />} label="Confidence" value="94%" />
                    <ChatMessageStat icon={<FileText {...icon} />} label="Files read" value="2" />
                    <ChatMessageStat
                        icon={<UserRound {...icon} />}
                        label="Looked at Elena Brandt’s account"
                    />
                </>
            }
            time="14:03"
        >
            Hi Elena, I’ve checked: both charges are on{' '}
            <ChatToken tone="neutral">INV-2026-1043</ChatToken>. A payment retry ran after the first
            had settled, so the second is ours to refund. I’ve passed it to billing.
        </ChatMessage>
        <ChatMessage
            author="Liam Ortiz"
            avatar={<Person initials="LO" />}
            badge={<Badge tone="neutral">Internal note</Badge>}
            time="14:31"
        >
            Refund <ChatToken tone="neutral">RF-88213</ChatToken> is approved. The retry bug is{' '}
            <ChatToken tone="neutral">PLT-1284</ChatToken>; the fix ships tomorrow.
        </ChatMessage>
        <ChatUnreadDivider />
        <ChatMessage author="Elena Brandt" avatar={<Person initials="EB" />} time="14:37">
            Thank you. Will it reach the card before Friday?
        </ChatMessage>
    </ChatThread>
);

const draft =
    'Hi Elena, you’re right, October was charged twice. I’ve refunded the second €4,800: it reaches your card in 3–5 working days, before Friday.';

/** Maya's reply, drafted, with the refund linked to go with it; Elena typing above it. */
const Composer = () => (
    <div className="shrink-0 @max-shell-compact/shell:pb-4 pb-6">
        <MessageComposer
            attachments={
                <ChatAttachments>
                    <ChatAttachment
                        icon={<ReceiptEuro {...icon} />}
                        name="Refund"
                        onRemove={() => undefined}
                        status={<Badge tone="success">Approved</Badge>}
                        token="RF-88213"
                        variant="record"
                    />
                </ChatAttachments>
            }
            defaultValue={draft}
            label="Reply to Elena"
            onAdd={() => undefined}
            typing={<ChatTyping avatars names={['Elena Brandt']} />}
        />
    </div>
);

export const SupportScreen = () => (
    <Frame
        actions={
            <Button aria-label="Customer details" aria-pressed size="icon" variant="ghost">
                <PanelRight {...icon} />
            </Button>
        }
        place="inbox"
        trail={['Inbox', 'Billing', '#4821']}
    >
        {/* The thread keeps to the room left of the sheet: 16 + 512 + 16 at the right, and the
            page's own 24 beside it. On a phone there is no sheet: 16 a side, 40 under the bar. */}
        <div className="flex min-h-0 flex-1 flex-col @max-shell-compact/shell:px-4 pr-[calc(var(--spacing-sheet)+(--spacing(10)))] pl-6">
            <div className="mx-auto flex min-h-0 w-full max-w-conversation flex-1 flex-col @max-shell-compact/shell:pt-10 pt-24">
                <div className={cn('flex items-end justify-between gap-6 pb-10', compact.stack)}>
                    <div className="flex min-w-0 flex-col gap-1">
                        {/* On a phone the title wraps and its badge follows the last word, a space after it. */}
                        <div className="@max-shell-compact/shell:block flex min-w-0 items-center gap-2 @max-shell-compact/shell:text-2xl">
                            <h1
                                className={cn(
                                    '@max-shell-compact/shell:inline truncate font-medium text-2xl text-neutral-950',
                                    compact.wrap,
                                )}
                            >
                                Charged twice for October
                            </h1>{' '}
                            <Badge className="@max-shell-compact/shell:align-middle" tone="warning">
                                Open
                            </Badge>
                        </div>
                        <p className="flex min-w-0 @max-shell-compact/shell:flex-wrap items-center gap-1.5 @max-shell-compact/shell:gap-x-3 @max-shell-compact/shell:gap-y-1 text-neutral-600 text-sm">
                            <span className="truncate">#4821 · Umbrella Health</span>
                            <span className="@max-shell-compact/shell:ml-0 ml-1.5 flex shrink-0 items-center gap-1.5">
                                <Clock className="size-4 shrink-0" {...icon} />
                                <span className="tabular-nums">Reply due in 42m</span>
                            </span>
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button className={compact.hidden} variant="secondary">
                            Snooze
                        </Button>
                        <Button>
                            <CircleCheck {...icon} />
                            Resolve
                        </Button>
                    </div>
                </div>
                <Thread />
                <Composer />
            </div>
        </div>
        <CustomerSheet />
    </Frame>
);
