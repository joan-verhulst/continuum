import {
    Avatar,
    Card,
    ChatComposer,
    ChatMessage,
    ChatSuggestion,
    ChatSuggestions,
    ChatThread,
    ChatToken,
    useChatTrigger,
} from 'continuum';
import { FileText, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

/* ---------- What a "#" and an "@" suggest ---------- */

type Option = { label: string; meta: string };

const applications: Option[] = [
    { label: '#app_1CU94h5MjxVV', meta: 'Maya Chen' },
    { label: '#app_3Hk2Pq8WnLzA', meta: 'Liam Ortega' },
    { label: '#app_7Rt5Vb2YcXmE', meta: 'Noor Haddad' },
    { label: '#app_9Fd4Gs6JhKwQ', meta: 'Eva Tyrell' },
];

const people: Option[] = [
    { label: '@Maya Chen', meta: 'Finance' },
    { label: '@Liam Ortega', meta: 'Sales' },
    { label: '@Sam Okafor', meta: 'Support' },
    { label: '@Tom Berg', meta: 'Sales' },
];

const lists = {
    '#': { options: applications, title: 'Recent applications', empty: 'No applications match' },
    '@': { options: people, title: 'People', empty: 'Nobody matches' },
} as const;

type Trigger = keyof typeof lists;

const matching = (options: Option[], query: string) => {
    const q = query.toLowerCase();
    return options.filter(
        option => option.label.toLowerCase().includes(q) || option.meta.toLowerCase().includes(q),
    );
};

/** A composer whose "#" or "@" opens the suggestions; the pick goes into the draft. */
const SuggestingComposer = ({
    trigger,
    draft,
    setDraft,
    title,
    placeholder,
}: {
    trigger: Trigger;
    draft: string;
    setDraft: (value: string) => void;
    title: boolean;
    placeholder: string;
}) => {
    const match = useChatTrigger(draft, { trigger });
    const list = lists[trigger];
    const options = matching(list.options, match.query);

    return (
        <ChatComposer
            onSuggestionsClose={match.dismiss}
            onValueChange={setDraft}
            placeholder={placeholder}
            suggestions={
                match.open ? (
                    <ChatSuggestions empty={list.empty} title={title ? list.title : undefined}>
                        {options.map(option => (
                            <ChatSuggestion
                                key={option.label}
                                leading={
                                    trigger === '#' ? (
                                        <FileText {...icon} />
                                    ) : (
                                        <UserRound {...icon} />
                                    )
                                }
                                meta={option.meta}
                                onSelect={() => setDraft(match.insert(option.label))}
                            >
                                {option.label}
                            </ChatSuggestion>
                        ))}
                    </ChatSuggestions>
                ) : undefined
            }
            value={draft}
        />
    );
};

/* ---------- Preview ---------- */

const knobs: Knob[] = [
    {
        id: 'trigger',
        label: 'Trigger',
        options: [o('#', '# Records'), o('@', '@ People')],
        default: '#',
    },
    { id: 'empty', label: 'Empty state', switch: true, default: false },
    { id: 'title', label: 'Title', switch: true, default: true },
];

const drafts: Record<Trigger, [string, string]> = {
    '#': ['Also, I noticed #a', 'Also, I noticed #zz'],
    '@': ['Can you check with @m', 'Can you check with @zz'],
};

const Demo = ({ trigger, empty, title }: { trigger: Trigger; empty: boolean; title: boolean }) => {
    const [draft, setDraft] = useState(drafts[trigger][empty ? 1 : 0]);

    return (
        <div className="flex w-full max-w-120 flex-col">
            <SuggestingComposer
                draft={draft}
                placeholder="Message #payment issue"
                setDraft={setDraft}
                title={title}
                trigger={trigger}
            />
        </div>
    );
};

const ChatSuggestionsPreview = ({ knobs: values }: PreviewProps) => {
    const trigger = values.trigger as Trigger;
    const empty = Boolean(values.empty);
    // A new setting starts the draft over with its trigger typed.
    return (
        <Demo
            empty={empty}
            key={`${trigger}-${empty}`}
            title={Boolean(values.title)}
            trigger={trigger}
        />
    );
};

export const entry: Entry = {
    id: 'chat-suggestions',
    name: 'Chat suggestions',
    category: 'ai',
    description:
        'What a “#” or “@” being typed could mean, in a panel over the composer; the arrows move, Enter picks.',
    stageClassName: 'items-end',
    hero: 'min-h-110 items-end',
    knobs,
    Preview: ChatSuggestionsPreview,
};

/* ---------- In use: a "#" typed in a reply opens the applications ---------- */

const typed = 'Same account as #app_7';

const ReviewThread = () => {
    const [draft, setDraft] = useState('');
    // The script types until the reader takes the box over.
    const scripted = useRef(true);

    const cardRef = useRef<HTMLDivElement>(null);

    // It starts typing once the piece is in view: the open list keeps its active row in view,
    // which would otherwise pull the page down to it.
    useEffect(() => {
        const node = cardRef.current;
        if (!node) return;
        let timers: number[] = [];
        const observer = new IntersectionObserver(
            ([seen]) => {
                if (!seen?.isIntersecting) return;
                observer.disconnect();
                timers = Array.from(typed, (_, i) =>
                    window.setTimeout(
                        () => {
                            if (scripted.current) setDraft(typed.slice(0, i + 1));
                        },
                        600 + i * 70,
                    ),
                );
            },
            { threshold: 0.6 },
        );
        observer.observe(node);
        return () => {
            observer.disconnect();
            timers.forEach(clearTimeout);
        };
    }, []);

    return (
        <Card className="gap-0 p-0" ref={cardRef}>
            <ChatThread className="h-72 w-full">
                <ChatMessage
                    author="Maya Chen"
                    avatar={<Avatar fallback="MC" shape="round" size={24} />}
                    time="4:02 PM"
                >
                    <ChatToken>#app_3Hk2Pq8WnLzA</ChatToken> uses the same bank account as an
                    application from last week. Anyone know if it is the same company?
                </ChatMessage>
            </ChatThread>
            <div className="px-3 pb-3">
                <SuggestingComposer
                    draft={draft}
                    placeholder="Reply to Maya"
                    setDraft={value => {
                        scripted.current = false;
                        setDraft(value);
                    }}
                    title
                    trigger="#"
                />
            </div>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Point at an application',
    note: 'A reply that types “#app_7”: the recent applications open over the box, narrowed as it goes to the one meant, and Enter puts its token in.',
    app: true,
    render: () => (
        <AppWindow
            description="Applications flagged by the checks, for a second look."
            place="inbox"
            title="Review queue"
            trail={['Inbox', 'Review queue']}
            width="default"
        >
            <ReviewThread />
        </AppWindow>
    ),
};
