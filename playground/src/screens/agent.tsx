import {
    AppPanel,
    AppShell,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbMenu,
    BreadcrumbSeparator,
    Button,
    ChatMessage,
    type ChatMessageProps,
    ChatPrompt,
    ChatThread,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    HeaderBar,
} from 'continuum';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useScreenNav } from './shared';
import { WorkspaceSidebar } from './workspace';

const icon = { strokeWidth: 2 } as const;

/* ---------- The assistant: a question in, a reply written out word by word ---------- */

export type Turn = { id: number; own: boolean; text: string; pending?: boolean };

// Before the first words: long enough to read as thinking, short enough not to wait on.
const THINK = 900;
// Between words while the reply streams.
const WORD = 32;

const stillMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A canned assistant: `ask` adds the question and a pending reply, thinks, then writes the answer
 * out a word at a time (all at once under reduced motion); `stop` keeps what was written so far.
 */
export const useAssistant = (initial: Turn[] = []) => {
    const [turns, setTurns] = useState<Turn[]>(initial);
    const [streaming, setStreaming] = useState(false);
    const timers = useRef<number[]>([]);
    const next = useRef(initial.length);

    const clear = () => {
        for (const timer of timers.current) window.clearTimeout(timer);
        timers.current = [];
    };

    // Leaving the page stops a reply mid-word rather than writing into nothing.
    useEffect(
        () => () => {
            for (const timer of timers.current) window.clearTimeout(timer);
        },
        [],
    );

    const settle = (id: number) => {
        // A reply stopped before its first word leaves nothing behind.
        setTurns(current =>
            current
                .filter(turn => !(turn.id === id && turn.text === ''))
                .map(turn => (turn.id === id ? { ...turn, pending: false } : turn)),
        );
        setStreaming(false);
    };

    const ask = (question: string, answer: string) => {
        clear();
        next.current += 2;
        const id = next.current;
        setTurns(current => [
            ...current,
            { id: id - 1, own: true, text: question },
            { id, own: false, text: '', pending: true },
        ]);
        setStreaming(true);

        const write = (text: string) =>
            setTurns(current => current.map(turn => (turn.id === id ? { ...turn, text } : turn)));

        if (stillMotion()) {
            timers.current.push(
                window.setTimeout(() => {
                    write(answer);
                    settle(id);
                }, THINK),
            );
            return;
        }

        const words = answer.split(' ');
        words.forEach((_, i) => {
            timers.current.push(
                window.setTimeout(() => write(words.slice(0, i + 1).join(' ')), THINK + i * WORD),
            );
        });
        timers.current.push(
            window.setTimeout(() => settle(id), THINK + words.length * WORD + WORD),
        );
    };

    const stop = () => {
        clear();
        settle(next.current);
    };

    const load = (loaded: Turn[]) => {
        clear();
        next.current = loaded.length;
        setTurns(loaded);
        setStreaming(false);
    };

    return { turns, streaming, ask, stop, load };
};

/**
 * One turn of the conversation: the question on the tint, the assistant's reply as a card. Pass
 * `variant` as the turn's side, so the thread knows one's own question from the element alone; the
 * rest (the thread's `data-enter`) goes on to the message.
 */
export const AssistantTurn = ({
    turn,
    variant: _variant,
    ...props
}: Omit<ChatMessageProps, 'children'> & { turn: Turn }) =>
    turn.own ? (
        <ChatMessage {...props} variant="own">
            {turn.text}
        </ChatMessage>
    ) : (
        <ChatMessage
            {...props}
            author="Assistant"
            badge={<Badge tone="primary">AI</Badge>}
            pending={turn.pending}
            variant="other"
        >
            {turn.text}
        </ChatMessage>
    );

/* ---------- The workspace's chats ---------- */

type Chat = {
    id: string;
    title: string;
    age: string;
    dateTime: string;
    unread?: boolean;
    question: string;
    answer: string;
};

const recent: Chat[] = [
    {
        id: 'past-due',
        title: 'Customers past due this month',
        age: '3h',
        dateTime: '2026-10-28T11:20',
        unread: true,
        question: 'Which customers are past due this month?',
        answer: 'Five: Initech (€980 a month, Sara Kim), Juniper Health, Vantage Point, Fernhill Foods and Zephyr Cloud. Initech is the largest and was last seen an hour ago; Zephyr Cloud has not been seen in three months.',
    },
    {
        id: 'northwind',
        title: 'Renewal note for Northwind Traders',
        age: '1d',
        dateTime: '2026-10-27T16:05',
        question: 'Draft a renewal note for Northwind Traders.',
        answer: 'Hi team at Northwind, your Enterprise plan for 120 seats renews on 1 December. Nothing changes unless you tell us: the same price, €40 a seat. Maya Chen is happy to walk through the year with you before then.',
    },
    {
        id: 'initech',
        title: 'Why Initech’s invoice failed',
        age: '2d',
        dateTime: '2026-10-26T09:40',
        question: 'Why did Initech’s last invoice fail?',
        answer: 'The card on file expired at the end of September, so the October charge of €980 was declined twice. Sara Kim was told on the 3rd; a new card has not been added yet.',
    },
    {
        id: 'trials',
        title: 'Trials ending in November',
        age: '5d',
        dateTime: '2026-10-23T14:12',
        question: 'Which trials end in November?',
        answer: 'Three: Hooli and Wayne Studio on Starter, and Riverbend Media on Pro with 10 seats. Riverbend has been seen today; the other two not since the start of the week.',
    },
    {
        id: 'seats',
        title: 'Seat growth by customer',
        age: '11d',
        dateTime: '2026-10-17T10:30',
        question: 'Which customers added the most seats this quarter?',
        answer: 'Umbrella Health added 35 seats, Northwind Traders 20 and Stark Logistics 15. Together that is €2,800 more a month.',
    },
];

