import {
    Avatar,
    Card,
    ChatComposer,
    ChatMessage,
    ChatThread,
    ChatTyping,
    chatTypingLabel,
} from 'continuum';
import { Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const people = ['Maya Chen', 'Liam Ortega', 'Noor Haddad', 'Sam Okafor', 'Ines Duarte', 'Tom Berg'];

const knobs: Knob[] = [
    {
        id: 'count',
        label: 'Typing',
        options: [
            o('0', 'Nobody'),
            o('1', 'One'),
            o('2', 'Two'),
            o('3', 'Three'),
            o('4', 'Four'),
            o('6', 'Six'),
        ],
        default: '1',
    },
    { id: 'avatars', label: 'Avatars', switch: true, default: true },
    { id: 'label', label: 'Name who is typing', switch: true, default: true },
];

const ChatTypingPreview = ({ knobs: values }: PreviewProps) => {
    const names = people.slice(0, Number(values.count));

    return (
        <div className="flex w-full max-w-100 flex-col gap-3">
            <ChatMessage
                author="Maya Chen"
                avatar={<Avatar fallback="MC" shape="round" size={24} />}
                time="3:12 PM"
            >
                Who can take the Northwind renewal?
            </ChatMessage>
            {/* Its place: the composer's typing slot, a row just above the box. */}
            <ChatComposer
                placeholder="Message #deals"
                typing={
                    <ChatTyping
                        avatars={Boolean(values.avatars)}
                        label={list =>
                            chatTypingLabel(list.map(name => name.split(' ')[0] ?? name))
                        }
                        names={names}
                        showLabel={Boolean(values.label)}
                    />
                }
            />
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-typing',
    name: 'Chat typing',
    category: 'ai',
    description: 'Who is typing: their faces and three dots in a pill, just above the composer.',
    knobs,
    Preview: ChatTypingPreview,
};

/* ---------- In use: a team channel where people start and stop typing ---------- */

// Who is typing over time, in ms after the page opens; it loops, as a busy channel does.
const beats: [number, string[]][] = [
    [0, []],
    [1200, ['Liam Ortega']],
    [3000, ['Liam Ortega', 'Noor Haddad']],
    [4800, ['Liam Ortega', 'Noor Haddad', 'Sam Okafor', 'Ines Duarte']],
    [7200, ['Noor Haddad']],
    [9000, []],
];
const loop = 10500;

const useBeats = () => {
    const [typing, setTyping] = useState<string[]>([]);

    useEffect(() => {
        let timers: number[] = [];
        const run = () => {
            timers = beats.map(([at, names]) => window.setTimeout(() => setTyping(names), at));
            timers.push(window.setTimeout(run, loop));
        };
        run();
        return () => timers.forEach(clearTimeout);
    }, []);

    return typing;
};

const ChannelPage = () => {
    const typing = useBeats();

    return (
        <AppWindow
            description="Renewals and expansions, the finance and sales leads."
            place="inbox"
            title={
                <span className="inline-flex items-center gap-1.5">
                    <Hash {...icon} className="size-5 text-neutral-500" /> deals
                </span>
            }
            trail={['Inbox', '#deals']}
            width="default"
        >
            <Card className="gap-0 p-0">
                <ChatThread className="h-64 w-full">
                    <ChatMessage
                        author="Maya Chen"
                        avatar={<Avatar fallback="MC" shape="round" size={24} />}
                        time="3:12 PM"
                    >
                        Northwind wants to move to Enterprise before the quarter closes. Who can
                        take the call on Thursday?
                    </ChatMessage>
                    <ChatMessage
                        author="Tom Berg"
                        avatar={<Avatar fallback="TB" shape="round" size={24} />}
                        time="3:14 PM"
                    >
                        I can join for the pricing part, not the whole hour.
                    </ChatMessage>
                </ChatThread>
                {/* The composer at the thread's foot; who is typing shows just above its box. */}
                <div className="px-3 pb-3">
                    <ChatComposer
                        placeholder="Message #deals"
                        typing={<ChatTyping avatars names={typing} />}
                    />
                </div>
            </Card>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'A busy channel',
    note: 'People start and stop typing above the composer: one face, then two, then three of four, and the box never moves.',
    app: true,
    render: () => <ChannelPage />,
};
