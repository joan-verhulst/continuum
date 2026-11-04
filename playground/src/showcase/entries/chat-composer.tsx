import {
    Badge,
    BarList,
    BarListItem,
    Button,
    Card,
    ChatComposer,
    ChatMessage,
    ChatThread,
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    StatCard,
} from 'continuum';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { AppScene, type Entry, type InUse, icon } from '../kit';

const ChatComposerPreview = () => {
    const [sent, setSent] = useState<string>();

    return (
        <div className="flex w-full max-w-80 flex-col gap-3">
            <ChatComposer onAdd={() => {}} onSend={setSent} placeholder="Message #payment issue" />
            <span className="text-neutral-500 text-xxs">
                {sent ? `Sent: ${sent}` : 'Enter sends'}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-composer',
    name: 'Chat composer',
    category: 'ai',
    description: 'A box that grows with the draft; Enter sends.',
    Preview: ChatComposerPreview,
};

const AskSheet = () => {
    const stage = useStageContainer();
    const [sent, setSent] = useState<string[]>([]);

    return (
        <Sheet open>
            <SheetContent
                className="w-[400px]"
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
                    {sent.map(text => (
                        <ChatMessage key={text} status="sent" time="now" variant="own">
                            {text}
                        </ChatMessage>
                    ))}
                </ChatThread>
                {/* The composer's own row at the foot, ruled off the thread edge to edge. */}
                <div className="shrink-0 border-neutral-200 border-t p-3">
                    <ChatComposer
                        defaultValue="Why did the bounce rate rise in August?"
                        onAdd={() => setSent(current => [...current, 'Attached q3-figures.xlsx'])}
                        onSend={text => setSent(current => [...current, text])}
                        placeholder="Ask about this report"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export const inUse: InUse = {
    title: 'Ask about a report',
    note: 'The composer at the foot of the assistant’s sheet, with a question drafted.',
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
                className: 'pr-[436px]',
                children: (
                    <>
                        <div className="grid grid-cols-2 gap-4">
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