// What the assistant says to a question it has no chat for: the workspace, briefly.
const answer =
    'I looked across the 48 customers in the workspace. Three things stand out: Initech is past due on €980 a month, Hooli and Wayne Studio are on trials that end this month, and Northwind Traders added 20 seats in October. Shall I draft a note to Initech’s owner, Sara Kim?';

/* ---------- The screen ---------- */

/**
 * Agent: the workspace's assistant. Empty, the page is a large prompt with the recent chats under
 * it; once a question is sent it becomes the conversation, the reply written out as it comes and the
 * prompt docked at the panel's foot. The trail's last crumb is the chat, and its menu starts a new
 * one or opens a recent one.
 */
export const Agent = () => {
    const nav = useScreenNav();
    const { turns, streaming, ask, stop, load } = useAssistant();
    const [title, setTitle] = useState<string>();
    const [unread, setUnread] = useState(
        () => new Set(recent.filter(c => c.unread).map(c => c.id)),
    );
    const empty = turns.length === 0;

    const open = (chat: Chat) => {
        load([
            { id: 1, own: true, text: chat.question },
            { id: 2, own: false, text: chat.answer },
        ]);
        setTitle(chat.title);
        setUnread(current => {
            const rest = new Set(current);
            rest.delete(chat.id);
            return rest;
        });
    };

    const send = (question: string) => {
        if (empty) setTitle(question);
        ask(question, answer);
    };

    const fresh = () => {
        load([]);
        setTitle(undefined);
    };

    return (
        <AppShell className="h-full min-h-0 min-w-7xl">
            <WorkspaceSidebar place="agent" />
            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#" onClick={() => nav.open('dashboard')}>
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#" onClick={fresh}>
                                    Agent
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem className="min-w-0">
                                <BreadcrumbMenu
                                    className="min-w-0 text-neutral-950 [&>span]:truncate"
                                    label={<span>{title ?? 'New chat'}</span>}
                                >
                                    <DropdownMenuItem onClick={fresh}>
                                        <Plus {...icon} />
                                        New chat
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>Recent</DropdownMenuLabel>
                                        {recent.map(chat => (
                                            <DropdownMenuItem
                                                key={chat.id}
                                                onClick={() => open(chat)}
                                            >
                                                <span className="min-w-0 flex-1 truncate">
                                                    {chat.title}
                                                </span>
                                                <span className="ml-auto pl-3 text-neutral-600 tabular-nums">
                                                    {chat.age}
                                                </span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuGroup>
                                </BreadcrumbMenu>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>
                {empty ? (
                    <div className="min-h-0 flex-1 overflow-y-auto px-4">
                        {/* The prompt a third of the way down, the chats under it at its width. */}
                        <div className="mx-auto flex w-full max-w-conversation flex-col gap-6 pt-40 pb-24">
                            <ChatPrompt onSend={send} placeholder="Ask the workspace…" />
                            {/* The recent chats as quiet rows: the title, its age at the right, a
                                dot in the side padding for an unread one, so titles stay on one line. */}
                            <ul aria-label="Recent chats" className="flex min-w-0 flex-col">
                                {recent.map(chat => (
                                    <li className="flex min-w-0" key={chat.id}>
                                        <Button
                                            className="relative w-full min-w-0 justify-start gap-3 px-4 font-normal text-neutral-950 hover:text-neutral-950 data-[icon=both]:px-4"
                                            onClick={() => open(chat)}
                                            variant="ghost"
                                        >
                                            {unread.has(chat.id) && (
                                                <span
                                                    aria-hidden
                                                    className="absolute top-1/2 left-[calc((--spacing(4)-6px)/2)] size-1.5 -translate-y-1/2 rounded-full bg-primary-500"
                                                />
                                            )}
                                            <span className="min-w-0 flex-1 truncate text-left">
                                                {unread.has(chat.id) && (
                                                    <span className="sr-only">Unread: </span>
                                                )}
                                                {chat.title}
                                            </span>
                                            <time
                                                className="shrink-0 text-neutral-600 tabular-nums"
                                                dateTime={chat.dateTime}
                                            >
                                                {chat.age}
                                            </time>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <>
                        <ChatThread className="flex-1 px-[max(--spacing(4),calc((100%-var(--spacing-conversation))/2))] pt-10">
                            {turns.map(turn => (
                                <AssistantTurn
                                    key={turn.id}
                                    turn={turn}
                                    variant={turn.own ? 'own' : 'other'}
                                />
                            ))}
                        </ChatThread>
                        <div className="shrink-0 px-4 pb-4">
                            {/* It mounts on a send or an opened chat, which unmount what had focus: the
                                caret moves here, so the next question can be typed straight away. */}
                            <ChatPrompt
                                autoFocus
                                className="mx-auto w-full max-w-conversation"
                                onSend={send}
                                onStop={stop}
                                placeholder="Ask a follow-up…"
                                size="md"
                                streaming={streaming}
                            />
                        </div>
                    </>
                )}
            </AppPanel>
        </AppShell>
    );
};
